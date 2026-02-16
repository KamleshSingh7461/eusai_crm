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
            totalRevenueData,
            spaces,
            recentMilestones,
            issueStats,
            globalActivity
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
                            tasks: { where: { status: { not: 'COMPLETED' } } },
                            milestones: { where: { status: { not: 'COMPLETED' } } }
                        }
                    }
                }
            }),
            // All Projects with their details
            (prisma as any).project.findMany({
                include: {
                    _count: {
                        select: {
                            tasks: true,
                            milestones: true
                        }
                    },
                    manager: { select: { name: true } }
                }
            }),
            (prisma as any).university.count({ where: { status: 'PARTNER' } }),
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
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    assignedTo: { select: { name: true } },
                    project: { select: { name: true } }
                }
            })
        ]);

        const totalRevenue = Number(totalRevenueData._sum.amount || 0);

        // 2. Space Distribution for Portfolio Pulse
        const spaceDistribution = spaces.map((space: any) => ({
            id: space.id,
            name: space.name,
            color: space.color,
            projectCount: space._count.projects
        })).sort((a: any, b: any) => b.projectCount - a.projectCount);

        // 3. Health Metrics (Calculated)
        const criticalIssues = issueStats.find((s: any) => s.severity === 'CRITICAL')?._count || 0;
        const totalOpenIssues = issueStats.reduce((acc: any, curr: any) => acc + curr._count, 0);

        return NextResponse.json({
            stats: {
                partnerCount,
                totalRevenue,
                staffCount: users.length,
                marketCoverage: 0,
                criticalIssues,
                totalOpenIssues
            },
            employees: users.map((u: any) => ({
                id: u.id,
                name: u.name,
                role: u.role,
                image: u.image,
                pendingTasks: u._count.tasks,
                pendingMilestones: u._count.milestones
            })),
            projects: projects.map((p: any) => ({
                id: p.id,
                name: p.name,
                status: p.status,
                managerName: p.manager?.name || 'Unassigned',
                taskCount: p._count.tasks,
                milestoneCount: p._count.milestones,
                progress: p._count.milestones > 0 ? 0 : 0 // Progress logic can be refined later
            })),
            spaceDistribution,
            recentMilestones: recentMilestones.map((m: any) => ({
                id: m.id,
                title: m.title,
                projectName: m.project?.name || 'Unknown Project',
                ownerName: m.ownerUser?.name || 'System',
                ownerImage: m.ownerUser?.image,
                status: m.status,
                completedAt: m.completedDate
            })),
            globalActivity: globalActivity.map((t: any) => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                status: t.status,
                dueDate: t.deadline,
                assignedTo: t.assignedTo?.name,
                projectName: t.project?.name
            })),
            role: 'DIRECTOR'
        });
    } catch (error: any) {
        console.error('Director Dashboard API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
