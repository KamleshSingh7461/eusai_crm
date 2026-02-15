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
        // 1. Core Counts & Monetary Metrics
        const [
            projects,
            tasks,
            issues,
            orders,
            expenses
        ] = await Promise.all([
            (prisma as any).project.findMany({
                select: { status: true, budget: true, id: true }
            }),
            (prisma as any).task.findMany({
                select: { status: true, priority: true, createdAt: true }
            }),
            (prisma as any).issue.findMany({
                select: { severity: true, status: true }
            }),
            (prisma as any).businessOrder.findMany({
                where: { status: 'PAID' },
                select: { amount: true, createdAt: true }
            }),
            (prisma as any).expense.findMany({
                where: { status: 'APPROVED' },
                select: { amount: true }
            })
        ]);

        // 2. Aggregate Revenue over last 6 months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const revenueMap: any = {};
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
            revenueMap[key] = 0;
        }

        orders.forEach((order: any) => {
            const d = new Date(order.createdAt);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
            if (revenueMap[key] !== undefined) {
                revenueMap[key] += Number(order.amount);
            }
        });

        const revenueTrend = Object.entries(revenueMap).map(([month, amount]) => ({ month, amount }));

        // 3. Status Distributions
        const projectStatus = {
            INITIATION: projects.filter((p: any) => p.status === 'INITIATION').length,
            PLANNING: projects.filter((p: any) => p.status === 'PLANNING').length,
            EXECUTION: projects.filter((p: any) => p.status === 'EXECUTION').length,
            MONITORING: projects.filter((p: any) => p.status === 'MONITORING').length,
            CLOSED: projects.filter((p: any) => p.status === 'CLOSED').length,
        };

        const taskStatus = {
            TODO: tasks.filter((t: any) => t.status === 'TODO').length,
            IN_PROGRESS: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
            REVIEW: tasks.filter((t: any) => t.status === 'REVIEW').length,
            DONE: tasks.filter((t: any) => t.status === 'DONE').length,
        };

        // 4. Team Leaderboard (based on Daily Reports or completed tasks)
        // For now, let's use user names with completed task counts
        const userStats = await (prisma as any).user.findMany({
            where: role === 'TEAM_LEADER' ? { managerId: userId } : {},
            select: {
                name: true,
                _count: {
                    select: { tasks: { where: { status: 'DONE' } } }
                }
            }
        });

        const leaderboard = userStats
            .map((u: any) => ({ name: u.name || 'Unknown', points: u._count.tasks }))
            .sort((a: any, b: any) => b.points - a.points)
            .slice(0, 5);

        // 5. Calculate Velocity (completed tasks per month-ish)
        // Simplified: using mock historical but real final month
        const velocity = [
            { week: 'W1', predicted: 20, actual: 18 },
            { week: 'W2', predicted: 25, actual: 28 },
            { week: 'W3', predicted: 22, actual: 20 },
            { week: 'W4', predicted: 30, actual: taskStatus.DONE },
        ];

        return NextResponse.json({
            stats: {
                totalRevenue: orders.reduce((acc: any, o: any) => acc + Number(o.amount), 0),
                activeProjects: projects.filter((p: any) => p.status !== 'CLOSED').length,
                completionRate: tasks.length > 0 ? ((taskStatus.DONE / tasks.length) * 100).toFixed(1) : "0",
                criticalIssues: issues.filter((i: any) => i.severity === 'CRITICAL' && i.status !== 'CLOSED').length,
                totalBudget: projects.reduce((acc: any, p: any) => acc + Number(p.budget), 0),
                totalExpenses: expenses.reduce((acc: any, e: any) => acc + Number(e.amount), 0)
            },
            revenueTrend,
            projectStatus,
            taskStatus,
            leaderboard,
            velocity,
            role
        });
    } catch (error) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
