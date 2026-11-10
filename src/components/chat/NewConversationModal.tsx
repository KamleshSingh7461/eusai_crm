"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Lock, MessageSquare, Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import { humanize } from '@/components/ui/tones';
import { ChatChannel, ChatUser } from './chatUtils';

interface Props {
    open: boolean;
    onClose: () => void;
    users: ChatUser[];
    meId?: string;
    canCreateGroup: boolean;
    onCreated: (c: ChatChannel) => void;
}

export default function NewConversationModal({ open, onClose, users, meId, canCreateGroup, onCreated }: Props) {
    const [mode, setMode] = useState<'direct' | 'group'>('direct');
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) { setMode('direct'); setQuery(''); setSelected([]); setGroupName(''); setError(''); }
    }, [open]);

    const people = useMemo(() => {
        const q = query.trim().toLowerCase();
        return users
            .filter(u => u.id !== meId)
            .filter(u => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q))
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [users, query, meId]);

    const startDirect = async (u: ChatUser) => {
        setBusy(true); setError('');
        try {
            const res = await fetch('/api/chat/direct', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientId: u.id }),
            });
            const data = await res.json();
            if (!res.ok || !data.id) throw new Error(data.error);
            onCreated(data);
        } catch (e: any) {
            setError(e?.message || 'Could not open the conversation.');
        } finally { setBusy(false); }
    };

    const createGroup = async () => {
        if (!groupName.trim() || selected.length === 0) return;
        setBusy(true); setError('');
        try {
            const res = await fetch('/api/chat/channels', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: groupName.trim(), type: 'PRIVATE', memberIds: selected }),
            });
            const data = await res.json();
            if (!res.ok || !data.id) throw new Error(data.error);
            onCreated(data);
        } catch (e: any) {
            setError(e?.message || 'Could not create the group.');
        } finally { setBusy(false); }
    };

    const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="New conversation"
            description={mode === 'direct' ? 'Pick a person to message directly.' : 'Create a private group. Only the people you add can see it.'}
            icon={<MessageSquare className="h-5 w-5" />}
            footer={mode === 'group' ? (
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={createGroup} isLoading={busy} disabled={!groupName.trim() || !selected.length}>
                        Create group{selected.length ? ` (${selected.length + 1})` : ''}
                    </Button>
                </>
            ) : undefined}
        >
            {canCreateGroup && (
                <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
                    {([['direct', 'Direct message', MessageSquare], ['group', 'Private group', Lock]] as const).map(([key, label, Icon]) => (
                        <button key={key} onClick={() => setMode(key)}
                            className={cn('flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition',
                                mode === key ? 'bg-blue-500/15 text-white ring-1 ring-inset ring-blue-400/25' : 'text-zinc-400 hover:text-white')}>
                            <Icon className="h-4 w-4" />{label}
                        </button>
                    ))}
                </div>
            )}

            {mode === 'group' && (
                <div className="mb-3">
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Group name</label>
                    <input value={groupName} onChange={e => setGroupName(e.target.value)} maxLength={60} placeholder="e.g. Admissions sprint"
                        className="h-10 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-400/50 focus:outline-none focus:ring-4 focus:ring-blue-500/15" />
                </div>
            )}

            <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search people by name, email or role"
                    className="h-10 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-400/50 focus:outline-none focus:ring-4 focus:ring-blue-500/15" />
            </div>

            <ul className="-mx-1 max-h-[45vh] space-y-0.5 overflow-y-auto">
                {people.length === 0 && (
                    <li className="py-8 text-center text-sm text-zinc-400"><Users className="mx-auto mb-2 h-6 w-6 text-zinc-600" />No one matches “{query}”</li>
                )}
                {people.map(u => {
                    const picked = selected.includes(u.id);
                    return (
                        <li key={u.id}>
                            <button disabled={busy && mode === 'direct'} onClick={() => mode === 'direct' ? startDirect(u) : toggle(u.id)}
                                className={cn('flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition disabled:opacity-50', picked ? 'bg-blue-500/10' : 'hover:bg-white/[0.04]')}>
                                <Avatar src={u.image} alt={u.name} fallback={initialsOf(u.name)} className="h-9 w-9 text-xs" />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-zinc-100">{u.name}</span>
                                    <span className="block truncate text-xs text-zinc-500">{humanize(u.role)}{u.email ? ` · ${u.email}` : ''}</span>
                                </span>
                                {mode === 'group' && (
                                    <span className={cn('flex h-5 w-5 items-center justify-center rounded-md border transition', picked ? 'border-blue-400 bg-blue-500 text-white' : 'border-white/15')}>
                                        {picked && <Check className="h-3.5 w-3.5" />}
                                    </span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>
            {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        </Modal>
    );
}
