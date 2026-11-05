"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Building2, Download, FileText, Hash, Info, Loader2, Lock, Megaphone, MessageSquare, ShieldAlert, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import { humanize } from '@/components/ui/tones';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import Composer from './Composer';
import NewConversationModal from './NewConversationModal';
import {
    Attachment, ChatChannel, ChatMessage, ChatUser,
    channelKind, channelName, directPartner, isAnnouncement, isImage, isUnread, markRead, plainText, readMap,
} from './chatUtils';

const ANNOUNCERS = ['DIRECTOR', 'MANAGER', 'ADMIN'];
const GROUP_CREATORS = ['DIRECTOR', 'MANAGER', 'ADMIN'];
const CHANNEL_POLL_MS = 8_000;
const MESSAGE_POLL_MS = 2_500;
const FULL_REFRESH_MS = 20_000;

const isVirtual = (id: string) => id.startsWith('space-') || id.startsWith('sys-');
const stamp = (m: ChatMessage) => (m.updatedAt && m.updatedAt > m.createdAt ? m.updatedAt : m.createdAt);
const byTime = (a: ChatMessage, b: ChatMessage) => a.createdAt.localeCompare(b.createdAt);

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
    const map = new Map(current.map(m => [m.id, m]));
    for (const m of incoming) map.set(m.id, { ...map.get(m.id), ...m });
    return [...map.values()].sort(byTime);
}

function HeaderIcon({ c, meId }: { c: ChatChannel; meId?: string }) {
    const kind = channelKind(c);
    if (kind === 'direct') {
        const p = directPartner(c, meId);
        return <Avatar src={p?.image} alt={p?.name || ''} fallback={initialsOf(p?.name)} className="h-10 w-10 text-xs" />;
    }
    const Icon = kind === 'announcement' ? Megaphone : kind === 'department' ? Building2 : c.type === 'PRIVATE' ? Lock : Hash;
    const tone = kind === 'announcement' ? 'text-amber-300 from-amber-500/25' : kind === 'department' ? 'text-emerald-300 from-emerald-500/25' : 'text-blue-300 from-blue-500/25';
    return <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br to-transparent ring-1 ring-inset ring-white/10', tone)}><Icon className="h-[18px] w-[18px]" /></span>;
}

export default function ChatWorkspace() {
    const { data: session } = useSession();
    const me = session?.user as (ChatUser & { role?: string }) | undefined;
    const meId = me?.id;
    const role = (me?.role || '').toUpperCase();

    const [channels, setChannels] = useState<ChatChannel[]>([]);
    const [loadingChannels, setLoadingChannels] = useState(true);
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [readState, setReadState] = useState<Record<string, string>>({});
    const [mobileThread, setMobileThread] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [error, setError] = useState('');

    const activeRef = useRef<string | null>(null);
    const messagesRef = useRef<ChatMessage[]>([]);
    const lastMessageSeen = useRef<Record<string, string>>({});
    const wantedChannel = useRef<string | null>(null);
    messagesRef.current = messages;
    activeRef.current = activeId;

    const active = channels.find(c => c.id === activeId) || null;

    // ── channels ────────────────────────────────────────────────────────────
    const notify = useCallback((c: ChatChannel) => {
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
        const last = c.lastMessage;
        if (!last) return;
        try {
            const n = new Notification(channelName(c, meId), { body: `${last.senderName ? last.senderName + ': ' : ''}${plainText(last.content || 'Sent an attachment')}`, tag: `chat-${c.id}` });
            n.onclick = () => { window.focus(); setActiveId(c.id); setMobileThread(true); n.close(); };
        } catch { /* some browsers only allow notifications from a service worker */ }
    }, [meId]);

    const fetchChannels = useCallback(async () => {
        try {
            const res = await fetch('/api/chat/channels', { cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json();
            const list: ChatChannel[] = data.channels || [];
            // desktop notifications for new messages from others when they can't see them
            const seen = lastMessageSeen.current;
            const firstRun = Object.keys(seen).length === 0;
            for (const c of list) {
                const last = c.lastMessage;
                if (!last) continue;
                if (!firstRun && seen[c.id] !== last.createdAt && last.senderId !== meId && (document.hidden || c.id !== activeRef.current)) notify(c);
                seen[c.id] = last.createdAt;
            }
            setChannels(list);
            if (!activeRef.current && list.length) {
                const wanted = wantedChannel.current && list.find(c => c.id === wantedChannel.current);
                if (wanted) { setActiveId(wanted.id); setMobileThread(true); }
                else if (window.matchMedia('(min-width: 1024px)').matches) setActiveId(list[0].id);
                wantedChannel.current = null;
            }
        } catch { /* offline: keep what we have */ } finally {
            setLoadingChannels(false);
        }
    }, [meId, notify]);

    useEffect(() => {
        wantedChannel.current = new URLSearchParams(window.location.search).get('channelId');
        setReadState(readMap());
        fetch('/api/users').then(r => r.ok ? r.json() : []).then(d => setUsers(Array.isArray(d) ? d : d.users || [])).catch(() => { });
    }, []);

    useEffect(() => {
        if (!meId) return;
        fetchChannels();
        const t = setInterval(() => { if (!document.hidden || (typeof Notification !== 'undefined' && Notification.permission === 'granted')) fetchChannels(); }, CHANNEL_POLL_MS);
        return () => clearInterval(t);
    }, [meId, fetchChannels]);

    // ── messages ────────────────────────────────────────────────────────────
    const loadLatest = useCallback(async (channelId: string, initial: boolean) => {
        if (initial) { setLoadingMessages(true); setMessages([]); setHasMore(false); setError(''); }
        try {
            const res = await fetch(`/api/chat/messages?channelId=${encodeURIComponent(channelId)}`, { cache: 'no-store' });
            if (activeRef.current !== channelId) return;
            if (res.status === 403) { setError('You don’t have access to this conversation.'); setMessages([]); return; }
            if (!res.ok) return;
            const data = await res.json();
            const page: ChatMessage[] = data.messages || [];
            if (initial) {
                setMessages(page);
                setHasMore(!!data.hasMore);
            } else {
                // reconcile edits/deletes inside the latest page, keep older pages and unsent messages
                setMessages(prev => {
                    const from = page[0]?.createdAt;
                    const older = data.hasMore && from ? prev.filter(m => !m.pending && !m.failed && m.createdAt < from) : [];
                    const local = prev.filter(m => m.pending || m.failed);
                    return [...older, ...page, ...local].sort(byTime);
                });
            }
        } catch { /* ignore */ } finally {
            if (initial && activeRef.current === channelId) setLoadingMessages(false);
        }
    }, []);

    const pollNew = useCallback(async (channelId: string) => {
        const synced = messagesRef.current.filter(m => !m.pending && !m.failed);
        if (!synced.length) return loadLatest(channelId, false);
        const after = synced.reduce((max, m) => (stamp(m) > max ? stamp(m) : max), '');
        try {
            const res = await fetch(`/api/chat/messages?channelId=${encodeURIComponent(channelId)}&after=${encodeURIComponent(after)}`, { cache: 'no-store' });
            if (!res.ok || activeRef.current !== channelId) return;
            const data = await res.json();
            if (data.messages?.length) setMessages(prev => mergeMessages(prev, data.messages));
        } catch { /* ignore */ }
    }, [loadLatest]);

    useEffect(() => {
        if (!activeId) return;
        loadLatest(activeId, true);
        if (isVirtual(activeId)) return;
        let ticks = 0;
        const t = setInterval(() => {
            if (document.hidden) return;
            ticks += 1;
            if ((ticks * MESSAGE_POLL_MS) % FULL_REFRESH_MS < MESSAGE_POLL_MS) loadLatest(activeId, false);
            else pollNew(activeId);
        }, MESSAGE_POLL_MS);
        const onVisible = () => { if (!document.hidden) pollNew(activeId); };
        document.addEventListener('visibilitychange', onVisible);
        return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible); };
    }, [activeId, loadLatest, pollNew]);

    const loadOlder = async () => {
        if (!activeId || !messages.length || loadingOlder) return;
        setLoadingOlder(true);
        try {
            const before = messages.find(m => !m.pending)?.createdAt;
            const res = await fetch(`/api/chat/messages?channelId=${encodeURIComponent(activeId)}&before=${encodeURIComponent(before || '')}`);
            const data = await res.json();
            if (activeRef.current !== activeId) return;
            setMessages(prev => mergeMessages(prev, data.messages || []));
            setHasMore(!!data.hasMore);
        } catch { /* ignore */ } finally { setLoadingOlder(false); }
    };

    // mark the open conversation as read whenever its newest message changes
    useEffect(() => {
        if (!activeId) return;
        const newest = [...messages].reverse().find(m => !m.pending)?.createdAt || active?.lastMessage?.createdAt;
        if (!newest || document.hidden) return;
        markRead(activeId, new Date(newest).toISOString());
        setReadState(readMap());
    }, [activeId, messages, active?.lastMessage?.createdAt]);

    // On phones an open conversation takes the whole screen: the bottom tab bar steps aside.
    useEffect(() => {
        const root = document.documentElement;
        root.toggleAttribute('data-chat-thread', mobileThread && !!activeId);
        return () => root.removeAttribute('data-chat-thread');
    }, [mobileThread, activeId]);

    // unread count in the tab title
    useEffect(() => {
        const unread = channels.filter(c => isUnread(c, meId, readState)).length;
        const base = 'Messages · EUSAI';
        document.title = unread ? `(${unread}) ${base}` : base;
    }, [channels, meId, readState]);

    // ── actions ─────────────────────────────────────────────────────────────
    const select = (c: ChatChannel) => {
        setActiveId(c.id);
        setMobileThread(true);
        setShowDetails(false);
        const url = new URL(window.location.href);
        url.searchParams.set('channelId', c.id);
        window.history.replaceState(null, '', url.toString());
    };

    const send = async (content: string, attachments: Attachment[]) => {
        if (!activeId || !me) return;
        const channelId = activeId;
        const tempId = `temp-${Date.now()}`;
        const optimistic: ChatMessage = {
            id: tempId, content, attachments, reactions: {}, pending: true,
            createdAt: new Date().toISOString(),
            sender: { id: me.id, name: me.name || 'You', image: me.image, role: me.role || '' },
        };
        setMessages(prev => [...prev, optimistic]);
        try {
            const res = await fetch('/api/chat/messages', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelId, content, attachments }),
            });
            const data = await res.json();
            if (!res.ok || !data.id) throw new Error(data.error);
            const saved: ChatMessage = { ...data, sender: data.sender || optimistic.sender };
            if (isVirtual(channelId) && data.channelId && data.channelId !== channelId) {
                // first message in a department/announcement space creates the real channel
                await fetchChannels();
                setActiveId(data.channelId);
                return;
            }
            setMessages(prev => prev.map(m => (m.id === tempId ? saved : m)));
            setChannels(prev => prev.map(c => c.id === channelId
                ? { ...c, lastMessage: { content, createdAt: saved.createdAt, senderId: me.id, senderName: me.name || '', hasAttachments: !!attachments.length } }
                : c));
        } catch (e: any) {
            setMessages(prev => prev.map(m => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
            setError(e?.message || 'Message not sent. Check your connection and try again.');
        }
    };

    const react = async (m: ChatMessage, emoji: string) => {
        if (!meId || m.id.startsWith('temp-')) return;
        const toggle = (r: Record<string, string[]> = {}) => {
            const next = { ...r };
            const ids = new Set(next[emoji] || []);
            if (ids.has(meId)) ids.delete(meId); else ids.add(meId);
            if (ids.size) next[emoji] = [...ids]; else delete next[emoji];
            return next;
        };
        setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, reactions: toggle(x.reactions || {}) } : x)));
        try {
            const res = await fetch(`/api/chat/messages/${m.id}/reactions`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji }),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, reactions: data.reactions, updatedAt: data.updatedAt } : x)));
        } catch {
            setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, reactions: m.reactions } : x)));
        }
    };

    const edit = async (m: ChatMessage, content: string) => {
        const res = await fetch(`/api/chat/messages/${m.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setError(data.error || 'Could not edit the message.'); return false; }
        setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, ...data, sender: data.sender || x.sender } : x)));
        return true;
    };

    const remove = async (m: ChatMessage) => {
        if (m.failed) { setMessages(prev => prev.filter(x => x.id !== m.id)); return; }
        if (!window.confirm('Delete this message for everyone?')) return;
        const res = await fetch(`/api/chat/messages/${m.id}`, { method: 'DELETE' });
        if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Could not delete the message.'); return; }
        setMessages(prev => prev.filter(x => x.id !== m.id));
    };

    const openDirect = async (u: ChatUser) => {
        const existing = channels.find(c => c.type === 'DIRECT' && c.members?.some(x => x.id === u.id) && c.members.length <= 2);
        if (existing) return select(existing);
        const res = await fetch('/api/chat/direct', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipientId: u.id }) });
        const data = await res.json();
        if (data.id) onCreated(data);
    };

    const onCreated = (c: ChatChannel) => {
        setShowNew(false);
        setChannels(prev => (prev.some(x => x.id === c.id) ? prev : [c, ...prev]));
        select(c);
        fetchChannels();
    };

    // ── permissions ─────────────────────────────────────────────────────────
    const readOnlyReason = useMemo(() => {
        if (!active) return '';
        if (role === 'MANAGEMENT') return 'Management has read-only access to conversations.';
        if (isAnnouncement(active) && !ANNOUNCERS.includes(role)) return 'Only directors and managers can post announcements.';
        return '';
    }, [active, role]);

    const members = active?.members || [];
    const mentionUsers = members.length > 2 ? members : users;
    const sharedFiles = useMemo(() => messages.flatMap(m => (m.attachments || []).map(a => ({ ...a, from: m.sender.name, at: m.createdAt }))).reverse(), [messages]);

    const subtitle = active ? (() => {
        const kind = channelKind(active);
        if (kind === 'direct') { const p = directPartner(active, meId); return p ? humanize(p.role) : 'Direct message'; }
        if (kind === 'announcement') return 'Company-wide updates';
        return active.description || (members.length ? `${members.length} member${members.length === 1 ? '' : 's'}` : kind === 'department' ? 'Department channel' : 'Group');
    })() : '';

    // ── render ──────────────────────────────────────────────────────────────
    return (
        <div className="relative flex h-[calc(100dvh-64px-var(--tabbar-h))] overflow-hidden border-white/[0.06] lg:border-t">
            {/* conversations */}
            <aside className={cn('w-full shrink-0 border-r border-white/[0.06] bg-[#0A0D13]/60 lg:block lg:w-[320px] xl:w-[340px]', mobileThread ? 'hidden' : 'block')}>
                {loadingChannels ? (
                    <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-300" /></div>
                ) : (
                    <ConversationList channels={channels} activeId={activeId} meId={meId} readState={readState} onSelect={select} onNew={() => setShowNew(true)} />
                )}
            </aside>

            {/* thread */}
            <section className={cn('relative min-w-0 flex-1 flex-col', mobileThread ? 'flex' : 'hidden lg:flex')}>
                {active ? (
                    <>
                        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] px-3 sm:px-5">
                            <button onClick={() => setMobileThread(false)} className="-ml-1 rounded-lg p-2 text-slate-300 hover:bg-white/[0.06] lg:hidden" aria-label="Back to conversations"><ArrowLeft className="h-5 w-5" /></button>
                            <HeaderIcon c={active} meId={meId} />
                            <div className="min-w-0 flex-1">
                                <h1 className="truncate font-display text-base font-bold text-white">{channelName(active, meId)}</h1>
                                <p className="truncate text-xs text-slate-500">{subtitle}</p>
                            </div>
                            <button onClick={() => setShowDetails(v => !v)} aria-label="Conversation details" aria-pressed={showDetails}
                                className={cn('rounded-lg p-2 transition hover:bg-white/[0.06]', showDetails ? 'text-blue-300' : 'text-slate-400 hover:text-white')}><Info className="h-5 w-5" /></button>
                        </header>

                        {error && (
                            <div className="mx-3 mt-3 flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 sm:mx-5">
                                <ShieldAlert className="h-4 w-4 shrink-0" /><span className="flex-1">{error}</span>
                                <button onClick={() => setError('')} aria-label="Dismiss" className="rounded p-0.5 hover:bg-white/10"><X className="h-4 w-4" /></button>
                            </div>
                        )}

                        <MessageThread
                            messages={messages}
                            meId={meId}
                            loading={loadingMessages}
                            hasMore={hasMore}
                            loadingOlder={loadingOlder}
                            emptyTitle={channelKind(active) === 'direct' ? `Say hello to ${channelName(active, meId).split(' ')[0]}` : `Welcome to ${channelName(active, meId)}`}
                            onLoadOlder={loadOlder}
                            onReact={react}
                            onEdit={edit}
                            onDelete={remove}
                        />

                        {readOnlyReason ? (
                            <div className="m-3 flex items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-slate-400 sm:m-5">
                                <Lock className="h-4 w-4" />{readOnlyReason}
                            </div>
                        ) : (
                            <Composer
                                key={active.id}
                                users={mentionUsers}
                                placeholder={`Message ${channelKind(active) === 'direct' ? channelName(active, meId) : '#' + channelName(active, meId)}`}
                                onSend={send}
                            />
                        )}
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/25 to-violet-500/10 ring-1 ring-inset ring-white/10"><MessageSquare className="h-7 w-7 text-blue-200" /></span>
                        <h2 className="mt-4 font-display text-lg font-bold text-white">Your messages</h2>
                        <p className="mt-1 max-w-sm text-sm text-slate-400">Pick a conversation on the left, or start a new one with a teammate.</p>
                        <button onClick={() => setShowNew(true)} className="mt-5 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white">New conversation</button>
                    </div>
                )}
            </section>

            {/* details */}
            {active && showDetails && (
                <aside className="absolute inset-0 z-30 flex flex-col bg-[#0A0D13] lg:static lg:inset-auto lg:z-auto lg:w-[300px] lg:shrink-0 lg:border-l lg:border-white/[0.06]">
                    <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
                        <h2 className="font-display text-sm font-bold text-white">Details</h2>
                        <button onClick={() => setShowDetails(false)} aria-label="Close details" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
                        <div className="flex flex-col items-center text-center">
                            <HeaderIcon c={active} meId={meId} />
                            <p className="mt-3 font-display text-base font-bold text-white">{channelName(active, meId)}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
                        </div>

                        {members.length > 0 && (
                            <div>
                                <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"><Users className="h-3.5 w-3.5" />Members · {members.length}</p>
                                <ul className="space-y-1">
                                    {members.map(u => (
                                        <li key={u.id} className="flex items-center gap-3 rounded-xl px-1.5 py-1.5">
                                            <Avatar src={u.image} alt={u.name} fallback={initialsOf(u.name)} className="h-8 w-8 text-[10px]" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm text-slate-200">{u.id === meId ? `${u.name} (you)` : u.name}</span>
                                                <span className="block truncate text-[11px] text-slate-500">{humanize(u.role)}</span>
                                            </span>
                                            {u.id !== meId && channelKind(active) !== 'direct' && (
                                                <button onClick={() => openDirect(u)} className="rounded-lg px-2 py-1 text-xs font-medium text-blue-300 hover:bg-blue-500/10">Message</button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div>
                            <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"><FileText className="h-3.5 w-3.5" />Shared files · {sharedFiles.length}</p>
                            {sharedFiles.length === 0 ? (
                                <p className="text-xs text-slate-500">Files and images shared here will show up in this list.</p>
                            ) : (
                                <ul className="space-y-1.5">
                                    {sharedFiles.slice(0, 30).map((f, i) => (
                                        <li key={f.url + i}>
                                            <a href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-1.5 py-1.5 transition hover:bg-white/[0.04]">
                                                {isImage(f)
                                                    ? <img src={f.url} alt="" className="h-9 w-9 rounded-lg object-cover" />
                                                    : <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300"><FileText className="h-4 w-4" /></span>}
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm text-slate-200">{f.name || 'Attachment'}</span>
                                                    <span className="block truncate text-[11px] text-slate-500">{f.from}</span>
                                                </span>
                                                <Download className="h-4 w-4 text-slate-500" />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </aside>
            )}

            <NewConversationModal
                open={showNew}
                onClose={() => setShowNew(false)}
                users={users}
                meId={meId}
                canCreateGroup={GROUP_CREATORS.includes(role)}
                onCreated={onCreated}
            />
        </div>
    );
}
