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

    try {
        const project = await (prisma as any).project.findUnique({
            where: { id },
            include: {
                tasks: {
                    include: { assignedTo: { select: { name: true, image: true } } },
                    orderBy: { deadline: 'asc' }
                },
                milestones: {
                    include: { ownerUser: { select: { name: true, image: true } } },
                    orderBy: { targetDate: 'asc' }
                },
                space: {
                    select: { id: true, name: true, color: true }
                },
                expenses: {
                    include: { user: { select: { name: true } } },
                    orderBy: { date: 'desc' }
                },
                manager: {
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

        // Fetch potential assignees (active team members)
        const teamMembers = await (prisma as any).user.findMany({
            where: {
                role: { in: ['DIRECTOR', 'MANAGER', 'TEAM_LEADER', 'EMPLOYEE', 'INTERN'] }
            },
            select: { id: true, name: true, image: true, role: true }
        });

        // Calculate some stats on the fly
        const budget = Number(project.budget || 0);
        const spent = project.expenses
            .filter((e: any) => e.status === 'APPROVED')
            .reduce((sum: number, e: any) => sum + Number(e.amount), 0);

        const completedTasks = project.tasks.filter((t: any) => t.status === 'DONE').length;
        const progress = project.tasks.length > 0
            ? Math.round((completedTasks / project.tasks.length) * 100)
            : 0;

        return NextResponse.json({
            ...project,
            team: teamMembers,
            stats: {
                financial: {
                    budget,
                    spent,
                    remaining: budget - spent
                },
                progress,
                tasks: {
                    total: project.tasks.length,
                    completed: completedTasks,
                    overdue: project.tasks.filter((t: any) => t.status !== 'DONE' && new Date(t.deadline) < new Date()).length
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
            }
        });

        return NextResponse.json(updatedProject);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
