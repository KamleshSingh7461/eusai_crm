import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // Fetch Users with Task counts
        const users = await prisma.user.findMany({
            where: {
                role: { in: ['MANAGER', 'TEAM_LEADER', 'EMPLOYEE', 'INTERN'] } // Exclude Directors from workload
            },
            include: {
                _count: {
                    select: {
                        tasks: { where: { status: { not: 'DONE' } } },
                        dailyReports: true
                    }
                },
                tasks: {
                    where: { status: { not: 'DONE' } },
                    select: {
                        id: true,
                        priority: true,
                        deadline: true
                    }
                }
            }
        });

        const workload = users.map(u => {
            const activeTasks = u._count.tasks;
            const highPriority = u.tasks.filter(t => t.priority === 3).length;
            const overdue = u.tasks.filter(t => new Date(t.deadline) < new Date()).length;

            // Simple capacity metric (arbitrary max of 10 tasks)
            const utilization = Math.min((activeTasks / 10) * 100, 100);

            return {
                id: u.id,
                name: u.name,
                role: u.role,
                image: u.image,
                metrics: {
                    activeTasks,
                    highPriority,
                    overdue,
                    utilization
                }
            };
        });

        // Aggregates
        const totalActiveTasks = workload.reduce((acc, curr) => acc + curr.metrics.activeTasks, 0);
        const totalOverdue = workload.reduce((acc, curr) => acc + curr.metrics.overdue, 0);
        const avgUtilization = Math.round(workload.reduce((acc, curr) => acc + curr.metrics.utilization, 0) / (workload.length || 1));

        return NextResponse.json({
            stats: {
                totalActiveTasks,
                totalOverdue,
                avgUtilization
            },
            team: workload.sort((a, b) => b.metrics.utilization - a.metrics.utilization)
        });

    } catch (error) {
        console.error('Failed to fetch resource report:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
