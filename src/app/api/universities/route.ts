import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/universities - Fetch all universities
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional: Filter by status
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const teamOnly = searchParams.get('teamOnly') === 'true';
    const { role: userRole, id: userId } = (session.user as any);

    let whereClause: any = {};
    if (status && status !== 'ALL') {
        whereClause.status = status;
    }

    try {
        // Implement Team Leader / Manager filtering
        let teamIds: string[] = [userId];

        if (userRole === 'TEAM_LEADER' || userRole === 'MANAGER') {
            const userWithTeam = await (prisma as any).user.findUnique({
                where: { id: userId },
                include: { reportingSubordinates: true }
            });

            if (userWithTeam?.reportingSubordinates) {
                teamIds = [userId, ...userWithTeam.reportingSubordinates.map((s: any) => s.id)];
            }
        }

        // Apply filters
        if (teamOnly) {
            whereClause.OR = [
                { milestones: { some: { owner: { in: teamIds } } } },
                { businessOrders: { some: { milestone: { owner: { in: teamIds } } } } }
            ];
        }

        const universities = await (prisma as any).university.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: {
                        milestones: true,
                        businessOrders: true
                    }
                },
                milestones: {
                    select: {
                        status: true,
                        progress: true,
                        owner: true
                    }
                },
                businessOrders: {
                    select: {
                        amount: true,
                        status: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Calculate metadata for Managers/Directors
        const isExecutive = ['DIRECTOR', 'MANAGER'].includes(userRole);
        let meta = null;

        if (isExecutive) {
            const allOrders = universities.flatMap((u: any) => u.businessOrders);
            const totalValue = allOrders.reduce((acc: any, o: any) => acc + Number(o.amount), 0);
            const paidValue = allOrders.filter((o: any) => o.status === 'PAID').reduce((acc: any, o: any) => acc + Number(o.amount), 0);

            const totalMilestones = universities.reduce((acc: any, u: any) => acc + u._count.milestones, 0);
            const completedMilestones = universities.flatMap((u: any) => u.milestones).filter((m: any) => m.status === 'COMPLETED').length;

            const partnerCount = universities.filter((u: any) => u.status === 'PARTNER').length;
            const prospectCount = universities.filter((u: any) => u.status === 'PROSPECT').length;

            meta = {
                totalEntities: universities.length,
                partnerCount,
                prospectCount,
                conversionRate: universities.length > 0 ? ((partnerCount / universities.length) * 100).toFixed(1) : "0",
                totalValue,
                paidValue,
                milestoneProgress: totalMilestones > 0 ? ((completedMilestones / totalMilestones) * 100).toFixed(1) : "0"
            };
        }

        return NextResponse.json({ universities, meta });
    } catch (error) {
        console.error('Failed to fetch universities:', error);
        return NextResponse.json({ error: 'Failed to fetch universities' }, { status: 500 });
    }
}

// POST /api/universities - Create new university
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = (session.user as any);
    // Only Directors, Managers, Team Leaders can add universities?
    // Let's allow Employees to add PROSPECTS, but maybe restrict PARTNER status changes.
    // For now, open to all authenticated users for ease of data entry.

    try {
        const body = await request.json();
        const { name, location, contactPerson, email, phone, website, status, description } = body;

        const newUniversity = await (prisma as any).university.create({
            data: {
                name,
                location,
                status: status || 'PROSPECT',
                contactPerson,
                email,
                phone,
                website,
                description
            }
        });
        return NextResponse.json(newUniversity);
    } catch (error) {
        console.error('Failed to create university:', error);
        return NextResponse.json({ error: 'Failed to create university' }, { status: 500 });
    }
}
// PATCH /api/universities - Update university
export async function PATCH(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: 'University ID is required' }, { status: 400 });
        }

        const updatedUniversity = await (prisma as any).university.update({
            where: { id },
            data: updateData
        });
        return NextResponse.json(updatedUniversity);
    } catch (error) {
        console.error('Failed to update university:', error);
        return NextResponse.json({ error: 'Failed to update university' }, { status: 500 });
    }
}
