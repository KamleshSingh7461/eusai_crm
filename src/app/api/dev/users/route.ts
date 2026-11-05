import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isDevLoginEnabled } from '@/lib/env';

export const dynamic = 'force-dynamic';

// Users offered by the local-only dev login. 404 everywhere else.
export async function GET() {
    if (!isDevLoginEnabled) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const users = await prisma.user.findMany({
        select: { email: true, name: true, role: true },
        orderBy: [{ role: 'asc' }, { name: 'asc' }]
    });
    return NextResponse.json(users);
}
