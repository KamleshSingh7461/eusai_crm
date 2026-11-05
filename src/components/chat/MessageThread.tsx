"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { AlertCircle, ArrowDown, Check, Download, Edit2, FileText, Loader2, MessageSquare, SmilePlus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import { humanize } from '@/components/ui/tones';
import RichText from './RichText';
import { ChatMessage, QUICK_REACTIONS, canStillEdit, dayLabel, isImage, sameDay } from './chatUtils';

interface Props {
    messages: ChatMessage[];
    meId?: string;
    loading: boolean;
    hasMore: boolean;
    loadingOlder: boolean;
    emptyTitle: string;
    onLoadOlder: () => void;
    onReact: (m: ChatMessage, emoji: string) => void;
    onEdit: (m: ChatMessage, content: string) => Promise<boolean>;
    onDelete: (m: ChatMessage) => void;
}

const GROUP_GAP_MS = 5 * 60_000;

export default function MessageThread({ messages, meId, loading, hasMore, loadingOlder, emptyTitle, onLoadOlder, onReact, onEdit, onDelete }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const atBottomRef = useRef(true);
    const prevCountRef = useRef(0);
    const prevFirstIdRef = useRef<string | null>(null);
    const prevHeightRef = useRef(0);
    const [showJump, setShowJump] = useState(false);
    const [pickerFor, setPickerFor] = useState<string | null>(null);
    const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
    const [, forceTick] = useState(0);

    // re-render every 15s so edit/delete buttons disappear once the window closes
    useEffect(() => {
        const t = setInterval(() => forceTick(x => x + 1), 15_000);
        return () => clearInterval(t);
    }, []);

    // Keep position stable: stick to the bottom for new messages, preserve offset when older ones load above.
    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const firstId = messages[0]?.id ?? null;
        const grewAtTop = prevFirstIdRef.current && firstId !== prevFirstIdRef.current && messages.length > prevCountRef.current;
        if (grewAtTop) {
            el.scrollTop = el.scrollHeight - prevHeightRef.current + el.scrollTop;
        } else if (messages.length > prevCountRef.current) {
            const last = messages[messages.length - 1];
            if (atBottomRef.current || prevCountRef.current === 0 || last?.sender.id === meId) {
                el.scrollTop = el.scrollHeight;
            } else {
                setShowJump(true);
            }
        }
        prevCountRef.current = messages.length;
        prevFirstIdRef.current = firstId;
        prevHeightRef.current = el.scrollHeight;
    }, [messages, meId]);

    const onScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        if (atBottomRef.current) setShowJump(false);
        prevHeightRef.current = el.scrollHeight;
    };

    const jumpToLatest = () => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        setShowJump(false);
    };

    const saveEdit = async () => {
        if (!editing) return;
        const msg = messages.find(m => m.id === editing.id);
        if (!msg || !editing.text.trim()) return setEditing(null);
        const ok = await onEdit(msg, editing.text);
        if (ok) setEditing(null);
    };

    if (loading) {
        return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-300" /></div>;
    }

    return (
        <div className="relative min-h-0 flex-1">
            <div ref={scrollRef} onScroll={onScroll} className="h-full overflow-y-auto px-3 py-4 sm:px-6" onClick={() => setPickerFor(null)}>
                {hasMore && (
                    <div className="mb-4 flex justify-center">
                        <button onClick={onLoadOlder} disabled={loadingOlder}
                            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-50">
                            {loadingOlder && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Load earlier messages
                        </button>
                    </div>
                )}

                {messages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/25 to-violet-500/10 ring-1 ring-inset ring-white/10"><MessageSquare className="h-6 w-6 text-blue-200" /></span>
                        <p className="mt-4 font-display text-base font-bold text-white">{emptyTitle}</p>
                        <p className="mt-1 text-sm text-slate-400">Send the first message to start the conversation.</p>
                    </div>
                )}

                {messages.map((m, i) => {
                    const prev = messages[i - 1];
                    const newDay = !prev || !sameDay(prev.createdAt, m.createdAt);
                    const grouped = !newDay && prev && prev.sender.id === m.sender.id && new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_GAP_MS;
                    const mine = m.sender.id === meId;
                    const editable = mine && !m.pending && canStillEdit(m);
                    const reactions = Object.entries(m.reactions || {}).filter(([, ids]) => ids.length);
                    const isEditing = editing?.id === m.id;

                    return (
                        <React.Fragment key={m.id}>
                            {newDay && (
                                <div className="my-5 flex items-center gap-3">
                                    <span className="h-px flex-1 bg-white/[0.06]" />
                                    <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-slate-400">{dayLabel(m.createdAt)}</span>
                                    <span className="h-px flex-1 bg-white/[0.06]" />
                                </div>
                            )}
                            <div className={cn('group relative flex gap-3 rounded-xl px-2 transition hover:bg-white/[0.02]', grouped ? 'mt-0.5 py-0.5' : 'mt-3 py-1', mine && 'flex-row-reverse')}>
                                <div className="w-9 shrink-0">
                                    {!grouped && <Avatar src={m.sender.image} alt={m.sender.name} fallback={initialsOf(m.sender.name)} className="h-9 w-9 text-xs" />}
                                </div>
                                <div className={cn('relative flex min-w-0 max-w-[85%] flex-col sm:max-w-[70%]', mine && 'items-end')}>
                                    {!grouped && (
                                        <div className={cn('mb-1 flex items-baseline gap-2', mine && 'flex-row-reverse')}>
                                            <span className="text-sm font-semibold text-slate-100">{mine ? 'You' : m.sender.name}</span>
                                            {!mine && m.sender.role && <span className="text-[11px] text-slate-500">{humanize(m.sender.role)}</span>}
                                            <span className="text-[11px] text-slate-500" title={format(new Date(m.createdAt), 'd MMM yyyy, h:mm a')}>{format(new Date(m.createdAt), 'h:mm a')}</span>
                                        </div>
                                    )}

                                    {isEditing ? (
                                        <div className="w-full min-w-[240px] rounded-2xl border border-blue-400/40 bg-[#0F131B] p-2">
                                            <textarea autoFocus value={editing.text} onChange={e => setEditing({ id: m.id, text: e.target.value })}
                                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); } if (e.key === 'Escape') setEditing(null); }}
                                                rows={2} className="w-full resize-none bg-transparent px-2 py-1 text-sm text-slate-100 focus:outline-none" />
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => setEditing(null)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/[0.06]"><X className="h-3.5 w-3.5" />Cancel</button>
                                                <button onClick={saveEdit} className="flex items-center gap-1 rounded-lg bg-blue-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-400"><Check className="h-3.5 w-3.5" />Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        (m.content?.trim() || null) && (
                                            <div className={cn('rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed break-words',
                                                mine ? 'rounded-tr-md bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[0_8px_24px_-12px_rgba(59,130,246,0.8)]' : 'rounded-tl-md border border-white/[0.06] bg-white/[0.04] text-slate-100',
                                                grouped && (mine ? 'rounded-tr-2xl' : 'rounded-tl-2xl'),
                                                m.pending && 'opacity-60', m.failed && 'ring-1 ring-rose-400/60')}>
                                                <RichText content={m.content} isMe={mine} />
                                            </div>
                                        )
                                    )}

                                    {!!m.attachments?.length && (
                                        <div className={cn('mt-1.5 flex flex-wrap gap-2', mine && 'justify-end')}>
                                            {m.attachments.map(a => isImage(a) ? (
                                                <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-white/[0.08]">
                                                    <img src={a.url} alt={a.name || 'Image'} className="max-h-64 max-w-[260px] object-cover transition hover:opacity-90" />
                                                </a>
                                            ) : (
                                                <a key={a.url} href={a.url} target="_blank" rel="noreferrer" download
                                                    className="flex max-w-[260px] items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-slate-200 transition hover:bg-white/[0.06]">
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300"><FileText className="h-4 w-4" /></span>
                                                    <span className="min-w-0 flex-1 truncate">{a.name || 'Attachment'}</span>
                                                    <Download className="h-4 w-4 shrink-0 text-slate-500" />
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    {reactions.length > 0 && (
                                        <div className={cn('mt-1.5 flex flex-wrap gap-1', mine && 'justify-end')}>
                                            {reactions.map(([emoji, ids]) => (
                                                <button key={emoji} onClick={() => onReact(m, emoji)}
                                                    className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ring-inset transition',
                                                        meId && ids.includes(meId) ? 'bg-blue-500/20 text-blue-100 ring-blue-400/40' : 'bg-white/[0.04] text-slate-300 ring-white/10 hover:bg-white/[0.08]')}>
                                                    <span>{emoji}</span><span className="tabular-nums">{ids.length}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {m.pending && <span className="mt-1 text-[11px] text-slate-500">Sending…</span>}
                                    {m.failed && <span className="mt-1 flex items-center gap-1 text-[11px] text-rose-300"><AlertCircle className="h-3 w-3" />Not sent</span>}
                                    {/* hover actions */}
                                    {!m.pending && !isEditing && (
                                        <div className={cn('absolute z-10 flex w-max items-center gap-0.5 rounded-xl border border-white/[0.08] bg-[#11141B] p-0.5 opacity-0 shadow-lg transition group-hover:opacity-100 focus-within:opacity-100',
                                            mine ? 'right-0 -top-10 sm:top-0 sm:right-full sm:mr-1' : 'left-0 -top-10 sm:top-0 sm:left-full sm:ml-1', !grouped && 'sm:top-6', pickerFor === m.id && 'opacity-100')}>
                                            <button onClick={e => { e.stopPropagation(); setPickerFor(pickerFor === m.id ? null : m.id); }} title="React" aria-label="Add reaction" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white"><SmilePlus className="h-4 w-4" /></button>
                                            {editable && <button onClick={() => setEditing({ id: m.id, text: m.content })} title="Edit (within 1 minute)" aria-label="Edit message" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white"><Edit2 className="h-4 w-4" /></button>}
                                            {editable && <button onClick={() => onDelete(m)} title="Delete for everyone (within 1 minute)" aria-label="Delete message" className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>}
                                            {pickerFor === m.id && (
                                                <div className="flex items-center gap-0.5 border-l border-white/[0.08] pl-0.5" onClick={e => e.stopPropagation()}>
                                                    {QUICK_REACTIONS.map(e => (
                                                        <button key={e} onClick={() => { onReact(m, e); setPickerFor(null); }} className="rounded-lg px-1.5 py-1 text-base transition hover:scale-110 hover:bg-white/[0.06]" aria-label={`React ${e}`}>{e}</button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            {showJump && (
                <button onClick={jumpToLatest}
                    className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_30px_-8px_rgba(59,130,246,0.9)]">
                    <ArrowDown className="h-3.5 w-3.5" />New messages
                </button>
            )}
        </div>
    );
}
