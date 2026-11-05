import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getMobileSession } from '@/lib/auth-mobile';

export async function GET() {
    try {
        let session = await getServerSession(authOptions);
        
        // Fallback for Flutter Mobile App (Bearer Token)
        if (!session?.user) {
            session = await getMobileSession() as any;
        }

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const userRole = (session.user as any).role?.toUpperCase();
        const isAdmin = userRole === 'ADMIN' || userRole === 'DIRECTOR';

        // 1. Fetch channels based on role and membership
        // Directors see every public channel, but direct messages and private groups only when they are a member.
        const channels = await prisma.chatChannel.findMany({
            where: isAdmin ? { OR: [{ type: 'PUBLIC' }, { members: { some: { id: userId } } }] } : {
                OR: [
                    { 
                        type: 'PUBLIC',
                        spaceId: null // Global public channels (e.g. Announcements)
                    },
                    {
                        type: 'PUBLIC',
                        space: {
                            members: { some: { id: userId } }
                        }
                    },
                    { 
                        members: { some: { id: userId } } 
                    }
                ]
            },
            include: {
                members: {
                    select: { id: true, name: true, image: true, role: true }
                },
                space: {
                    include: {
                        members: {
                            select: { id: true, name: true, image: true, role: true }
                        }
                    }
                },
                _count: {
                    select: { messages: true }
                },
                // newest message, for previews and unread badges
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: { content: true, createdAt: true, attachments: true, sender: { select: { id: true, name: true } } }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // 2. Fetch Spaces
        const spaces = await prisma.space.findMany({
            where: isAdmin ? {} : {
                members: { some: { id: userId } }
            },
            include: {
                members: { select: { id: true, name: true, image: true, role: true } },
                chat: {
                    include: {
                        members: { select: { id: true, name: true, image: true, role: true } }
                    }
                }
            }
        });

        // 3. Robust Deduplication
        // Check if ANY operational announcement exists in the DB (globally for this user)
        const announcementReal = channels.find(c => 
            c.name?.toLowerCase().includes('announcement') || 
            c.name?.toLowerCase().includes('broadcast')
        );
        
        let systemChannels: any[] = [];
        if (!announcementReal) {
            systemChannels.push({
                id: 'sys-announcements',
                name: '📢 Global Announcements',
                type: 'PUBLIC',
                description: 'System-wide broadcasts and updates.',
                isSystem: true,
                members: []
            });
        }

        const existingSpaceChannelIds = channels.filter(c => c.spaceId).map(c => c.spaceId);
        
        // Merge space members into existing channels
        const augmentedChannels = channels.map(c => {
            if (c.spaceId && (c as any).space?.members) {
                const spaceMembers = (c as any).space.members || [];
                const channelMembers = c.members || [];
                const mergedMembers = [...channelMembers];
                
                spaceMembers.forEach((sm: any) => {
                    if (!mergedMembers.some(cm => cm.id === sm.id)) {
                        mergedMembers.push(sm);
                    }
                });
                
                return { ...c, members: mergedMembers };
            }
            return c;
        });

        const spaceChannels = spaces
            .filter(s => !existingSpaceChannelIds.includes(s.id))
            .map(space => {
                if (space.chat) {
                    const spaceMembers = space.members || [];
                    const channelMembers = space.chat.members || [];
                    const mergedMembers = [...channelMembers];
                    spaceMembers.forEach((sm: any) => {
                        if (!mergedMembers.some(cm => cm.id === sm.id)) {
                            mergedMembers.push(sm);
                        }
                    });
                    return { ...space.chat, members: mergedMembers };
                }
                return {
                    id: `space-${space.id}`,
                    name: space.name,
                    type: 'PUBLIC',
                    description: space.description || 'Automatic Department Group',
                    isSpaceChannel: true,
                    spaceId: space.id,
                    members: space.members || []
                };
            });

        // 4. Final Merge & Unique filter (by Name for system channels, then by ID)
        let allChannels = [...systemChannels, ...augmentedChannels, ...spaceChannels];
        
        // Remove duplicates by name for announcements to be absolutely sure
        const seenNames = new Set();
        allChannels = allChannels.filter(c => {
            const name = c.name?.toLowerCase() || '';
            if (name.includes('announcement')) {
                if (seenNames.has('announcement')) return false;
                seenNames.add('announcement');
                return true;
            }
            return true;
        });

        // Deduplicate DIRECT channels by participant pair
        const directMap = new Map();
        const otherChannels: any[] = [];

        allChannels.forEach(c => {
            if (c.type === 'DIRECT') {
                const members = c.members || [];
                const otherMember = members.find((m: any) => m.id !== userId);
                if (otherMember) {
                    const pairKey = [userId, otherMember.id].sort().join('-');
                    if (!directMap.has(pairKey) || new Date(c.updatedAt) > new Date(directMap.get(pairKey).updatedAt)) {
                        directMap.set(pairKey, c);
                    }
                }
            } else {
                otherChannels.push(c);
            }
        });

        const uniqueChannels = [...otherChannels, ...Array.from(directMap.values())];
        
        // Final Unique filter by ID just in case
        const finalChannels = Array.from(new Map(uniqueChannels.map(c => [c.id, c])).values()).map((c: any) => {
            const { messages, space, ...rest } = c;
            const last = messages?.[0];
            return {
                ...rest,
                lastMessage: last ? { content: last.content, createdAt: last.createdAt, senderId: last.sender?.id, senderName: last.sender?.name, hasAttachments: Array.isArray(last.attachments) && last.attachments.length > 0 } : null,
            };
        });

        return NextResponse.json({ channels: finalChannels });

    } catch (error) {
        console.error('CHAT_CHANNELS_GET', error);
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

        const { name, description, type, memberIds } = await req.json();
        const userRole = (session.user as any).role?.toUpperCase();
        const myId = (session.user as any).id;

        // Deduplicate DIRECT channels
        if (type === 'DIRECT' && memberIds && memberIds.length === 1) {
            const otherId = memberIds[0];
            const existing = await prisma.chatChannel.findFirst({
                where: {
                    type: 'DIRECT',
                    AND: [
                        { members: { some: { id: myId } } },
                        { members: { some: { id: otherId } } }
                    ]
                },
                orderBy: { updatedAt: 'desc' },
                include: {
                    members: {
                        select: { id: true, name: true, image: true, role: true }
                    }
                }
            });

            if (existing) {
                return NextResponse.json(existing);
            }
        }

        const authorizedRoles = ['ADMIN', 'DIRECTOR', 'MANAGER'];
        if (type !== 'DIRECT' && !authorizedRoles.includes(userRole)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const channel = await prisma.chatChannel.create({
            data: {
                name,
                description,
                type: type || 'PUBLIC',
                members: {
                    connect: (memberIds || []).map((id: string) => ({ id })).concat([{ id: myId }])
                }
            },
            include: {
                members: {
                    select: { id: true, name: true, image: true, role: true }
                }
            }
        });

        return NextResponse.json(channel);

    } catch (error) {
        console.error('CHAT_CHANNELS_POST', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
