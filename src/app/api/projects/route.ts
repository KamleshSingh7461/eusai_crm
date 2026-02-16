import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AutomationService } from '@/services/AutomationService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // 1. Create project in Relational DB (PostgreSQL)
        const project = await prisma.project.create({
            data: {
                name: data.name,
                description: data.description,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                budget: data.budget,
                status: 'INITIATION',
                spaceId: data.spaceId || null,
            }
        });

        // 2. Log activity in Relational DB (PostgreSQL)
        const session = await getServerSession(authOptions);
        await prisma.activity.create({
            data: {
                projectId: project.id,
                userId: (session?.user as any)?.id || 'SYSTEM_ADMIN',
                action: 'PROJECT_INITIATED',
                metadata: {
                    managerAssigned: data.managerName,
                    initialBudget: data.budget
                }
            }
        });

        // 3. Trigger Automation Workflows
        await AutomationService.trigger('PROJECT_CREATED', project);

        return NextResponse.json(project, { status: 201 });
    } catch (error: any) {
        console.error('Project creation API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user as any;
    let whereClause: any = {};

    try {
        if (role === 'EMPLOYEE' || role === 'INTERN') {
            whereClause = {
                OR: [
                    { tasks: { some: { userId: userId } } }, // Assigned a task
                    { milestones: { some: { owner: userId } } }, // Owns a milestone
                    { dailyReports: { some: { userId: userId } } } // Filed a report
                ]
            };
        } else if (role === 'TEAM_LEADER' || role === 'MANAGER') {
            // Team Leaders and Managers see projects where they OR their team are involved
            const userWithTeam = await prisma.user.findUnique({
                where: { id: userId },
                include: { subordinates: true }
            }) as any;

            const teamIds = userWithTeam?.subordinates?.map((s: any) => s.id) || [];
            const allTeamIds = [userId, ...teamIds];

            whereClause = {
                OR: [
                    { tasks: { some: { userId: { in: allTeamIds } } } },
                    { milestones: { some: { owner: { in: allTeamIds } } } },
                    { dailyReports: { some: { userId: { in: allTeamIds } } } }
                ]
            };
        }
        // Directors see all projects (whereClause stays {})

        const projects = await (prisma as any).project.findMany({
            where: whereClause,
            include: {
                tasks: {
                    select: { status: true, deadline: true }
                },
                milestones: {
                    select: { status: true, progress: true }
                },
                space: {
                    select: { id: true, name: true, color: true }
                },
                expenses: {
                    where: { status: 'APPROVED' },
                    select: { amount: true }
                },
                _count: {
                    select: { tasks: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const projectsWithStats = projects.map((project: any) => {
            // Task Stats
            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter((t: any) => t.status === 'DONE').length;
            const overdueTasks = project.tasks.filter((t: any) => t.status !== 'DONE' && new Date(t.deadline) < new Date()).length;

            // Milestone Stats
            const totalMilestones = project.milestones.length;
            const completedMilestones = project.milestones.filter((m: any) => m.status === 'COMPLETED').length;

            // Financial Stats
            const approvedExpenses = project.expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
            const remainingBudget = Number(project.budget) - approvedExpenses;

            // Calculated Progress
            // Weight: Milestones (70%), Tasks (30%)
            let progress = 0;
            if (totalMilestones > 0 && totalTasks > 0) {
                const milestoneProgress = (completedMilestones / totalMilestones) * 70;
                const taskProgress = (completedTasks / totalTasks) * 30;
                progress = Math.round(milestoneProgress + taskProgress);
            } else if (totalMilestones > 0) {
                progress = Math.round((completedMilestones / totalMilestones) * 100);
            } else if (totalTasks > 0) {
                progress = Math.round((completedTasks / totalTasks) * 100);
            }

            return {
                ...project,
                stats: {
                    tasks: { total: totalTasks, completed: completedTasks, overdue: overdueTasks },
                    milestones: { total: totalMilestones, completed: completedMilestones },
                    financial: { budget: Number(project.budget), spent: approvedExpenses, remaining: remainingBudget },
                    progress: progress
                }
            };
        });

        return NextResponse.json(projectsWithStats);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = session.user as any;
    if (role !== 'DIRECTOR') {
        return NextResponse.json({ error: 'Forbidden: Only Directors can decommission projects' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
        }

        await prisma.project.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Project deletion error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
