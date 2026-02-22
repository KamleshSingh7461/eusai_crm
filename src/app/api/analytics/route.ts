import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user as any;
    const isManager = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(role);

    try {
        // 1. Fetch all data concurrently
        const [
            projects,
            tasks,
            issues,
            users
        ] = await Promise.all([
            (prisma as any).project.findMany({
                select: {
                    status: true,

                    id: true,
                    createdAt: true,
                    name: true
                }
            }),
            (prisma as any).task.findMany({
                select: {
                    status: true,
                    priority: true,
                    createdAt: true,
                    updatedAt: true,
                    userId: true,
                    assignedTo: {
                        select: { name: true, role: true }
                    }
                }
            }),
            (prisma as any).issue.findMany({
                select: { severity: true, status: true }
            }),

            (prisma as any).user.findMany({
                where: role === 'TEAM_LEADER' ? { reportingManagers: { some: { id: userId } } } : {},
                select: {
                    id: true,
                    name: true,
                    role: true,
                    tasks: {
                        where: { status: 'DONE' },
                        select: { id: true }
                    }
                }
            })
        ]);

        const now = new Date();



        // 3. Task status distribution
        const taskStatus = {
            TODO: tasks.filter((t: any) => t.status === 'TODO').length,
            IN_PROGRESS: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
            REVIEW: tasks.filter((t: any) => t.status === 'REVIEW').length,
            DONE: tasks.filter((t: any) => t.status === 'DONE').length,
        };

        // 4. Real velocity calculation (tasks completed per week for last 4 weeks)
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
        const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

        const completedTasks = tasks.filter((t: any) => t.status === 'DONE');

        const weeklyCompletions = [
            {
                week: 'W1',
                predicted: Math.ceil(tasks.length * 0.15),
                actual: completedTasks.filter((t: any) =>
                    new Date(t.updatedAt) >= fourWeeksAgo && new Date(t.updatedAt) < threeWeeksAgo
                ).length
            },
            {
                week: 'W2',
                predicted: Math.ceil(tasks.length * 0.20),
                actual: completedTasks.filter((t: any) =>
                    new Date(t.updatedAt) >= threeWeeksAgo && new Date(t.updatedAt) < twoWeeksAgo
                ).length
            },
            {
                week: 'W3',
                predicted: Math.ceil(tasks.length * 0.18),
                actual: completedTasks.filter((t: any) =>
                    new Date(t.updatedAt) >= twoWeeksAgo && new Date(t.updatedAt) < oneWeekAgo
                ).length
            },
            {
                week: 'W4',
                predicted: Math.ceil(tasks.length * 0.22),
                actual: completedTasks.filter((t: any) =>
                    new Date(t.updatedAt) >= oneWeekAgo
                ).length
            }
        ];

        // 5. Team leaderboard with real data
        const leaderboard = users
            .map((u: any) => ({
                name: u.name || 'Unknown',
                role: u.role,
                points: u.tasks.length
            }))
            .filter((u: any) => u.points > 0) // Only show users with completed tasks
            .sort((a: any, b: any) => b.points - a.points)
            .slice(0, 10); // Top 10 performers

        // 6. Project status distribution
        const projectStatus = {
            INITIATION: projects.filter((p: any) => p.status === 'INITIATION').length,
            PLANNING: projects.filter((p: any) => p.status === 'PLANNING').length,
            EXECUTION: projects.filter((p: any) => p.status === 'EXECUTION').length,
            MONITORING: projects.filter((p: any) => p.status === 'MONITORING').length,
            CLOSED: projects.filter((p: any) => p.status === 'CLOSED').length,
        };

        // 7. Calculate core stats

        const activeProjects = projects.filter((p: any) => p.status !== 'CLOSED' && p.status !== 'CANCELLED').length;
        const completionRate = tasks.length > 0 ? Math.round((taskStatus.DONE / tasks.length) * 100) : 0;
        const criticalIssues = issues.filter((i: any) => i.severity === 'CRITICAL' && i.status !== 'CLOSED').length;

        // 8. Additional insights
        const highPriorityTasks = tasks.filter((t: any) => t.priority === 3 && t.status !== 'DONE').length;
        const overdueTasks = tasks.filter((t: any) => {
            // This would require deadline field, using a simple heuristic for now
            return t.status !== 'DONE' && new Date(t.createdAt) < threeWeeksAgo;
        }).length;

        return NextResponse.json({
            stats: {

                highPriorityTasks,
                overdueTasks,
                totalTasks: tasks.length,
                completedTasks: taskStatus.DONE
            },

            projectStatus,
            taskStatus,
            leaderboard,
            velocity: weeklyCompletions,
            insights: {
                teamSize: users.length,
                avgTasksPerUser: users.length > 0 ? (tasks.length / users.length).toFixed(1) : 0
            },
            role
        });
    } catch (error) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
