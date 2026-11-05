import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendPushNotification } from '@/lib/webPush';
import { sendFcmNotification } from '@/lib/fcm';
import { getMobileSession } from '@/lib/auth-mobile';
import { canAnnounce, getChannelAccess } from '@/lib/chatAccess';

const senderSelect = { id: true, name: true, email: true, image: true, role: true };
const PAGE = 200;

export async function GET(req: Request) {
    try {
        let session = await getServerSession(authOptions);
        if (!session?.user) {
            session = await getMobileSession() as any;
        }

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const channelId = searchParams.get('channelId');

        if (!channelId) {
            return NextResponse.json({ error: 'Channel ID required' }, { status: 400 });
        }

        // Handle Virtual IDs (e.g. space-xyz, sys-abc)
        if (channelId.startsWith('space-') || channelId.startsWith('sys-')) {
            return NextResponse.json({ messages: [] });
        }

        const { canRead } = await getChannelAccess(channelId, (session.user as any).id, (session.user as any).role);
        if (!canRead) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Paging (all optional, so older clients keep working):
        //   after=<ISO date>  only messages newer than this (cheap polling)
        //   before=<ISO date> older messages for infinite scroll
        //   limit=<n>         page size (max 500)
        // Without them: the latest page, oldest first, as before.
        const after = searchParams.get('after');
        const before = searchParams.get('before');
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '') || PAGE, 1), 500);

        if (after) {
            const messages = await prisma.chatMessage.findMany({
                where: { channelId, OR: [{ createdAt: { gt: new Date(after) } }, { updatedAt: { gt: new Date(after) } }] },
                include: { sender: { select: senderSelect } },
                orderBy: { createdAt: 'asc' },
                take: 500,
            });
            return NextResponse.json({ messages, hasMore: false });
        }

        const page = await prisma.chatMessage.findMany({
            where: { channelId, ...(before ? { createdAt: { lt: new Date(before) } } : {}) },
            include: { sender: { select: senderSelect } },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
        });
        const hasMore = page.length > limit;
        const messages = page.slice(0, limit).reverse();

        return NextResponse.json({ messages, hasMore });

    } catch (error) {
        console.error('CHAT_MESSAGES_GET', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        let session = await getServerSession(authOptions);
        if (!session?.user) {
            session = await getMobileSession() as any;
        }

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const senderName = session.user.name || 'Someone';
        const { channelId, content, attachments } = await req.json();
        const role = (session.user as any).role;

        if (!channelId || (typeof content !== 'string') || (!content.trim() && !(Array.isArray(attachments) && attachments.length))) {
            return NextResponse.json({ error: 'A message needs text or an attachment' }, { status: 400 });
        }
        if (channelId === 'sys-announcements' && !canAnnounce(role)) {
            return NextResponse.json({ error: 'Only leaders can post announcements' }, { status: 403 });
        }
        if (channelId.startsWith('space-')) {
            const spaceId = channelId.replace('space-', '');
            const inSpace = await prisma.space.count({ where: { id: spaceId, members: { some: { id: userId } } } });
            if (!inSpace && !['DIRECTOR', 'MANAGEMENT', 'ADMIN'].includes((role || '').toUpperCase())) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        let targetChannelId = channelId;

        // Auto-Provisioning for Virtual IDs
        if (channelId.startsWith('space-')) {
            const spaceId = channelId.replace('space-', '');
            const space = await prisma.space.findUnique({
                where: { id: spaceId },
                include: { members: true }
            });

            if (space) {
                const existing = await prisma.chatChannel.findFirst({ where: { spaceId: space.id } });
                if (existing) {
                    targetChannelId = existing.id;
                } else {
                    const channel = await prisma.chatChannel.create({
                        data: {
                            name: space.name,
                            type: 'PUBLIC',
                            spaceId: space.id,
                            members: {
                                connect: space.members.map(m => ({ id: m.id }))
                            }
                        }
                    });
                    targetChannelId = channel.id;
                }
            }
        } else if (channelId === 'sys-announcements') {
            const existing = await prisma.chatChannel.findFirst({ where: { name: 'Global Announcements' } });
            if (existing) {
                targetChannelId = existing.id;
            } else {
                const allUsers = await prisma.user.findMany({ select: { id: true } });
                const channel = await prisma.chatChannel.create({
                    data: {
                        name: 'Global Announcements',
                        type: 'PUBLIC',
                        members: {
                            connect: allUsers.map(u => ({ id: u.id }))
                        }
                    }
                });
                targetChannelId = channel.id;
            }
        }

        if (!channelId.startsWith('space-') && channelId !== 'sys-announcements') {
            const { canPost } = await getChannelAccess(targetChannelId, userId, role);
            if (!canPost) {
                return NextResponse.json({ error: 'You can’t post in this conversation' }, { status: 403 });
            }
        }

        const message = await prisma.chatMessage.create({
            data: {
                content,
                attachments,
                senderId: userId,
                channelId: targetChannelId
            },
            include: {
                sender: {
                    select: { id: true, name: true, email: true, image: true, role: true }
                }
            }
        });

        // Update channel's updatedAt for sorting
        const channel = await prisma.chatChannel.update({
            where: { id: targetChannelId },
            data: { updatedAt: new Date() },
            include: {
                members: { select: { id: true } }
            }
        });

        // --- Push Notifications: Notify all other channel members ---
        const otherMembers = channel.members.filter(m => m.id !== userId);
        const isDM = channel.type === 'DIRECT';
        const notifTitle = isDM ? `New message from ${senderName}` : `${senderName} in #${channel.name || 'channel'}`;
        const notifBody = content.length > 100 ? content.substring(0, 97) + '...' : content;
        const notifUrl = `/inbox?channelId=${targetChannelId}`;

        // Mentions detection (notify mentioned users specifically)
        const mentionedUserIds = new Set<string>();
        const mentions = content.match(/@\[([^\]]+)\]\(user:([^\)]+)\)/g);
        if (mentions) {
            for (const mention of mentions) {
                const mentionMatch = mention.match(/user:([^\)]+)\)/);
                if (mentionMatch) {
                    const mentionedUserId = mentionMatch[1];
                    mentionedUserIds.add(mentionedUserId);
                    await prisma.notification.create({
                        data: {
                            userId: mentionedUserId,
                            title: `${senderName} mentioned you`,
                            message: notifBody,
                            type: 'INFO',
                            link: notifUrl
                        }
                    });
                    // Push for mention
                    await sendPushNotification(mentionedUserId, {
                        title: `🔔 ${senderName} mentioned you`,
                        body: notifBody,
                        url: notifUrl
                    });
                }
            }
        }

        // Push for all other members (skip those already notified via mention)
        await Promise.all(
            otherMembers
                .filter(m => !mentionedUserIds.has(m.id))
                .map(async (m) => {
                    // 1. Send Web Push
                    await sendPushNotification(m.id, {
                        title: notifTitle,
                        body: notifBody,
                        url: notifUrl
                    });

                    // 2. Send Native FCM
                    const fcmTokens = await prisma.fcmToken.findMany({
                        where: { userId: m.id },
                        select: { token: true }
                    });
                    if (fcmTokens.length > 0) {
                        await sendFcmNotification(
                            fcmTokens.map(t => t.token),
                            {
                                title: notifTitle,
                                body: notifBody,
                                data: { url: notifUrl }
                            }
                        );
                    }
                })
        );

        return NextResponse.json(message);

    } catch (error) {
        console.error('CHAT_MESSAGES_POST', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
