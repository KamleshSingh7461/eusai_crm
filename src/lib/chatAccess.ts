import prisma from '@/lib/prisma';

// Who can read and post in a chat channel. Used by every /api/chat route (web and mobile).
//  - Direct messages and private groups: members only. Not even directors read other people's DMs.
//  - Department channels: department members, channel members, and directors/management.
//  - Global channels (no department): everyone; posting in announcements is limited to leaders.
const ALL_DEPARTMENTS_ROLES = ['DIRECTOR', 'MANAGEMENT', 'ADMIN'];
const ANNOUNCERS = ['DIRECTOR', 'MANAGER', 'ADMIN'];

export const isAnnouncementChannel = (name?: string | null) => !!name && /announcement|broadcast/i.test(name);

export async function getChannelAccess(channelId: string, userId: string, role?: string) {
    const r = (role || '').toUpperCase();
    const channel = await prisma.chatChannel.findUnique({
        where: { id: channelId },
        select: {
            id: true, type: true, name: true, spaceId: true,
            members: { where: { id: userId }, select: { id: true } },
            space: { select: { members: { where: { id: userId }, select: { id: true } } } },
        },
    });
    if (!channel) return { channel: null, canRead: false, canPost: false };

    const isMember = channel.members.length > 0;
    let canRead: boolean;
    if (channel.type === 'DIRECT' || channel.type === 'PRIVATE') canRead = isMember;
    else if (channel.spaceId) canRead = isMember || (channel.space?.members.length ?? 0) > 0 || ALL_DEPARTMENTS_ROLES.includes(r);
    else canRead = true;

    const canPost = canRead && r !== 'MANAGEMENT' && (!isAnnouncementChannel(channel.name) || ANNOUNCERS.includes(r));
    return { channel, canRead, canPost };
}

export const canAnnounce = (role?: string) => ANNOUNCERS.includes((role || '').toUpperCase());
