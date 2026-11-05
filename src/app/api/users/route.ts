import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMobileSession } from '@/lib/auth-mobile';

// GET /api/users - Fetch all users with basic info
export async function GET(request: NextRequest) {
    // Signed-in users only (web session or mobile bearer token)
    const session = (await getServerSession(authOptions)) || (await getMobileSession());
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                isSuspended: false
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                image: true,
                department: true,
                reportingManagers: {
                    select: { id: true, name: true }
                },
            },
            orderBy: [
                { role: 'asc' },
                { name: 'asc' }
            ]
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

