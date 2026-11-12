import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { computeStreak, dayKey, getHolidays, todayStatus } from '@/lib/workdays';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    // streaks can run longer than a month: look back further, skipping weekends and holidays
    const streakFrom = new Date(today);
    streakFrom.setDate(today.getDate() - 120);

    // 1. Check for Daily Report & Streak
    const dailyReport = await prisma.dailyReport.findUnique({
        where: {
            userId_date: {
                userId,
                date: today
            }
        }
    });

    // Fetch last 30 days of reports for streak calculation
    const recentReports = await prisma.dailyReport.findMany({
        where: {
            userId,
            date: { gte: streakFrom }
        },
        select: { date: true },
        orderBy: { date: 'desc' }
    });

    // Streak: Saturdays, Sundays and Director-marked holidays never break it (see lib/workdays)
    const [holidays, today_] = await Promise.all([getHolidays(streakFrom, today), todayStatus()]);
    const streak = computeStreak(new Set(recentReports.map(r => dayKey(r.date))), holidays, today);

    // 2. Efficiency Score (Last 30 Days)
    const recentTasks = await prisma.task.findMany({
        where: {
            userId,
            createdAt: { gte: thirtyDaysAgo }
        },
        select: { status: true }
    });

    const totalRecentTasks = recentTasks.length;
    const completedRecentTasks = recentTasks.filter(t => t.status === 'DONE').length;
    const efficiencyScore = totalRecentTasks > 0
        ? Math.round((completedRecentTasks / totalRecentTasks) * 100)
        : 100; // Default to 100 if no tasks assigned recently

    // 3. Overdue Items
    const overdueTasksCount = await prisma.task.count({
        where: {
            userId,
            status: { not: 'DONE' },
            deadline: { lt: new Date() }
        }
    });

    const overdueMilestonesCount = await prisma.milestone.count({
        where: {
            owner: userId,
            status: { not: 'COMPLETED' },
            targetDate: { lt: new Date() }
        }
    });

    // 4. Get Data Objects
    const myMilestones = await prisma.milestone.findMany({
        where: { owner: userId },
        include: {
            university: { select: { name: true } },
            project: { select: { name: true } }
        },
        orderBy: { targetDate: 'asc' }
    });

    const myTasks = await prisma.task.findMany({
        where: {
            userId,
            status: { not: 'DONE' }
        },
        orderBy: { deadline: 'asc' },
        include: {
            project: { select: { name: true } }
        }
    });

    const pendingExpenses = await prisma.expense.findMany({
        where: {
            userId,
            status: 'PENDING'
        },
        include: {
            project: { select: { name: true } }
        },
        orderBy: { date: 'desc' },
        take: 5
    });

    return NextResponse.json({
        hasSubmittedReport: !!dailyReport,
        // no report due today (weekend or holiday): the dashboard shows a day-off note instead of a reminder
        todayOff: today_.isWorkingDay ? null : today_.reason,
        reportSubmissionTime: dailyReport?.submittedAt || null,
        kpi: {
            efficiencyScore,
            streak,
            overdueMissions: overdueTasksCount + overdueMilestonesCount,
            activeMilestones: myMilestones.filter(m => m.status !== 'COMPLETED').length,
            completedMilestones: myMilestones.filter(m => m.status === 'COMPLETED').length,
        },
        milestones: myMilestones,
        recentTasks: myTasks,
        pendingExpenses
    });
}
