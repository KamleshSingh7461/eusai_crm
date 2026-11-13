import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ALL_COMPANY_ROLES, currentUser } from '@/lib/companies';

/** GET /api/stats : organisation-wide counts for the admin page (Directors and Management). */
export async function GET() {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (![...ALL_COMPANY_ROLES, 'MANAGEMENT'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    try {
        const [
            projectCount,
            totalTasks,
            completedTasks,
            overdueIssues
        ] = await Promise.all([
            prisma.project.count({ where: { status: { not: 'CLOSED' } } }),
            prisma.task.count(),
            prisma.task.count({ where: { status: 'DONE' } }),
            (prisma as any).issue.count({ where: { status: 'OPEN' } })
        ]);


        const velocity = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return NextResponse.json({
            activeProjects: projectCount,
            executionVelocity: `${Math.round(velocity)}%`,
            overdueTasks: overdueIssues, // Using open issues as a proxy for risk
            openRisks: overdueIssues,
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
