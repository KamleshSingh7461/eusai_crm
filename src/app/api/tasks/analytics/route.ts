import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user as any;

    // Only managers can access analytics
    if (!['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        let whereClause: any = {};

        if (role === 'DIRECTOR' || role === 'MANAGER') {
            // View all tasks
            whereClause = {};
        } else if (role === 'TEAM_LEADER') {
            // View own tasks AND tasks assigned to subordinates
            const user = await (prisma as any).user.findUnique({
                where: { id: userId },
                include: { reportingSubordinates: true }
            }) as any;

            const subordinateIds = user?.reportingSubordinates?.map((s: any) => s.id) || [];

            whereClause = {
                OR: [
                    { userId: userId },
                    { userId: { in: subordinateIds } }
                ]
            };
        }

        const tasks = await (prisma as any).task.findMany({
            where: whereClause,
            include: {
                assignedTo: {
                    select: { id: true, name: true, role: true, email: true }
                },
                project: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Analytics calculations
        let totalTasks = tasks.length;
        let completedTasks = 0;
        let overdueTasks = 0;
        let highPriorityTasks = 0;
        let completedThisWeek = 0;
        let completedThisMonth = 0;

        const tasksByRole: any = {};
        const tasksByPriority: any = { 1: 0, 2: 0, 3: 0 };
        const tasksByStatus: any = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
        const userPerformance: any = {};
        const dailyCompletions: any = {};

        tasks.forEach((task: any) => {
            // Status distribution
            tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;

            // Priority distribution
            tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;

            // Role distribution
            const assigneeRole = task.assignedTo?.role || 'UNASSIGNED';
            tasksByRole[assigneeRole] = (tasksByRole[assigneeRole] || 0) + 1;

            // Completed tasks
            if (task.status === 'DONE') {
                completedTasks++;

                // Check if completed this week/month
                const completedAt = task.updatedAt;
                if (completedAt >= sevenDaysAgo) completedThisWeek++;
                if (completedAt >= thirtyDaysAgo) completedThisMonth++;

                // Daily completions for trend
                const day = completedAt.toISOString().split('T')[0];
                dailyCompletions[day] = (dailyCompletions[day] || 0) + 1;
            }

            // Overdue tasks
            if (task.deadline && new Date(task.deadline) < now && task.status !== 'DONE') {
                overdueTasks++;
            }

            // High priority incomplete tasks
            if (task.priority === 3 && task.status !== 'DONE') {
                highPriorityTasks++;
            }

            // User performance - only for operational roles
            const assigneeId = task.userId || 'unassigned';
            const assigneeName = task.assignedTo?.name || 'Unassigned';
            const assigneeRoleForPerformance = task.assignedTo?.role || 'N/A';

            if (['EMPLOYEE', 'INTERN'].includes(assigneeRoleForPerformance)) {
                if (!userPerformance[assigneeId]) {
                    userPerformance[assigneeId] = {
                        id: assigneeId,
                        name: assigneeName,
                        role: assigneeRoleForPerformance,
                        total: 0,
                        completed: 0,
                        overdue: 0,
                        highPriority: 0
                    };
                }
                userPerformance[assigneeId].total++;
                if (task.status === 'DONE') userPerformance[assigneeId].completed++;
                if (task.deadline && new Date(task.deadline) < now && task.status !== 'DONE') {
                    userPerformance[assigneeId].overdue++;
                }
                if (task.priority === 3 && task.status !== 'DONE') {
                    userPerformance[assigneeId].highPriority++;
                }
            }
        });

        // Calculate completion velocity
        const velocity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Prepare daily completion trend (last 7 days)
        const completionTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const day = date.toISOString().split('T')[0];
            completionTrend.push({
                date: day,
                count: dailyCompletions[day] || 0
            });
        }

        return NextResponse.json({
            overview: {
                total: totalTasks,
                completed: completedTasks,
                overdue: overdueTasks,
                highPriority: highPriorityTasks,
                velocity,
                completedThisWeek,
                completedThisMonth
            },
            distribution: {
                byStatus: tasksByStatus,
                byPriority: tasksByPriority,
                byRole: tasksByRole
            },
            trends: {
                dailyCompletions: completionTrend
            },
            teamPerformance: Object.values(userPerformance).sort((a: any, b: any) => b.total - a.total)
        });

    } catch (error: any) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
