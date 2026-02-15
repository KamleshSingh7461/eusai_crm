import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = (session.user as any);
    if (role !== 'MANAGER' && role !== 'DIRECTOR') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { status } = body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const expense = await prisma.expense.update({
            where: { id: id },
            data: { status }
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error("Error updating expense:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
