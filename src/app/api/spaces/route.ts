import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { role, id: userId } = session.user as any;
        let whereClause: any = {};

        if (role === 'DIRECTOR') {
            // Directors see all spaces
            whereClause = {};
        } else if (role === 'MANAGER') {
            // Managers see spaces they created OR spaces containing projects they manage/team works on
            const userWithTeam = await prisma.user.findUnique({
                where: { id: userId },
                include: { subordinates: true }
            }) as any;
            const teamIds = userWithTeam?.subordinates?.map((s: any) => s.id) || [];
            const allTeamIds = [userId, ...teamIds];

            whereClause = {
                OR: [
                    { managerId: userId }, // Created by me
                    {
                        projects: {
                            some: {
                                OR: [
                                    { managerId: userId }, // Managed by me
                                    { tasks: { some: { userId: { in: allTeamIds } } } },
                                    { milestones: { some: { owner: { in: allTeamIds } } } }
                                ]
                            }
                        }
                    }
                ]
            };
        } else {
            // Employees/Team Leaders see spaces where they have assignments
            whereClause = {
                projects: {
                    some: {
                        OR: [
                            { tasks: { some: { userId: userId } } },
                            { milestones: { some: { owner: userId } } }
                        ]
                    }
                }
            };
        }

        const spaces = await prisma.space.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: { projects: true, resources: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(spaces);
    } catch (error) {
        console.error('Error fetching spaces:', error);
        return NextResponse.json({ error: 'Failed to fetch spaces' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { role, id: userId } = session.user as any;
        if (role !== 'DIRECTOR' && role !== 'MANAGER') {
            return NextResponse.json({ error: 'Forbidden: Only executives can create spaces' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, color, type } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const space = await prisma.space.create({
            data: {
                name,
                description,
                color: color || '#0052CC',
                type: type || 'STANDARD',
                managerId: userId // Track who created it
            }
        });

        return NextResponse.json(space, { status: 201 });
    } catch (error) {
        console.error('Error creating space:', error);
        return NextResponse.json({ error: 'Failed to create space' }, { status: 500 });
    }
}
