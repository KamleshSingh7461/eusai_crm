import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

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
            date: { gte: thirtyDaysAgo }
        },
        select: { date: true },
        orderBy: { date: 'desc' }
    });

    // Calculate streak (Working days aware: Saturdays & Sundays do not break streaks)
    let streak = 0;
    const reportDates = new Set(recentReports.map(r => r.date.toISOString().split('T')[0]));

    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (reportDates.has(dateStr)) {
            streak++;
        } else if (i === 0) {
            // If today is pending (not yet submitted), continue checking previous days
            continue;
        } else if (isWeekend) {
            // Saturday or Sunday with no report submitted: skip without breaking streak
            continue;
        } else {
            // Regular working day (Mon-Fri) missing a report: streak breaks
            break;
        }
    }

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
