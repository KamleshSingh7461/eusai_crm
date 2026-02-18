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
        const { status, priority, deadline, description, title, completionRemark, completionProof } = body;

        // Get the task first to check permissions
        const task = await (prisma as any).task.findUnique({
            where: { id: taskId },
            include: { assignedTo: true }
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const isAssignedToUser = task.userId === userId;
        const isManager = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(role);

        // Permission check: Employees/Interns can only update tasks assigned to them
        if (!isManager && !isAssignedToUser) {
            return NextResponse.json({ error: 'Forbidden: You are not authorized to update this mission' }, { status: 403 });
        }

        // Status update check: Managers can update status ONLY if they are assigned to it
        if (status !== undefined && !isAssignedToUser) {
            return NextResponse.json({
                error: 'Tactical Status Update Protocol: Only the assigned operative can update mission status.'
            }, { status: 403 });
        }

        // Build update data
        const updateData: any = {};

        // Operatives (including managers who are operatives) can update status and completion proof
        if (isAssignedToUser) {
            if (status !== undefined) updateData.status = status;
        }

        // Only managers (Directors/Managers/Team Leaders) can update administrative fields
        if (isManager) {
            if (priority !== undefined) updateData.priority = parseInt(priority);
            if (deadline !== undefined) updateData.deadline = new Date(deadline);
            if (description !== undefined) updateData.description = description;
            if (title !== undefined) updateData.title = title;
        }

        // Update the task record
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

        // Generate completion audit trail (Comment) if data provided
        if (completionRemark || completionProof) {
            try {
                await (prisma as any).comment.create({
                    data: {
                        taskId: taskId,
                        userId: userId,
                        text: completionRemark || "Mission objective completed. Evidence logged.",
                        attachments: completionProof ? [completionProof] : [],
                        projectId: task.projectId
                    }
                });
            } catch (err: any) {
                console.error("Audit failure: Failed to log completion evidence:", err);
                // We don't fail the whole request if the comment fails, but we log it
            }
        }

        // Protocol Activity Log
        if (status && task.projectId) {
            try {
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
                            updatedBy: session.user.name,
                            hasProof: !!completionProof
                        }
                    }
                });
            } catch (err: any) {
                console.error("Telemetry failure: Failed to log mission activity:", err);
            }
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
