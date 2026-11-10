"use client";

import React, { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Paperclip, Send, Smile, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import { humanize } from '@/components/ui/tones';
import { Attachment, ChatUser, EMOJI_PALETTE, isImage } from './chatUtils';

interface Props {
    placeholder: string;
    users: ChatUser[];
    disabled?: boolean;
    onSend: (content: string, attachments: Attachment[]) => Promise<void> | void;
}

const MAX_HEIGHT = 180;

export default function Composer({ placeholder, users, disabled, onSend }: Props) {
    const [text, setText] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
    const [mentionIndex, setMentionIndex] = useState(0);
    const textRef = useRef<HTMLTextAreaElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // grow with content up to MAX_HEIGHT
    useEffect(() => {
        const el = textRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    }, [text]);

    const candidates = mention
        ? users.filter(u => u.name?.toLowerCase().includes(mention.query.toLowerCase())).slice(0, 6)
        : [];

    const updateMention = (value: string, caret: number) => {
        const before = value.slice(0, caret);
        const match = before.match(/(^|\s)@([^\s@]*)$/);
        if (match) {
            setMention({ query: match[2], start: caret - match[2].length - 1 });
            setMentionIndex(0);
        } else {
            setMention(null);
        }
    };

    const insertMention = (u: ChatUser) => {
        if (!mention) return;
        const caret = textRef.current?.selectionStart ?? text.length;
        const token = `@[${u.name}](user:${u.id}) `;
        const next = text.slice(0, mention.start) + token + text.slice(caret);
        setText(next);
        setMention(null);
        requestAnimationFrame(() => {
            const pos = mention.start + token.length;
            textRef.current?.focus();
            textRef.current?.setSelectionRange(pos, pos);
        });
    };

    const insertText = (value: string) => {
        const el = textRef.current;
        const start = el?.selectionStart ?? text.length;
        const end = el?.selectionEnd ?? text.length;
        setText(text.slice(0, start) + value + text.slice(end));
        requestAnimationFrame(() => {
            el?.focus();
            el?.setSelectionRange(start + value.length, start + value.length);
        });
    };

    const send = async () => {
        if (disabled || uploading) return;
        if (!text.trim() && attachments.length === 0) return;
        const content = text;
        const files = attachments;
        setText('');
        setAttachments([]);
        setMention(null);
        setShowEmoji(false);
        await onSend(content, files);
        textRef.current?.focus();
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (mention && candidates.length) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => (i + 1) % candidates.length); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex(i => (i - 1 + candidates.length) % candidates.length); return; }
            if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(candidates[mentionIndex]); return; }
            if (e.key === 'Escape') { setMention(null); return; }
        }
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
        }
    };

    const upload = async (file: File) => {
        if (file.size > 10 * 1024 * 1024) { setUploadError('Files must be 10 MB or smaller.'); return; }
        setUploading(true);
        setUploadError('');
        try {
            const form = new FormData();
            form.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: form });
            const data = await res.json();
            if (!res.ok || !data.url) throw new Error();
            setAttachments(prev => [...prev, { url: data.url, name: data.name || file.name, type: data.type }]);
        } catch {
            setUploadError('Upload failed. Try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative px-3 pb-3 sm:px-5 sm:pb-5">
            {mention && candidates.length > 0 && (
                <div className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#18181B] p-1.5 shadow-xl shadow-black/40 sm:left-5 sm:right-auto sm:w-80">
                    <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold text-zinc-500">Mention someone</p>
                    {candidates.map((u, i) => (
                        <button key={u.id} onMouseDown={e => { e.preventDefault(); insertMention(u); }}
                            className={cn('flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm', i === mentionIndex ? 'bg-blue-500/15 text-white' : 'text-zinc-300 hover:bg-white/[0.05]')}>
                            <Avatar src={u.image} alt={u.name} fallback={initialsOf(u.name)} className="h-7 w-7 text-xs" />
                            <span className="flex-1 truncate">{u.name}</span>
                            <span className="text-xs text-zinc-500">{humanize(u.role)}</span>
                        </button>
                    ))}
                </div>
            )}

            {showEmoji && (
                <div className="absolute bottom-full left-3 mb-2 grid w-72 grid-cols-8 gap-1 rounded-2xl border border-white/[0.08] bg-[#18181B] p-2 shadow-xl shadow-black/40 sm:left-5">
                    {EMOJI_PALETTE.map(e => (
                        <button key={e} onClick={() => insertText(e)} className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:bg-white/[0.08]" aria-label={`Insert ${e}`}>{e}</button>
                    ))}
                </div>
            )}

            <div className={cn('rounded-2xl border border-white/[0.08] bg-[#111113]  transition focus-within:border-blue-400/40 focus-within:ring-4 focus-within:ring-blue-500/10', disabled && 'opacity-60')}>
                {(attachments.length > 0 || uploading) && (
                    <div className="flex flex-wrap gap-2 border-b border-white/[0.06] p-3">
                        {attachments.map((a, i) => (
                            <div key={a.url} className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] pr-8">
                                {isImage(a)
                                    ? <img src={a.url} alt={a.name || ''} className="h-14 w-14 object-cover" />
                                    : <span className="flex h-14 w-12 items-center justify-center text-zinc-400"><FileText className="h-5 w-5" /></span>}
                                <span className="max-w-[140px] truncate text-xs text-zinc-300">{a.name || 'Attachment'}</span>
                                <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} aria-label="Remove attachment"
                                    className="absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1 text-zinc-300 hover:text-white"><X className="h-3 w-3" /></button>
                            </div>
                        ))}
                        {uploading && <span className="flex h-14 items-center gap-2 px-3 text-xs text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" />Uploading…</span>}
                    </div>
                )}
                <textarea
                    ref={textRef}
                    value={text}
                    rows={1}
                    disabled={disabled}
                    placeholder={placeholder}
                    onChange={e => { setText(e.target.value); updateMention(e.target.value, e.target.selectionStart); }}
                    onKeyDown={onKeyDown}
                    onPaste={e => { const f = e.clipboardData.files?.[0]; if (f) { e.preventDefault(); upload(f); } }}
                    className="block max-h-[180px] w-full resize-none bg-transparent px-4 pt-3.5 text-[15px] leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:cursor-not-allowed"
                />
                <div className="flex items-center gap-1 px-2 pb-2 pt-1">
                    <input ref={fileRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
                    <button onClick={() => fileRef.current?.click()} disabled={disabled || uploading} title="Attach a file" aria-label="Attach a file"
                        className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"><Paperclip className="h-[18px] w-[18px]" /></button>
                    <button onClick={() => setShowEmoji(v => !v)} disabled={disabled} title="Emoji" aria-label="Emoji" aria-expanded={showEmoji}
                        className={cn('rounded-lg p-2 transition hover:bg-white/[0.06] disabled:opacity-40', showEmoji ? 'text-blue-300' : 'text-zinc-400 hover:text-white')}><Smile className="h-[18px] w-[18px]" /></button>
                    <span className="ml-1 hidden text-[11px] text-zinc-600 sm:inline">Enter to send · Shift+Enter for a new line · @ to mention</span>
                    <button onClick={send} disabled={disabled || uploading || (!text.trim() && !attachments.length)} aria-label="Send message"
                        className="ml-auto flex h-9 items-center gap-2 rounded-xl bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">
                        <Send className="h-4 w-4" /><span className="hidden sm:inline">Send</span>
                    </button>
                </div>
            </div>
            {uploadError && <p className="mt-1.5 px-1 text-xs text-rose-300">{uploadError}</p>}
        </div>
    );
}
