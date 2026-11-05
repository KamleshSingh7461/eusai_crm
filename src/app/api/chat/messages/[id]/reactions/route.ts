import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getMobileSession } from '@/lib/auth-mobile';
import { getChannelAccess } from '@/lib/chatAccess';

// POST /api/chat/messages/:id/reactions  { emoji } : toggles the caller's reaction.
// Stored in ChatMessage.reactions as { "👍": ["userId", ...], ... }.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    let session = await getServerSession(authOptions);
    if (!session?.user) session = await getMobileSession() as any;
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const { id } = await params;
    const { emoji } = await req.json().catch(() => ({}));
    if (typeof emoji !== 'string' || !emoji || emoji.length > 16) {
        return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
    }

    const message = await prisma.chatMessage.findUnique({ where: { id }, select: { channelId: true, reactions: true } });
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    const { canRead } = await getChannelAccess(message.channelId, userId, (session.user as any).role);
    if (!canRead) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const reactions: Record<string, string[]> = { ...((message.reactions as Record<string, string[]>) || {}) };
    const users = new Set(reactions[emoji] || []);
    if (users.has(userId)) users.delete(userId);
    else users.add(userId);
    if (users.size) reactions[emoji] = [...users];
    else delete reactions[emoji];

    // Keep updatedAt unchanged-ish semantics: a reaction counts as an update so pollers pick it up.
    const updated = await prisma.chatMessage.update({
        where: { id },
        data: { reactions },
        select: { id: true, reactions: true, updatedAt: true },
    });
    return NextResponse.json(updated);
}
