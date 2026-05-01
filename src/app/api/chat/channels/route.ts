import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const userRole = (session.user as any).role?.toUpperCase();
        const isAdmin = userRole === 'ADMIN' || userRole === 'DIRECTOR';

        // 1. Fetch ALL public channels + private channels I am a member of
        const channels = await prisma.chatChannel.findMany({
            where: {
                OR: [
                    { type: 'PUBLIC' },
                    { members: { some: { id: userId } } }
                ]
            },
            include: {
                members: {
                    select: { id: true, name: true, image: true, role: true }
                },
                _count: {
                    select: { messages: true }
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
        const spaceChannels = spaces
            .filter(s => !existingSpaceChannelIds.includes(s.id))
            .map(space => {
                if (space.chat) return space.chat;
                return {
                    id: `space-${space.id}`,
                    name: space.name,
                    type: 'PUBLIC',
                    description: space.description || 'Automatic Department Group',
                    isSpaceChannel: true,
                    spaceId: space.id,
                    members: []
                };
            });

        // 4. Final Merge & Unique filter (by Name for system channels, then by ID)
        let allChannels = [...systemChannels, ...channels, ...spaceChannels];
        
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

        const uniqueChannels = Array.from(new Map(allChannels.map(c => [c.id, c])).values());

        return NextResponse.json({ channels: uniqueChannels });

    } catch (error) {
        console.error('CHAT_CHANNELS_GET', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, description, type, memberIds } = await req.json();
        const userRole = (session.user as any).role?.toUpperCase();

        const authorizedRoles = ['ADMIN', 'DIRECTOR', 'MANAGER'];
        if (!authorizedRoles.includes(userRole)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const channel = await prisma.chatChannel.create({
            data: {
                name,
                description,
                type: type || 'PUBLIC',
                members: {
                    connect: (memberIds || []).map((id: string) => ({ id })).concat([{ id: (session.user as any).id }])
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
