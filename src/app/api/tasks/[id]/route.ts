import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user as any;
    const taskId = params.id;

    try {
        const body = await request.json();
        const { status, priority, deadline, description, title } = body;

        // Get the task first to check permissions
        const task = await (prisma as any).task.findUnique({
            where: { id: taskId },
            include: { assignedTo: true }
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Permission checks
        const isAssignedToUser = task.userId === userId;
        const isManager = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(role);

        // Status updates: ONLY the assigned employee can update status
        if (status !== undefined && !isAssignedToUser) {
            return NextResponse.json({
                error: 'Only the assigned employee can update task status. Directors track progress, employees update it.'
            }, { status: 403 });
        }

        // Non-status updates: Employees can only update their own tasks
        if ((role === 'EMPLOYEE' || role === 'INTERN') && !isAssignedToUser) {
            return NextResponse.json({ error: 'You can only update your own tasks' }, { status: 403 });
        }

        // Employees can only update status, not other fields
        if ((role === 'EMPLOYEE' || role === 'INTERN')) {
            if (Object.keys(body).some(key => key !== 'status')) {
                return NextResponse.json({ error: 'You can only update task status' }, { status: 403 });
            }
        }

        // Build update data
        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (isManager) {
            // Managers can update administrative fields (but NOT status of others' tasks)
            if (priority !== undefined) updateData.priority = parseInt(priority);
            if (deadline !== undefined) updateData.deadline = new Date(deadline);
            if (description !== undefined) updateData.description = description;
            if (title !== undefined) updateData.title = title;
        }

        const updatedTask = await (prisma as any).task.update({
            where: { id: taskId },
            data: updateData,
            include: {
                assignedTo: {
                    select: { id: true, name: true, image: true, email: true }
                },
                project: {
                    select: { id: true, name: true }
                }
            }
        });

        // Log activity if status changed
        if (status && task.projectId) {
            await (prisma as any).activity.create({
                data: {
                    projectId: task.projectId,
                    userId: userId,
                    action: 'TASK_UPDATED',
                    metadata: {
                        taskId: taskId,
                        taskTitle: task.title,
                        oldStatus: task.status,
                        newStatus: status,
                        updatedBy: session.user.name
                    }
                }
            }).catch((err: any) => console.error("Failed to log activity:", err));
        }

        return NextResponse.json(updatedTask);

    } catch (error: any) {
        console.error("Task update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = session.user as any;

    // Only managers can delete tasks
    if (!['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        await (prisma as any).task.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Task deletion error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
