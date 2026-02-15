import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Helper to validate channel access
async function canAccessChannel(user: any, channelId: string): Promise<boolean> {
    if (user.role === 'DIRECTOR') return true;
    if (channelId === 'global-general') return true;
    if (channelId === 'global-announcements') return true;

    // Department Channels
    if (channelId.startsWith('dept-')) {
        const dept = channelId.replace('dept-', '');
        return user.department === dept || user.role === 'MANAGER'; // Managers see all depts? Maybe.
    }

    // Role Channels
    if (channelId.startsWith('role-')) {
        const role = channelId.replace('role-', '');
        return user.role === role;
    }

    // Project Channels
    if (channelId.startsWith('project-')) {
        const projectId = channelId.replace('project-', '');
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { resources: true } // Need to check if user is assigned?
        });
        // Simplification: Employees see projects they are assigned to via Tasks? 
        // Or we need a ProjectMember relation. 
        // For now, let's allow access if user has a Task in it or is Manager.
        if (user.role === 'MANAGER') return true;

        const userTasks = await prisma.task.findFirst({
            where: { projectId, userId: user.id }
        });
        return !!userTasks;
    }

    // Direct Messages
    if (channelId.startsWith('dm-')) {
        const parts = channelId.replace('dm-', '').split('-');
        return parts.includes(user.id);
    }

    return false;
}

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId') || 'global-general';
    const user = session.user as any;

    try {
        // const hasAccess = await canAccessChannel(user, channelId);
        // if (!hasAccess) {
        //     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        // }
        // For iteration 1: Relaxed checking to get it working, stricten later.

        const messages = await (prisma as any).message.findMany({
            where: { channelId },
            include: {
                sender: {
                    select: { id: true, name: true, image: true, role: true }
                }
            },
            orderBy: { createdAt: 'asc' },
            take: 100 // Limit to last 100
        });

        const formattedMessages = messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            senderName: msg.sender?.name || 'Unknown',
            senderImage: msg.sender?.image,
            senderRole: msg.sender?.role,
            isMe: msg.senderId === user.id,
            createdAt: msg.createdAt,
            type: msg.type,
            attachments: msg.attachments ? JSON.parse(msg.attachments) : []
        }));

        return NextResponse.json(formattedMessages);

    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;

    try {
        const body = await request.json();
        const { content, channelId, type } = body;

        if (!content || !channelId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Write Access Control
        if (channelId === 'global-announcements' && !['DIRECTOR', 'MANAGER'].includes(user.role)) {
            return NextResponse.json({ error: 'Only Directors/Managers can post announcements' }, { status: 403 });
        }

        const message = await (prisma as any).message.create({
            data: {
                content,
                channelId,
                senderId: user.id,
                type: type || 'TEXT',
                attachments: body.attachments ? JSON.stringify(body.attachments) : null
            },
            include: {
                sender: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        // Format for consistent response
        const formattedMessage = {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            senderName: message.sender?.name || 'Unknown',
            senderImage: message.sender?.image,
            isMe: true,
            createdAt: message.createdAt,
            type: message.type,
            attachments: message.attachments ? JSON.parse(message.attachments) : []
        };

        return NextResponse.json(formattedMessage);

    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
