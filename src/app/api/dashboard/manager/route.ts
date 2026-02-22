import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { startOfWeek, endOfWeek } from 'date-fns';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId, role } = (session.user as any);

    if (role !== 'MANAGER' && role !== 'DIRECTOR') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // 0. Get current user's department
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { department: true }
        });

        // 1. Get entire team (direct and grand-subordinates OR same department)
        const teamMembers = await prisma.user.findMany({
            where: {
                OR: [
                    { reportingManagers: { some: { id: userId } } },
                    { reportingManagers: { some: { reportingManagers: { some: { id: userId } } } } },
                    { department: currentUser?.department }
                ]
            },
            select: { id: true, name: true, role: true, image: true, email: true }
        });

        // 1b. Get IDs of Projects managed by this user
        const managedProjects = await prisma.project.findMany({
            where: { managers: { some: { id: userId } } },
            select: { id: true }
        });
        const managedProjectIds = managedProjects.map(p => p.id);

        const teamIds = teamMembers.map(m => m.id);
        const allRelevantIds = [userId, ...teamIds];

        // 2. Fetch Team Revenue (BusinessOrders linked to team owners OR managed projects)
        const businessOrders = await prisma.businessOrder.findMany({
            where: {
                OR: [
                    { milestone: { owner: { in: allRelevantIds } } },
                    { milestone: { projectId: { in: managedProjectIds } } }
                ],
                status: 'PAID'
            },
            select: { amount: true }
        });

        const totalRevenue = businessOrders.reduce((acc, order) => acc + Number(order.amount), 0);

        // 3. Active MOUs (Team owners OR managed projects)
        const activeMOUsCount = await prisma.milestone.count({
            where: {
                OR: [
                    { owner: { in: allRelevantIds } },
                    { projectId: { in: managedProjectIds } }
                ],
                category: 'MOU',
                status: { in: ['PENDING', 'IN_PROGRESS'] }
            }
        });

        const pendingSignaturesCount = await prisma.milestone.count({
            where: {
                OR: [
                    { owner: { in: allRelevantIds } },
                    { projectId: { in: managedProjectIds } }
                ],
                category: 'MOU',
                status: 'IN_PROGRESS'
            }
        });

        // 4. Team Reports (Current Week)
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        const submittedReportsCount = await prisma.weeklyReport.count({
            where: {
                userId: { in: teamIds },
                weekStartDate: { gte: weekStart, lte: weekEnd }
            }
        });

        // 5. Recent Team Milestones (Team owners OR managed projects)
        const recentMilestones = await prisma.milestone.findMany({
            where: {
                OR: [
                    { owner: { in: teamIds } },
                    { projectId: { in: managedProjectIds } }
                ],
                status: 'COMPLETED'
            },
            include: {
                ownerUser: {
                    select: { name: true, image: true }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 5
        });

        // 6. Real Pending Approvals (Expenses)
        const pendingExpenses = await prisma.expense.findMany({
            where: {
                userId: { in: teamIds },
                status: 'PENDING'
            },
            include: {
                user: {
                    select: { name: true }
                }
            },
            take: 5
        });

        return NextResponse.json({
            stats: {
                revenue: totalRevenue,
                activeMOUs: activeMOUsCount,
                pendingSignatures: pendingSignaturesCount,
                reportsSubmitted: submittedReportsCount,
                totalTeamSize: teamIds.length
            },
            recentMilestones: recentMilestones.map(m => ({
                id: m.id,
                title: m.title,
                category: m.category,
                ownerName: m.ownerUser.name,
                ownerImage: m.ownerUser.image,
                completedAt: m.updatedAt
            })),
            pendingApprovals: pendingExpenses.map(e => ({
                id: e.id,
                title: e.description || `Expense: ${e.category}`,
                submittedBy: e.user.name,
                amount: `₹${Number(e.amount).toLocaleString()}`,
                type: 'EXPENSE'
            }))
        });

    } catch (error) {
        console.error("Error fetching manager dashboard data:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
