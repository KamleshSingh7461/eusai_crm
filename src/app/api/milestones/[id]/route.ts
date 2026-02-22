import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PATCH /api/milestones/[id] - Update milestone
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { status, progress, remarks, isFlagged, completionRemark, completionProof } = body;
        const milestoneId = params.id;
        const userRole = (session.user as any).role;
        const userId = (session.user as any).id;

        // Fetch milestone to check ownership
        const milestone = await prisma.milestone.findUnique({
            where: { id: milestoneId },
            include: {
                project: { include: { managers: true } },
                space: { select: { managerId: true } }
            }
        });

        if (!milestone) {
            return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
        }

        // Authorization Logic
        const isOwner = milestone.owner === userId;
        const isDirector = userRole === 'DIRECTOR';
        const isProjectManager = milestone.project?.managers.some((m: any) => m.id === userId);
        const isSpaceManager = milestone.space?.managerId === userId;

        let isDirectManager = false;
        if (userRole === 'MANAGER' || userRole === 'TEAM_LEADER') {
            const manager = await prisma.user.findUnique({
                where: { id: userId },
                include: { reportingSubordinates: { select: { id: true } } }
            });
            isDirectManager = manager?.reportingSubordinates.some(s => s.id === milestone.owner) || false;
        }

        const canUpdateStatus = isOwner || isDirector || isProjectManager || isSpaceManager || isDirectManager;
        const canUpdateGovernance = isDirector || isProjectManager || isSpaceManager || isDirectManager;

        if (!canUpdateStatus && !canUpdateGovernance) {
            return NextResponse.json({ error: 'Forbidden: You are not authorized to update this objective' }, { status: 403 });
        }

        // Data to update based on permissions
        const dataToUpdate: any = {};
        if (canUpdateStatus) {
            if (status) dataToUpdate.status = status;
            if (progress !== undefined) dataToUpdate.progress = progress;
            if (status === 'COMPLETED') dataToUpdate.completedDate = new Date();
        }

        if (canUpdateGovernance) {
            if (remarks !== undefined) dataToUpdate.remarks = remarks;
            if (isFlagged !== undefined) dataToUpdate.isFlagged = isFlagged;
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json({ error: 'No authorized fields provided for update' }, { status: 400 });
        }

        const updatedMilestone = await prisma.milestone.update({
            where: { id: milestoneId },
            data: dataToUpdate
        });

        // Generate completion audit trail (Comment) if data provided
        if (completionRemark || completionProof) {
            try {
                await (prisma as any).comment.create({
                    data: {
                        milestoneId: milestoneId,
                        userId: userId,
                        text: completionRemark || "Strategic objective completed. Evidence logged.",
                        attachments: completionProof ? [completionProof] : [],
                        projectId: milestone.projectId
                    }
                });
            } catch (err: any) {
                console.error("Audit failure: Failed to log milestone completion evidence:", err);
            }
        }

        return NextResponse.json(updatedMilestone);
    } catch (error) {
        console.error('Failed to update milestone:', error);
        return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
    }
}

// DELETE /api/milestones/[id] - Delete milestone
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['DIRECTOR', 'MANAGER'].includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        await (prisma as any).milestone.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ message: 'Milestone deleted' });
    } catch (error) {
        console.error('Failed to delete milestone:', error);
        return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
    }
}
