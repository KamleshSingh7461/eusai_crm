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
        // 1. Organizational KPIs & Activity
        const [
            partnerCount,
            totalRevenueData,
            staffCount,
            spacesWithProjects,
            recentMilestones,
            issueStats,
            executiveActions,
            globalActivity
        ] = await Promise.all([
            (prisma as any).university.count({ where: { status: 'PARTNER' } }),
            (prisma as any).businessOrder.aggregate({
                where: { status: 'PAID' },
                _sum: { amount: true }
            }),
            (prisma as any).user.count(),
            (prisma as any).space.findMany({
                include: {
                    _count: {
                        select: { projects: { where: { status: { not: 'CLOSED' } } } }
                    }
                }
            }),
            (prisma as any).milestone.findMany({
                where: { status: 'COMPLETED' },
                orderBy: { completedDate: 'desc' },
                take: 5,
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
                where: {
                    userId: (session.user as any).id,
                    status: { not: 'COMPLETED' }
                },
                orderBy: { deadline: 'asc' },
                take: 5
            }),
            (prisma as any).project.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    status: true,
                    createdAt: true
                }
            })
        ]);

        const totalRevenue = Number(totalRevenueData._sum.amount || 0);

        // 2. Space Distribution for Portfolio Pulse
        const spaceDistribution = spacesWithProjects.map((space: any) => ({
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
                staffCount,
                marketCoverage: 0, // No source for this metric currently
                criticalIssues,
                totalOpenIssues
            },
            spaceDistribution,
            recentMilestones: recentMilestones.map((m: any) => ({
                id: m.id,
                title: m.title,
                projectName: m.project?.name || 'Unknown Project',
                ownerName: m.ownerUser.name,
                ownerImage: m.ownerUser.image,
                completedAt: m.completedDate
            })),
            executiveActions: executiveActions.map((t: any) => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                dueDate: t.deadline
            })),
            globalActivity: globalActivity.map((p: any) => ({
                id: p.id,
                title: p.name,
                status: p.status,
                createdAt: p.createdAt
            })),
            role: 'DIRECTOR'
        });
    } catch (error: any) {
        console.error('Director Dashboard API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
