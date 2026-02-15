import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = session.user as any;

    // Allow Directors, Managers, and Team Leaders to fetch this list
    if (!['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // Fetch users who CAN be project managers (Directors, Managers) - Exclude Team Leaders from the options
        const potentialManagers = await prisma.user.findMany({
            where: {
                role: {
                    in: ['DIRECTOR', 'MANAGER']
                }
            },
            select: {
                id: true,
                name: true,
                role: true,
                email: true
            },
            orderBy: [
                { name: 'asc' }
            ]
        });

        return NextResponse.json(potentialManagers);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
