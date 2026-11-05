import { format, isToday, isYesterday, isSameDay } from 'date-fns';

export interface ChatUser { id: string; name: string; email?: string; image?: string | null; role: string }
export interface Attachment { url: string; name?: string; type?: string }
export interface ChatMessage {
    id: string;
    sender: ChatUser;
    content: string;
    attachments?: Attachment[] | null;
    reactions?: Record<string, string[]> | null;
    createdAt: string;
    updatedAt?: string;
    pending?: boolean;
    failed?: boolean;
}
export interface ChatChannel {
    id: string;
    name: string | null;
    description: string | null;
    type: 'PUBLIC' | 'PRIVATE' | 'DIRECT';
    isSpaceChannel?: boolean;
    isSystem?: boolean;
    spaceId?: string | null;
    members?: ChatUser[];
    updatedAt?: string;
    lastMessage?: { content: string; createdAt: string; senderId?: string; senderName?: string; hasAttachments?: boolean } | null;
}

export type ChannelKind = 'announcement' | 'department' | 'group' | 'direct';

export const isAnnouncement = (c: ChatChannel) => c.id === 'sys-announcements' || /announcement|broadcast/i.test(c.name || '');

export function channelKind(c: ChatChannel): ChannelKind {
    if (c.type === 'DIRECT') return 'direct';
    if (isAnnouncement(c)) return 'announcement';
    if (c.spaceId || c.isSpaceChannel) return 'department';
    return 'group';
}

export function channelName(c: ChatChannel, meId?: string) {
    if (c.type === 'DIRECT') return c.members?.find(m => m.id !== meId)?.name || 'Direct message';
    return (c.name || 'Untitled').replace(/^[\p{Extended_Pictographic}\s]+/u, '').trim() || 'Untitled';
}

export const directPartner = (c: ChatChannel, meId?: string) => c.members?.find(m => m.id !== meId);

/** Mentions are stored as @[Name](user:id); show them as @Name in previews. */
export const plainText = (content: string) => content.replace(/@\[([^\]]+)\]\(user:[^)]+\)/g, '@$1');

export function previewOf(c: ChatChannel, meId?: string) {
    const m = c.lastMessage;
    if (!m) return c.description || 'No messages yet';
    const text = plainText(m.content || '').trim() || (m.hasAttachments ? 'Sent an attachment' : '');
    const who = m.senderId === meId ? 'You' : c.type === 'DIRECT' ? '' : (m.senderName || '').split(' ')[0];
    return who ? `${who}: ${text}` : text;
}

export function shortTime(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isToday(d)) return format(d, 'h:mm a');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'd MMM');
}

export function dayLabel(iso: string) {
    const d = new Date(iso);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'EEEE, d MMMM yyyy');
}

export const sameDay = (a: string, b: string) => isSameDay(new Date(a), new Date(b));

export const isImage = (a: Attachment) => a.type === 'IMAGE' || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(a.url || '');

export const EDIT_WINDOW_MS = 60_000; // matches the API's 1-minute edit/delete window
export const canStillEdit = (m: ChatMessage) => Date.now() - new Date(m.createdAt).getTime() < EDIT_WINDOW_MS;

export const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '👀', '🙏'];
export const EMOJI_PALETTE = ['😀', '😂', '😊', '😍', '🤔', '😅', '🙌', '👏', '👍', '👎', '🙏', '💪', '🔥', '✅', '❌', '🎉', '🚀', '📌', '📎', '⏰', '💯', '❤️', '👀', '☕'];

// Last-read times per channel live in this browser; enough for unread badges on the web.
const READ_KEY = 'eusai-chat-read';
export function readMap(): Record<string, string> {
    try { return JSON.parse(localStorage.getItem(READ_KEY) || '{}'); } catch { return {}; }
}
export function markRead(channelId: string, iso: string) {
    try {
        const map = readMap();
        if (!map[channelId] || map[channelId] < iso) {
            map[channelId] = iso;
            localStorage.setItem(READ_KEY, JSON.stringify(map));
        }
    } catch { }
}
export function isUnread(c: ChatChannel, meId: string | undefined, map: Record<string, string>) {
    const last = c.lastMessage;
    if (!last || last.senderId === meId) return false;
    const read = map[c.id];
    return !read || new Date(last.createdAt).toISOString() > read;
}
