import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNotification, notifyUserManager, notifyHierarchy } from '@/lib/notifications';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user as any;

    try {
        let whereClause: any = {};

        if (role === 'DIRECTOR' || role === 'MANAGER') {
            whereClause = {};
        } else if (role === 'TEAM_LEADER') {
            const user = await (prisma as any).user.findUnique({
                where: { id: userId },
                include: { reportingSubordinates: true }
            }) as any;

            const subordinateIds = user?.reportingSubordinates?.map((s: any) => s.id) || [];

            whereClause = {
                OR: [
                    { userId: userId },
                    { userId: { in: subordinateIds } }
                ]
            };
        } else {
            whereClause = { userId: userId };
        }

        const tasks = await (prisma as any).task.findMany({
            where: whereClause,
            include: {
                assignedTo: {
                    select: { id: true, name: true, image: true, email: true }
                },
                project: {
                    select: { id: true, name: true }
                },
                comments: {
                    include: {
                        user: { select: { name: true, role: true } }
                    },
                    orderBy: { timestamp: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        let meta = null;
        if (role === 'DIRECTOR' || role === 'MANAGER' || role === 'TEAM_LEADER') {
            const now = new Date();
            const workload: any = {};
            const projects: any = {};
            let overdue = 0;
            let highPriority = 0;
            let completed = 0;

            tasks.forEach((task: any) => {
                const assigneeId = task.userId || 'unassigned';
                const assigneeName = task.assignedTo?.name || 'Unassigned';
                if (!workload[assigneeId]) {
                    workload[assigneeId] = { name: assigneeName, count: 0, completed: 0, overdue: 0 };
                }
                workload[assigneeId].count++;
                if (task.status === 'DONE') {
                    workload[assigneeId].completed++;
                    completed++;
                } else if (new Date(task.deadline) < now) {
                    workload[assigneeId].overdue++;
                    overdue++;
                }

                if (task.priority === 3 && task.status !== 'DONE') highPriority++;

                const projId = task.projectId || 'none';
                const projName = task.project?.name || 'No Project';
                if (!projects[projId]) projects[projId] = { name: projName, count: 0 };
                projects[projId].count++;
            });

            meta = {
                health: {
                    total: tasks.length,
                    completed,
                    overdue,
                    highPriority,
                    velocity: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
                },
                workload: Object.values(workload),
                projects: Object.values(projects)
            };
        }

        return NextResponse.json({ tasks, meta });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = session.user as any;

    if (!['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { title, description, deadline, priority, projectId, assignedToId, assignedToIds, status, category } = body;
        const actorId = (session.user as any).id;

        // Normalize assignees into an array
        const targetIds: string[] = assignedToIds && Array.isArray(assignedToIds)
            ? assignedToIds
            : assignedToId ? [assignedToId] : [];

        // 1. Hierarchy Validation if assigning to someone else
        if (targetIds.length > 0 && role !== 'DIRECTOR') {
            const userWithSubordinates = await prisma.user.findUnique({
                where: { id: actorId },
                include: {
                    reportingSubordinates: {
                        select: { id: true }
                    }
                }
            }) as any;

            const subordinateIds = userWithSubordinates?.reportingSubordinates?.map((s: any) => s.id) || [];

            // Check each targetId
            for (const targetId of targetIds) {
                if (targetId !== actorId && !subordinateIds.includes(targetId)) {
                    return NextResponse.json({
                        error: 'Forbidden',
                        message: `Access Denied: Sector personnel ${targetId} is outside your command hierarchy.`
                    }, { status: 403 });
                }
            }
        }

        const tasksToCreate = targetIds.length > 0 ? targetIds : [null];
        const createdTasks = [];

        for (const targetId of tasksToCreate) {
            const newTask = await (prisma as any).task.create({
                data: {
                    title,
                    description,
                    deadline: new Date(deadline),
                    priority: parseInt(priority) || 1,
                    projectId: projectId || null,
                    userId: targetId,
                    status: status || 'TODO',
                    category: category || 'CUSTOM'
                }
            });

            createdTasks.push(newTask);

            if (targetId) {
                await notifyHierarchy({
                    actorId: (session.user as any).id,
                    targetId: targetId,
                    action: 'Task Assigned',
                    title: 'New Mission Assigned',
                    details: `You have been assigned to task: ${title}`,
                    link: projectId ? `/projects/${projectId}` : '/tasks'
                });
            }
        }

        if (projectId) {
            await (prisma as any).activity.create({
                data: {
                    projectId,
                    userId: (session.user as any).id,
                    action: 'TASK_CREATED',
                    metadata: { title, category: category || 'CUSTOM', count: createdTasks.length }
                }
            }).catch((err: any) => console.error("Failed to log activity:", err));
        }

        return NextResponse.json(createdTasks.length === 1 ? createdTasks[0] : createdTasks);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, status } = body;

        const oldTask = await (prisma as any).task.findUnique({
            where: { id },
            include: {
                assignedTo: true,
                project: { include: { managers: true } }
            }
        });

        if (!oldTask) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const updatedTask = await (prisma as any).task.update({
            where: { id },
            data: { status }
        });

        if (status === 'DONE' && oldTask.status !== 'DONE') {
            const userId = (session.user as any).id;
            const userName = session.user.name || 'An employee';

            await notifyHierarchy({
                actorId: userId,
                targetId: oldTask.project?.managers?.[0]?.id || undefined,
                action: 'Task Completed',
                title: 'Mission Accomplished',
                details: `${userName} completed: ${oldTask.title}`,
                link: oldTask.projectId ? `/projects/${oldTask.projectId}` : '/tasks'
            });

            if (oldTask.projectId) {
                await (prisma as any).activity.create({
                    data: {
                        projectId: oldTask.projectId,
                        userId,
                        action: 'TASK_COMPLETED',
                        metadata: { title: oldTask.title }
                    }
                }).catch((err: any) => console.error("Failed to log activity:", err));
            }
        }

        return NextResponse.json(updatedTask);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
        }

        const { role } = session.user as any;
        const actorId = (session.user as any).id;

        // Fetch task to check ownership/permissions
        const task = await (prisma as any).task.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Permission check: Director, or Manager/Team Leader logic
        // For now, let's allow Directors and Managers to delete any task,
        // and users to delete their own tasks if they are managers of the project.
        if (role !== 'DIRECTOR' && role !== 'MANAGER') {
            // Check if user is the assignee OR the project manager
            // For simplicity, sticking to role-based for now as a baseline
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await (prisma as any).task.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Task deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
