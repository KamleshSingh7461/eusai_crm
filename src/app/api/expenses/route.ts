import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/mongodb';
import { Activity } from '@/models/MongoModels';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    try {
        const { projectId, amount, category, description } = await request.json();

        if (!projectId || !amount || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create expense record with PENDING status and userId
        const expense = await prisma.expense.create({
            data: {
                projectId,
                userId,
                amount: parseFloat(amount),
                category,
                description,
                status: 'PENDING',
                date: new Date()
            }
        });

        // 2. Log activity
        await dbConnect();
        await Activity.create({
            projectId,
            userId: userId,
            action: 'EXPENSE_LOGGED',
            metadata: {
                category,
                amount,
                status: 'PENDING'
            },
            timestamp: new Date()
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error: any) {
        console.error('Expense logging error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const personal = searchParams.get('personal');

        let where: any = {};
        if (projectId) {
            where.projectId = projectId;
        } else if (personal === 'true') {
            where.userId = userId;
        } else {
            return NextResponse.json({ error: 'Project ID or personal flag required' }, { status: 400 });
        }

        const expenses = await prisma.expense.findMany({
            where,
            include: {
                project: { select: { name: true } }
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(expenses);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
