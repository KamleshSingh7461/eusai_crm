import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getMobileSession } from '@/lib/auth-mobile';

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        let session = await getServerSession(authOptions);
        if (!session?.user) {
            session = await getMobileSession() as any;
        }

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { content } = await req.json();
        const { id } = params;

        const message = await prisma.chatMessage.findUnique({
            where: { id }
        });

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        if (message.senderId !== userId) {
            return NextResponse.json({ error: 'Forbidden: You can only edit your own messages' }, { status: 403 });
        }

        // 5-minute check (300,000 ms)
        const diff = Date.now() - new Date(message.createdAt).getTime();
        if (diff > 5 * 60 * 1000) {
            return NextResponse.json({ error: 'Edit window expired (5-minute limit)' }, { status: 400 });
        }

        const updated = await prisma.chatMessage.update({
            where: { id },
            data: { 
                content,
                updatedAt: new Date()
            },
            include: {
                sender: {
                    select: { id: true, name: true, email: true, image: true, role: true }
                }
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('CHAT_MESSAGE_PATCH', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        let session = await getServerSession(authOptions);
        if (!session?.user) {
            session = await getMobileSession() as any;
        }

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { id } = params;

        const message = await prisma.chatMessage.findUnique({
            where: { id }
        });

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        if (message.senderId !== userId) {
            return NextResponse.json({ error: 'Forbidden: You can only delete your own messages' }, { status: 403 });
        }

        // 5-minute check
        const diff = Date.now() - new Date(message.createdAt).getTime();
        if (diff > 5 * 60 * 1000) {
            return NextResponse.json({ error: 'Delete window expired (5-minute limit)' }, { status: 400 });
        }

        await prisma.chatMessage.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('CHAT_MESSAGE_DELETE', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
