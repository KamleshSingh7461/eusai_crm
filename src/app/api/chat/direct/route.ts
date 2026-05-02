import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { recipientId } = await req.json();
        const userId = (session.user as any).id;

        if (!recipientId) {
            return NextResponse.json({ error: 'Recipient ID required' }, { status: 400 });
        }

        // 1. Find if a DM channel already exists between these two users
        // This is a bit complex in Prisma for many-to-many. 
        // We look for a channel of type DIRECT that has exactly both users.
        const existingChannel = await prisma.chatChannel.findFirst({
            where: {
                type: 'DIRECT',
                AND: [
                    { members: { some: { id: userId } } },
                    { members: { some: { id: recipientId } } }
                ]
            },
            orderBy: { updatedAt: 'desc' },
            include: {
                members: {
                    select: { id: true, name: true, image: true, role: true }
                }
            }
        });

        if (existingChannel) {
            return NextResponse.json(existingChannel);
        }

        // 2. Create new DM channel
        const recipient = await prisma.user.findUnique({
            where: { id: recipientId },
            select: { name: true }
        });

        if (!recipient) {
            return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
        }

        const newChannel = await prisma.chatChannel.create({
            data: {
                type: 'DIRECT',
                members: {
                    connect: [
                        { id: userId },
                        { id: recipientId }
                    ]
                }
            },
            include: {
                members: {
                    select: { id: true, name: true, image: true, role: true }
                }
            }
        });

        return NextResponse.json(newChannel);

    } catch (error) {
        console.error('CHAT_DIRECT_POST', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
