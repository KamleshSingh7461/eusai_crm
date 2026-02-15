import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

        let targetUserIds: string[] = [];

        if (userRole === 'DIRECTOR') {
            if (userIdParam) targetUserIds = [userIdParam];
        } else if (['MANAGER', 'TEAM_LEADER'].includes(userRole)) {
            const currentUser = await prisma.user.findUnique({
                where: { id: currentUserId },
                include: { subordinates: true }
            });
            const subordinateIds = currentUser?.subordinates.map(u => u.id) || [];
            const allowedIds = [currentUserId, ...subordinateIds];

            if (userIdParam) {
                if (!allowedIds.includes(userIdParam)) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
                targetUserIds = [userIdParam];
            } else {
                targetUserIds = allowedIds;
            }
        } else {
            if (userIdParam && userIdParam !== currentUserId) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            targetUserIds = [currentUserId];
        }

        const where: any = {};
        if (targetUserIds.length > 0) {
            where.userId = { in: targetUserIds };
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

        // Calculate performance score (simple average based on hours and tasks)
        const performanceScore = Math.min(
            100,
            Math.round((totalTasksCompleted * 5) + (totalHoursWorked * 2))
        );

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
                    avgTasksPerDay: totalTasksCompleted / 7,
                    avgHoursPerDay: totalHoursWorked / 7,
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
