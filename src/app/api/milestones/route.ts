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
        if (employeeId) {
            whereClause.owner = employeeId;
        }
    }
    else if (userRole === 'MANAGER' || userRole === 'TEAM_LEADER') {
        // Managers and TLs see their subordinates + self
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { subordinates: true }
        });

        const subordinateIds = currentUser?.subordinates?.map(u => u.id) || [];
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

// POST /api/milestones - Create milestones (supports batch)
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Permission Check
    if (['EMPLOYEE', 'INTERN'].includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden: Employees cannot create milestones' }, { status: 403 });
    }

    try {
        const body = await request.json();

        // Support both single object and array for batch creation
        const milestonesData = Array.isArray(body) ? body : [body];

        if (milestonesData.length === 0) {
            return NextResponse.json({ error: 'No milestone data provided' }, { status: 400 });
        }

        const createdMilestones = await Promise.all(
            milestonesData.map(async (data) => {
                const {
                    title,
                    category,
                    priority,
                    targetDate,
                    description,
                    assignedTo,
                    projectId,
                    universityId,
                    universityName,
                    mouType
                } = data;

                if (!projectId) {
                    throw new Error('Project connection is mandatory for all milestones');
                }

                return prisma.milestone.create({
                    data: {
                        title: title || 'New Milestone',
                        category: category || 'MOU',
                        priority: priority || 'MEDIUM',
                        targetDate: new Date(targetDate),
                        description: description || '',
                        owner: assignedTo || userId,
                        projectId: projectId || null,
                        universityId: universityId || null,
                        universityName: universityName || null,
                        mouType: mouType || null,
                        status: 'PENDING',
                        progress: 0
                    }
                });
            })
        );

        return NextResponse.json(createdMilestones);
    } catch (error) {
        console.error('Failed to create milestones:', error);
        return NextResponse.json({ error: 'Failed to create milestones' }, { status: 500 });
    }
}
