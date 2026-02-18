import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNotification, notifyUserManager, notifyHierarchy } from '@/lib/notifications';

// GET /api/milestones - Fetch milestones based on role
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const employeeId = searchParams.get('employeeId');
    const universityId = searchParams.get('universityId');

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    let whereClause: any = {};

    // Filter by Category
    if (category && category !== 'ALL') {
        whereClause.category = category;
    }

    // Filter by University
    if (universityId) {
        whereClause.universityId = universityId;
    }

    // Role-Based Filtering Logic
    if (userRole === 'DIRECTOR') {
        if (employeeId) whereClause.owner = employeeId;
    }
    else if (userRole === 'MANAGER' || userRole === 'TEAM_LEADER') {
        const userWithSubordinates = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subordinates: { select: { id: true } },
                projects: { select: { id: true } },
                managedSpaces: {
                    include: { projects: { select: { id: true } } }
                }
            }
        });

        const subordinateIds = userWithSubordinates?.subordinates.map(u => u.id) || [];
        const managedProjectIds = userWithSubordinates?.projects.map(p => p.id) || [];
        const managedSpaceProjectIds = userWithSubordinates?.managedSpaces.flatMap(s => s.projects.map(p => p.id)) || [];

        const allAssociatedProjectIds = Array.from(new Set([...managedProjectIds, ...managedSpaceProjectIds]));
        const allowedOwnerIds = [userId, ...subordinateIds];

        if (employeeId) {
            if (allowedOwnerIds.includes(employeeId)) {
                whereClause.owner = employeeId;
            } else {
                return NextResponse.json({ error: 'Forbidden: Cannot view this employee' }, { status: 403 });
            }
        } else {
            whereClause.OR = [
                { owner: { in: allowedOwnerIds } },
                { projectId: { in: allAssociatedProjectIds } },
                { spaceId: { in: userWithSubordinates?.managedSpaces.map(s => s.id) || [] } }
            ];
        }
    }
    else {
        whereClause.owner = userId;
    }

    try {
        const milestones = await prisma.milestone.findMany({
            where: whereClause,
            orderBy: { targetDate: 'asc' },
            include: {
                project: { select: { name: true } },
                university: { select: { name: true } },
                ownerUser: { select: { name: true } },
                comments: {
                    include: {
                        user: { select: { name: true, role: true } }
                    },
                    orderBy: { timestamp: 'desc' }
                }
            }
        });
        return NextResponse.json(milestones);
    } catch (error) {
        console.error('Failed to fetch milestones:', error);
        return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
    }
}

// POST /api/milestones - Create new milestone(s)
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const milestonesData = Array.isArray(body) ? body : [body];

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    if (['EMPLOYEE', 'INTERN'].includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden: Employees cannot create milestones' }, { status: 403 });
    }

    try {
        const results = await (prisma as any).$transaction(async (tx: any) => {
            const createdMilestones = [];

            for (const data of milestonesData) {
                const {
                    title,
                    category,
                    priority,
                    targetDate,
                    description,
                    ownerId,
                    projectId,
                    universityId,
                    mouType,
                    universityName,
                    orderType,
                    isFlagged,
                    remarks
                } = data;

                const newMilestone = await tx.milestone.create({
                    data: {
                        title,
                        category,
                        priority,
                        targetDate: new Date(targetDate),
                        description,
                        owner: ownerId || userId,
                        projectId: projectId || null,
                        universityId: universityId || null,
                        mouType: mouType || null,
                        status: 'PENDING',
                        progress: 0,
                        isFlagged: isFlagged || false,
                        remarks: remarks || null,
                        ...(category === 'BUSINESS_ORDER' && universityName ? {
                            businessOrders: {
                                create: {
                                    title: `Order for ${universityName}`,
                                    universityName,
                                    orderType,
                                    amount: 0,
                                    universityId: universityId || 'MANUAL_ENTRY'
                                }
                            }
                        } : {})
                    }
                });

                if (ownerId && ownerId !== userId) {
                    await notifyHierarchy({
                        actorId: userId,
                        targetId: ownerId,
                        action: 'Milestone Assigned',
                        title: 'New Milestone Assigned',
                        details: `Mission objective assigned: ${title}`,
                        link: '/milestones'
                    });
                }

                createdMilestones.push(newMilestone);
            }
            return createdMilestones;
        });

        return NextResponse.json(results);
    } catch (error) {
        console.error('Failed to create milestone(s):', error);
        return NextResponse.json({ error: 'Failed to create milestone(s)' }, { status: 500 });
    }
}

// PATCH /api/milestones - Update milestone
export async function PATCH(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, status, progress, remarks, isFlagged } = await request.json();
        const userId = (session.user as any).id;

        const oldMilestone = await prisma.milestone.findUnique({
            where: { id },
            select: { status: true, title: true, owner: true }
        });

        if (!oldMilestone) {
            return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
        }

        const updatedMilestone = await prisma.milestone.update({
            where: { id },
            data: {
                status,
                progress,
                remarks,
                isFlagged,
                completedDate: status === 'COMPLETED' ? new Date() : undefined
            }
        });

        if (status === 'COMPLETED' && oldMilestone.status !== 'COMPLETED') {
            const userName = session.user.name || 'An employee';
            await notifyHierarchy({
                actorId: userId,
                targetId: oldMilestone.owner, // If owner completes it, this is ignored, but hierarchy is notified. If manager completes it, owner is notified.
                action: 'Milestone Completed',
                title: 'Milestone Achievement',
                details: `${userName} completed target: ${oldMilestone.title}`,
                link: '/milestones'
            });
        }

        return NextResponse.json(updatedMilestone);
    } catch (error: any) {
        console.error('Failed to update milestone:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
