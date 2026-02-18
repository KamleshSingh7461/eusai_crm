import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const [
            projectCount,
            totalTasks,
            completedTasks,
            overdueIssues,
            totalBudget
        ] = await Promise.all([
            prisma.project.count({ where: { status: { not: 'CLOSED' } } }),
            prisma.task.count(),
            prisma.task.count({ where: { status: 'DONE' } }),
            (prisma as any).issue.count({ where: { status: 'OPEN' } }),
        ]);

        const velocity = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return NextResponse.json({
            activeProjects: projectCount,
            executionVelocity: `${Math.round(velocity)}%`,
            overdueTasks: overdueIssues, // Using open issues as a proxy for risk
            openRisks: overdueIssues
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
