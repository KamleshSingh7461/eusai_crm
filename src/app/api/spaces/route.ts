import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const spaces = await prisma.space.findMany({
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

        const { role } = session.user as any;
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
                type: type || 'STANDARD'
            }
        });

        return NextResponse.json(space, { status: 201 });
    } catch (error) {
        console.error('Error creating space:', error);
        return NextResponse.json({ error: 'Failed to create space' }, { status: 500 });
    }
}
