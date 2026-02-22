import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: currentUserId } = session.user as any;
    const isRestricted = ['EMPLOYEE', 'INTERN'].includes(role);

    try {
        const project = await (prisma as any).project.findUnique({
            where: { id },
            include: {
                tasks: {
                    where: isRestricted ? { userId: currentUserId } : {},
                    include: { assignedTo: { select: { id: true, name: true, image: true } } },
                    orderBy: { deadline: 'asc' }
                },
                milestones: {
                    where: isRestricted ? { owner: currentUserId } : {},
                    include: { ownerUser: { select: { name: true, image: true } } },
                    orderBy: { targetDate: 'asc' }
                },
                space: {
                    select: { id: true, name: true, color: true }
                },
                expenses: {
                    where: isRestricted ? { userId: currentUserId } : {},
                    include: { user: { select: { name: true } } },
                    orderBy: { date: 'desc' }
                },
                managers: {
                    select: { id: true, name: true, image: true, email: true }
                },
                _count: {
                    select: { tasks: true, milestones: true, issues: true }
                }
            }
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Fetch potential assignees based on hierarchy
        let attendeeWhereClause: any = {};

        if (role === 'DIRECTOR') {
            attendeeWhereClause = {
                role: { in: ['MANAGER', 'TEAM_LEADER', 'EMPLOYEE', 'INTERN'] }
            };
        } else if (role === 'MANAGER' || role === 'TEAM_LEADER') {
            const userWithSubordinates = await (prisma as any).user.findUnique({
                where: { id: currentUserId },
                include: { reportingSubordinates: true }
            }) as any;
            const subordinateIds = userWithSubordinates?.reportingSubordinates?.map((s: any) => s.id) || [];
            attendeeWhereClause = {
                id: { in: subordinateIds }
            };
        } else {
            // Employees/Interns can't assign to others (only self in modal)
            attendeeWhereClause = { id: 'none' };
        }

        const potentialAssignees = await (prisma as any).user.findMany({
            where: attendeeWhereClause,
            select: { id: true, name: true, image: true, role: true }
        });

        // Calculate holistic stats on the fly
        const budget = Number(project.budget || 0);
        const spent = project.expenses
            .filter((e: any) => e.status === 'APPROVED')
            .reduce((sum: number, e: any) => sum + Number(e.amount), 0);

        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter((t: any) => t.status === 'DONE').length;

        const totalMilestones = project.milestones.length;
        const completedMilestones = project.milestones.filter((m: any) => m.status === 'COMPLETED').length;

        // Holistic Progress (Weighted average of tasks and milestones)
        const totalItems = totalTasks + totalMilestones;
        const completedItems = completedTasks + completedMilestones;
        const progress = totalItems > 0
            ? Math.round((completedItems / totalItems) * 100)
            : 0;

        return NextResponse.json({
            ...project,
            isRestricted,
            team: potentialAssignees,
            stats: {
                financial: {
                    budget,
                    spent,
                    remaining: budget - spent
                },
                progress,
                tasks: {
                    total: totalTasks,
                    completed: completedTasks,
                    pending: totalTasks - completedTasks,
                    overdue: project.tasks.filter((t: any) => t.status !== 'DONE' && new Date(t.deadline) < new Date()).length
                },
                milestones: {
                    total: totalMilestones,
                    completed: completedMilestones,
                    pending: totalMilestones - completedMilestones,
                    overdue: project.milestones.filter((m: any) => m.status !== 'COMPLETED' && new Date(m.targetDate) < new Date()).length
                }
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = session.user as any;
    if (!['DIRECTOR', 'MANAGER'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const data = await request.json();
        const updatedProject = await prisma.project.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                status: data.status,
                budget: data.budget,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                managers: data.managerIds ? {
                    set: data.managerIds.map((id: string) => ({ id }))
                } : undefined
            }
        });

        return NextResponse.json(updatedProject);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
