import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = session.user as any;
    if (role !== 'DIRECTOR') {
        return NextResponse.json({ error: 'Forbidden: Director access only' }, { status: 403 });
    }

    try {
        // 1. Fetch Comprehensive Data
        const [
            users,
            projects,
            partnerCount,
            totalUniversities,
            totalRevenueData,
            spaces,
            recentMilestones,
            issueStats,
            globalActivity,
            recentOrders,
            tasks
        ] = await Promise.all([
            // All Users with their task summaries
            (prisma as any).user.findMany({
                select: {
                    id: true,
                    name: true,
                    role: true,
                    image: true,
                    _count: {
                        select: {
                            tasks: { where: { status: { not: 'DONE' } } },
                            milestones: { where: { status: { not: 'COMPLETED' } } }
                        }
                    }
                }
            }),
            // All Projects with their details and milestone completion
            (prisma as any).project.findMany({
                include: {
                    _count: {
                        select: {
                            tasks: true,
                            milestones: true
                        }
                    },
                    milestones: {
                        select: {
                            status: true
                        }
                    },
                    manager: { select: { name: true } }
                }
            }),
            (prisma as any).university.count({ where: { status: 'PARTNER' } }),
            (prisma as any).university.count(),
            (prisma as any).businessOrder.aggregate({
                where: { status: 'PAID' },
                _sum: { amount: true }
            }),
            (prisma as any).space.findMany({
                include: {
                    _count: {
                        select: { projects: { where: { status: { not: 'CLOSED' } } } }
                    }
                }
            }),
            (prisma as any).milestone.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    ownerUser: { select: { name: true, image: true } },
                    project: { select: { name: true } }
                }
            }),
            (prisma as any).issue.groupBy({
                by: ['severity'],
                where: { status: { not: 'CLOSED' } },
                _count: true
            }),
            (prisma as any).task.findMany({
                orderBy: { updatedAt: 'desc' },
                take: 15,
                include: {
                    assignedTo: { select: { name: true, image: true } },
                    project: { select: { name: true } }
                }
            }),
            (prisma as any).businessOrder.findMany({
                where: { status: 'PAID' },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    amount: true,
                    createdAt: true,
                    client: { select: { name: true } }
                }
            }),
            (prisma as any).task.findMany({
                select: {
                    status: true,
                    createdAt: true
                }
            })
        ]);

        const totalRevenue = Number(totalRevenueData._sum.amount || 0);

        // 2. Calculate Market Coverage (% of universities that are partners)
        const marketCoverage = totalUniversities > 0
            ? Math.round((partnerCount / totalUniversities) * 100)
            : 0;

        // 3. Space Distribution for Portfolio Pulse
        const spaceDistribution = spaces.map((space: any) => ({
            id: space.id,
            name: space.name,
            color: space.color,
            projectCount: space._count.projects
        })).sort((a: any, b: any) => b.projectCount - a.projectCount);

        // 4. Calculate Project Progress (based on completed milestones)
        const projectsWithProgress = projects.map((p: any) => {
            const totalMilestones = p._count.milestones;
            const completedMilestones = p.milestones.filter((m: any) => m.status === 'COMPLETED').length;
            const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

            return {
                id: p.id,
                name: p.name,
                status: p.status,
                managerName: p.manager?.name || 'Unassigned',
                taskCount: p._count.tasks,
                milestoneCount: totalMilestones,
                completedMilestones,
                progress
            };
        });

        // 5. Health Metrics (Calculated)
        const criticalIssues = issueStats.find((s: any) => s.severity === 'CRITICAL')?._count || 0;
        const totalOpenIssues = issueStats.reduce((acc: any, curr: any) => acc + curr._count, 0);

        // 6. Task Completion Metrics
        const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length;
        const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

        // 7. Revenue Trend (Last 3 months)
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const revenueTrend = [];

        for (let i = 2; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const monthOrders = recentOrders.filter((order: any) => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= monthDate && orderDate < nextMonthDate;
            });

            const monthRevenue = monthOrders.reduce((sum: number, order: any) => sum + Number(order.amount), 0);

            revenueTrend.push({
                month: `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear().toString().slice(-2)}`,
                revenue: monthRevenue
            });
        }

        return NextResponse.json({
            stats: {
                partnerCount,
                totalRevenue,
                staffCount: users.length,
                marketCoverage,
                criticalIssues,
                totalOpenIssues,
                taskCompletionRate,
                // Fixed: Only exclude 'CLOSED' projects (CANCELLED doesn't exist in schema)
                // Active projects are: INITIATION, PLANNING, EXECUTION, MONITORING
                activeProjects: projects.filter((p: any) => p.status !== 'CLOSED').length
            },
            employees: users.map((u: any) => ({
                id: u.id,
                name: u.name,
                role: u.role,
                image: u.image,
                pendingTasks: u._count.tasks,
                pendingMilestones: u._count.milestones
            })),
            projects: projectsWithProgress,
            spaceDistribution,
            recentMilestones: recentMilestones.map((m: any) => ({
                id: m.id,
                title: m.title,
                projectName: m.project?.name || 'Unknown Project',
                ownerName: m.ownerUser?.name || 'System',
                ownerImage: m.ownerUser?.image,
                status: m.status,
                completedAt: m.completedDate,
                createdAt: m.createdAt
            })),
            globalActivity: globalActivity.map((t: any) => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                status: t.status,
                dueDate: t.deadline,
                assignedTo: t.assignedTo?.name,
                assignedToImage: t.assignedTo?.image,
                projectName: t.project?.name,
                updatedAt: t.updatedAt
            })),
            revenueTrend,
            recentOrders: recentOrders.map((o: any) => ({
                id: o.id,
                amount: o.amount,
                client: o.client?.name || 'Unknown',
                date: o.createdAt
            })),
            role: 'DIRECTOR'
        });
    } catch (error: any) {
        console.error('Director Dashboard API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
