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
    if (!['DIRECTOR', 'MANAGER'].includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let dateFilter: any = {};
        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            };
        }

        // Fetch Projects with Budgets and Expenses
        const projects = await prisma.project.findMany({
            include: {
                expenses: {
                    where: dateFilter
                }
            }
        });

        // Calculate Totals
        let totalSpent = 0;
        const categoryBreakdown: Record<string, number> = {};
        const projectExpenses: any[] = [];

        projects.forEach(p => {
            const spent = p.expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
            totalSpent += spent;

            projectExpenses.push({
                id: p.id,
                name: p.name,
                spent
            });

            p.expenses.forEach(e => {
                const category = e.category || 'UNCATEGORIZED';
                categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Number(e.amount);
            });
        });

        return NextResponse.json({
            stats: {
                totalSpent,
                averageSpend: totalSpent / (projects.length || 1)
            },
            breakdown: categoryBreakdown,
            projects: projectExpenses.sort((a, b) => b.spent - a.spent)
        });

    } catch (error) {
        console.error('Failed to fetch financial report:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
