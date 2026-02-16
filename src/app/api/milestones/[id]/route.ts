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

        const updatedMilestone = await (prisma as any).milestone.update({
            where: { id: milestoneId },
            data: {
                ...(status && { status }),
                ...(progress !== undefined && { progress }),
                ...(remarks !== undefined && { remarks }),
                ...(isFlagged !== undefined && { isFlagged })
            }
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
