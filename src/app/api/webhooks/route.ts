import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const webhooks = await (prisma.webhook as any).findMany();
        return NextResponse.json(webhooks);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { url, event } = await request.json();

        if (!url || !event) {
            return NextResponse.json({ error: 'Missing URL or Event type' }, { status: 400 });
        }

        const webhook = await (prisma.webhook as any).create({
            data: { url, event }
        });

        return NextResponse.json(webhook);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        await (prisma.webhook as any).delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
    }
}
