
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";

// GET /api/orders - List orders (optionally filtered by universityId)
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('universityId');

    try {
        const whereClause: any = {};
        if (universityId) {
            whereClause.universityId = universityId;
        }

        const orders = await prisma.businessOrder.findMany({
            where: whereClause,
            include: {
                university: {
                    select: { name: true }
                },
                milestone: {
                    select: { title: true }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

// POST /api/orders - Create a new order
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, amount, universityId, milestoneId, description, status, date } = body;

        if (!title || !amount || !universityId) {
            return NextResponse.json(
                { error: 'Missing required fields: title, amount, universityId' },
                { status: 400 }
            );
        }

        // anyone may record an order, but only leaders mark it paid or cancelled; Management is read-only
        const role = String((session.user as any)?.role || '');
        if (role === 'MANAGEMENT') return NextResponse.json({ error: 'Read-only role' }, { status: 403 });
        const isLeader = ['DIRECTOR', 'ADMIN', 'MANAGER', 'TEAM_LEADER'].includes(role);
        if (status && !['PENDING', 'PAID', 'CANCELLED'].includes(status)) {
            return NextResponse.json({ error: 'Unknown order status.' }, { status: 400 });
        }
        if (status && status !== 'PENDING' && !isLeader) {
            return NextResponse.json({ error: 'Only a Director, Manager or Team leader can mark an order paid or cancelled.' }, { status: 403 });
        }
        const value = parseFloat(amount);
        if (!Number.isFinite(value) || value <= 0 || value > 1e12) {
            return NextResponse.json({ error: 'Enter an amount greater than zero.' }, { status: 400 });
        }

        const order = await prisma.businessOrder.create({
            data: {
                title,
                amount: value,
                universityId,
                milestoneId: milestoneId || null,
                description,
                status: status || 'PENDING',
                date: date ? new Date(date) : new Date(),
            }
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error('Failed to create order:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
