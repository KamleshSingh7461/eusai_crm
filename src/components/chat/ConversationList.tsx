"use client";

import React, { useMemo, useState } from 'react';
import { Building2, Hash, Lock, Megaphone, PenSquare, Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import { ChannelKind, ChatChannel, channelKind, channelName, directPartner, isUnread, previewOf, shortTime } from './chatUtils';

const SECTIONS: { kind: ChannelKind; title: string }[] = [
    { kind: 'announcement', title: 'Announcements' },
    { kind: 'department', title: 'Departments' },
    { kind: 'group', title: 'Groups' },
    { kind: 'direct', title: 'Direct messages' },
];

function ChannelIcon({ c, meId, active }: { c: ChatChannel; meId?: string; active: boolean }) {
    const kind = channelKind(c);
    if (kind === 'direct') {
        const p = directPartner(c, meId);
        return <Avatar src={p?.image} alt={p?.name || ''} fallback={initialsOf(p?.name)} className="h-10 w-10 text-xs" />;
    }
    const Icon = kind === 'announcement' ? Megaphone : kind === 'department' ? Building2 : c.type === 'PRIVATE' ? Lock : Hash;
    const tone = kind === 'announcement' ? 'from-amber-500/25 to-amber-500/5 text-amber-300 ring-amber-400/25'
        : kind === 'department' ? 'from-emerald-500/25 to-emerald-500/5 text-emerald-300 ring-emerald-400/25'
            : 'from-blue-500/25 to-blue-500/5 text-blue-300 ring-blue-400/25';
    return (
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset', tone, active && 'ring-2')}>
            <Icon className="h-[18px] w-[18px]" />
        </span>
    );
}

interface Props {
    channels: ChatChannel[];
    activeId: string | null;
    meId?: string;
    readState: Record<string, string>;
    onSelect: (c: ChatChannel) => void;
    onNew: () => void;
}

export default function ConversationList({ channels, activeId, meId, readState, onSelect, onNew }: Props) {
    const [query, setQuery] = useState('');

    const grouped = useMemo(() => {
        const q = query.trim().toLowerCase();
        const visible = channels.filter(c => !q || channelName(c, meId).toLowerCase().includes(q));
        const byRecent = (a: ChatChannel, b: ChatChannel) =>
            new Date(b.lastMessage?.createdAt || b.updatedAt || 0).getTime() - new Date(a.lastMessage?.createdAt || a.updatedAt || 0).getTime();
        return SECTIONS.map(s => ({ ...s, items: visible.filter(c => channelKind(c) === s.kind).sort(byRecent) })).filter(s => s.items.length);
    }, [channels, query, meId]);

    const unreadTotal = channels.filter(c => isUnread(c, meId, readState)).length;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
                <div>
                    <h2 className="font-display text-xl font-bold text-white">Messages</h2>
                    <p className="text-xs text-slate-500">{unreadTotal ? `${unreadTotal} unread conversation${unreadTotal === 1 ? '' : 's'}` : 'You’re all caught up'}</p>
                </div>
                <button onClick={onNew} title="New conversation" aria-label="New conversation"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[0_8px_24px_-8px_rgba(59,130,246,0.8)] transition hover:from-blue-400 hover:to-blue-500">
                    <PenSquare className="h-[18px] w-[18px]" />
                </button>
            </div>

            <div className="px-4 pb-3">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search conversations"
                        className="h-10 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400/50 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                    />
                </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 pb-4">
                {grouped.length === 0 && (
                    <div className="px-4 py-10 text-center">
                        <Users className="mx-auto h-8 w-8 text-slate-600" />
                        <p className="mt-3 text-sm text-slate-400">{query ? 'No conversations match' : 'No conversations yet'}</p>
                    </div>
                )}
                {grouped.map(section => (
                    <div key={section.kind}>
                        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{section.title}</p>
                        <ul className="space-y-0.5">
                            {section.items.map(c => {
                                const active = c.id === activeId;
                                const unread = isUnread(c, meId, readState);
                                return (
                                    <li key={c.id}>
                                        <button
                                            onClick={() => onSelect(c)}
                                            className={cn('flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition',
                                                active ? 'bg-gradient-to-r from-blue-500/15 to-blue-500/[0.03] ring-1 ring-inset ring-blue-400/20' : 'hover:bg-white/[0.04]')}
                                        >
                                            <ChannelIcon c={c} meId={meId} active={active} />
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-center justify-between gap-2">
                                                    <span className={cn('truncate text-sm', unread ? 'font-semibold text-white' : 'font-medium text-slate-200')}>{channelName(c, meId)}</span>
                                                    <span className={cn('shrink-0 text-[11px]', unread ? 'text-blue-300' : 'text-slate-500')}>{shortTime(c.lastMessage?.createdAt)}</span>
                                                </span>
                                                <span className="mt-0.5 flex items-center gap-2">
                                                    <span className={cn('truncate text-xs', unread ? 'text-slate-300' : 'text-slate-500')}>{previewOf(c, meId)}</span>
                                                    {unread && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)]" />}
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
