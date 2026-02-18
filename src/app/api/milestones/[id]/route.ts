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
        const { status, progress, remarks, isFlagged } = body;
        const milestoneId = params.id;
        const userRole = (session.user as any).role;
        const userId = (session.user as any).id;

        // Fetch milestone to check ownership
        const milestone = await prisma.milestone.findUnique({
            where: { id: milestoneId },
            include: {
                project: { select: { managerId: true } },
                space: { select: { managerId: true } }
            }
        });

        if (!milestone) {
            return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
        }

        // Authorization Logic
        const isOwner = milestone.owner === userId;
        const isDirector = userRole === 'DIRECTOR';

        // Check if user is manager of the project or space
        const isProjectManager = milestone.project?.managerId === userId;
        const isSpaceManager = milestone.space?.managerId === userId;

        // Check if user is the direct manager of the owner
        let isDirectManager = false;
        if (userRole === 'MANAGER' || userRole === 'TEAM_LEADER') {
            const manager = await prisma.user.findUnique({
                where: { id: userId },
                include: { subordinates: { select: { id: true } } }
            });
            isDirectManager = manager?.subordinates.some(s => s.id === milestone.owner) || false;
        }

        const canUpdateStatus = isOwner || isDirector || isProjectManager || isSpaceManager || isDirectManager;
        const canUpdateGovernance = isDirector || isProjectManager || isSpaceManager || isDirectManager;

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
            return NextResponse.json({ error: 'Forbidden: No authorized fields to update' }, { status: 403 });
        }

        const updatedMilestone = await prisma.milestone.update({
            where: { id: milestoneId },
            data: dataToUpdate
        });

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
