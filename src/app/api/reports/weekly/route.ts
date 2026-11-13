import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { countWorkingDays, dayKey, getHolidays } from '@/lib/workdays';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMobileSession } from '@/lib/auth-mobile';
import { getSubordinateIds } from '@/lib/hierarchy';

// GET /api/reports/weekly - Fetch weekly reports
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const currentUserId = (session.user as any).id;

    try {
        const { searchParams } = new URL(request.url);
        const userIdParam = searchParams.get('userId');

        const allowedIds = await getSubordinateIds(currentUserId, userRole);

        let finalTargetIds: string[] | null = null;

        if (userIdParam) {
            if (allowedIds && !allowedIds.includes(userIdParam)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            finalTargetIds = [userIdParam];
        } else {
            finalTargetIds = allowedIds;
        }

        const where: any = {};
        if (finalTargetIds) {
            where.userId = { in: finalTargetIds };
        }

        const reports = await prisma.weeklyReport.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        image: true
                    }
                }
            },
            orderBy: { weekStartDate: 'desc' },
            take: 12
        });

        return NextResponse.json(reports);
    } catch (error) {
        console.error('Failed to fetch weekly reports:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

// POST /api/reports/weekly - Generate weekly report
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, weekStartDate } = body;

        // Weekly reports feed performance scores: only the scheduler (CRON_SECRET), Directors and Managers,
        // or the person themselves may generate one.
        const fromScheduler = !!process.env.CRON_SECRET && request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
        if (!fromScheduler) {
            const session = (await getServerSession(authOptions)) || (await getMobileSession());
            const me = session?.user as any;
            if (!me?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            const role = String(me.role || '').toUpperCase();
            if (me.id !== userId && !['DIRECTOR', 'ADMIN', 'MANAGER'].includes(role)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }
        if (!userId || !weekStartDate || isNaN(new Date(weekStartDate).getTime())) {
            return NextResponse.json({ error: 'userId and a valid weekStartDate are required' }, { status: 400 });
        }

        const weekStart = new Date(weekStartDate);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // Aggregate daily reports for the week
        const dailyReports = await prisma.dailyReport.findMany({
            where: {
                userId,
                date: {
                    gte: weekStart,
                    lte: weekEnd
                }
            }
        });

        const totalTasksCompleted = dailyReports.reduce((sum, r) => sum + r.tasksCompleted, 0);
        const totalHoursWorked = dailyReports.reduce((sum, r) => sum + r.hoursWorked, 0);
        const accomplishments = dailyReports.map(r => r.accomplishments).join('\n• ');

        // Calculate performance score (working-day baseline with a bonus for days off)
        // Baseline goal: 10 tasks + 40 hours per 5-day week = 90-100 score, scaled down when
        // the week has holidays. Work reported on a weekend or holiday counts as bonus.
        const holidays = await getHolidays(weekStart, weekEnd);
        const workingDays = countWorkingDays(weekStart, weekEnd, holidays);
        const isDayOff = (date: Date) => { const d = new Date(date); return d.getDay() === 0 || d.getDay() === 6 || holidays.has(dayKey(d)); };
        const weekdayReports = dailyReports.filter(r => !isDayOff(r.date));
        const weekendReports = dailyReports.filter(r => isDayOff(r.date));

        const weekdayTasks = weekdayReports.reduce((sum, r) => sum + r.tasksCompleted, 0);
        const weekdayHours = weekdayReports.reduce((sum, r) => sum + r.hoursWorked, 0);

        const weekendTasks = weekendReports.reduce((sum, r) => sum + r.tasksCompleted, 0);
        const weekendHours = weekendReports.reduce((sum, r) => sum + r.hoursWorked, 0);

        // Score logic: 
        // 1. Weekday contribution (capped at 100)
        // 2. Weekend contribution (added as potential over-performance)
        const baseScore = workingDays === 0
            ? 100 // a week of holidays: nothing was expected
            : Math.min(100, Math.round(((weekdayTasks * 7) + (weekdayHours * 1.5)) * (5 / workingDays)));
        const bonusScore = Math.round((weekendTasks * 5) + (weekendHours * 1));

        const performanceScore = Math.min(110, baseScore + bonusScore); // Max score 110 for overachievers

        const weeklyReport = await prisma.weeklyReport.create({
            data: {
                userId,
                weekStartDate: weekStart,
                weekEndDate: weekEnd,
                totalTasksCompleted,
                totalHoursWorked,
                keyAccomplishments: accomplishments || 'No accomplishments reported',
                performanceScore,
                kpiMetrics: JSON.stringify({
                    avgTasksPerDay: weekdayTasks / Math.max(workingDays, 1), // per working day (holidays excluded)
                    avgHoursPerDay: weekdayHours / Math.max(workingDays, 1),
                    workingDays,
                    weekendBonusTasks: weekendTasks,
                    weekendBonusHours: weekendHours,
                    completionRate: (totalTasksCompleted / Math.max(totalTasksCompleted, 1)) * 100
                })
            }
        });

        return NextResponse.json(weeklyReport, { status: 201 });
    } catch (error) {
        console.error('Failed to generate weekly report:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
