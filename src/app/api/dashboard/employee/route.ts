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

    // 1. Check for Daily Report
    const dailyReport = await prisma.dailyReport.findUnique({
        where: {
            userId_date: {
                userId,
                date: today
            }
        }
    });

    // 2. Get My Pipeline Stats (Milestones I own)
    const myMilestones = await prisma.milestone.findMany({
        where: { owner: userId },
        select: { status: true, category: true }
    });

    // 3. Get Pending Tasks
    const myTasks = await prisma.task.findMany({
        where: {
            userId,
            status: { not: 'DONE' }
        },
        orderBy: { deadline: 'asc' },
        take: 5,
        include: {
            project: { select: { name: true } }
        }
    });

    // 4. Get Pending Expenses
    const pendingExpenses = await prisma.expense.findMany({
        where: {
            userId,
            status: 'PENDING'
        },
        include: {
            project: { select: { name: true } }
        },
        orderBy: { date: 'desc' },
        take: 3
    });

    return NextResponse.json({
        hasSubmittedReport: !!dailyReport,
        reportSubmissionTime: dailyReport?.submittedAt || null,
        stats: {
            activeMilestones: myMilestones.filter(m => m.status !== 'COMPLETED').length,
            completedMilestones: myMilestones.filter(m => m.status === 'COMPLETED').length,
            pendingTasks: myTasks.length,
            pendingExpenses: pendingExpenses.length,
            // Mocking prospects/partners for now
            prospects: await prisma.university.count({ where: { status: 'PROSPECT' } }),
            partners: await prisma.university.count({ where: { status: 'PARTNER' } })
        },
        recentTasks: myTasks,
        pendingExpenses
    });
}
