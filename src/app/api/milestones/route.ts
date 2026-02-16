import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
        // Directors see all. If employeeId provided, filter by it.
        if (employeeId) whereClause.owner = employeeId;
    }
    else if (userRole === 'MANAGER') {
        // Managers see their department's milestones.
        // For simplicity in this iteration, we might show all or filter by subordinate list.
        // Ideally: Fetch subordinates -> filter where owner in subordinates OR owner = self.

        // Fetch subordinates first
        const userWithSubordinates = await prisma.user.findUnique({
            where: { id: userId },
            include: { subordinates: true }
        });

        const subordinateIds = userWithSubordinates?.subordinates.map(u => u.id) || [];
        const allowedIds = [userId, ...subordinateIds];

        if (employeeId) {
            // Can only view if employeeId is in allowed list
            if (allowedIds.includes(employeeId)) {
                whereClause.owner = employeeId;
            } else {
                return NextResponse.json({ error: 'Forbidden: Cannot view this employee' }, { status: 403 });
            }
        } else {
            // View all allowed
            whereClause.owner = { in: allowedIds };
        }
    }
    else if (userRole === 'TEAM_LEADER' || userRole === 'MANAGER') {
        // Managers and TLs see their team's milestones.
        const userWithSubordinates = await prisma.user.findUnique({
            where: { id: userId },
            include: { subordinates: true }
        }) as any;

        const subordinateIds = userWithSubordinates?.subordinates?.map((u: any) => u.id) || [];
        const allowedIds = [userId, ...subordinateIds];

        if (employeeId) {
            if (allowedIds.includes(employeeId)) {
                whereClause.owner = employeeId;
            } else {
                return NextResponse.json({ error: 'Forbidden: Cannot view this employee' }, { status: 403 });
            }
        } else {
            whereClause.owner = { in: allowedIds };
        }
    }
    else {
        // Employee/Intern: See ONLY assigned to self
        whereClause.owner = userId;
    }

    try {
        const milestones = await prisma.milestone.findMany({
            where: whereClause,
            orderBy: { targetDate: 'asc' },
            include: {
                project: { select: { name: true } },
                university: { select: { name: true } }
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

    // Permission Check
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
