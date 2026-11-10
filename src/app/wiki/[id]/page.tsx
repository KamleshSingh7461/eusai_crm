"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ArrowLeft, BookOpen, Check, Edit3, FileText, Loader2, Save, Trash2, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { fieldClass } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

interface WikiPage {
    id: string;
    title: string;
    content: string;
    authorId: string;
    updatedAt: string;
    createdAt: string;
    project?: { id: string; name: string } | null;
    space?: { id: string; name: string; color: string } | null;
    author?: { id: string; name: string; image: string | null } | null;
}

const LEADERS = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'];

export default function WikiPageView() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [page, setPage] = useState<WikiPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({ title: '', content: '' });
    const [saving, setSaving] = useState(false);

    const me = session?.user as any;
    const canEdit = !!page && !!me && me.role !== 'MANAGEMENT' && (page.authorId === me.id || LEADERS.includes(me.role));

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/wiki?id=${id}`);
            if (res.ok) {
                const data = await res.json();
                setPage(data);
                setDraft({ title: data.title, content: data.content });
                // brand-new pages open straight into edit mode
                if (!data.content) setEditing(true);
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const save = async () => {
        if (!draft.title.trim()) return showToast('Give the page a title', 'error');
        setSaving(true);
        try {
            const res = await fetch('/api/wiki', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...draft }) });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error);
            showToast('Page saved', 'success');
            setEditing(false);
            load();
        } catch (e: any) {
            showToast(e.message || 'Could not save the page', 'error');
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!page || !confirm(`Delete “${page.title}”? This can't be undone.`)) return;
        const res = await fetch('/api/wiki', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        if (res.ok) {
            showToast('Page deleted', 'success');
            router.push(page.space ? `/spaces/${page.space.id}` : page.project ? `/projects/${page.project.id}` : '/library');
        } else {
            showToast('Could not delete the page', 'error');
        }
    };

    if (loading) return <div className="mx-auto max-w-3xl space-y-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-96" /></div>;
    if (!page) {
        return (
            <Card className="mx-auto max-w-lg">
                <EmptyState icon={FileText} title="Page not found" description="It may have been deleted." action={<Button variant="secondary" onClick={() => router.push('/library')}>Go to library</Button>} />
            </Card>
        );
    }

    const backHref = page.space ? `/spaces/${page.space.id}` : page.project ? `/projects/${page.project.id}` : '/library';
    const backLabel = page.space?.name || page.project?.name || 'Library';

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href={backHref} className="flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
                    <ArrowLeft className="h-4 w-4" />{backLabel}
                </Link>
                {canEdit && (
                    <div className="flex gap-2">
                        {editing ? (
                            <>
                                <Button variant="ghost" leftIcon={<X className="h-4 w-4" />} onClick={() => { setEditing(false); setDraft({ title: page.title, content: page.content }); }}>Cancel</Button>
                                <Button isLoading={saving} leftIcon={<Save className="h-4 w-4" />} onClick={save}>Save</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" leftIcon={<Trash2 className="h-4 w-4" />} onClick={remove} className="hover:text-rose-300">Delete</Button>
                                <Button variant="secondary" leftIcon={<Edit3 className="h-4 w-4" />} onClick={() => setEditing(true)}>Edit</Button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <Card padding="lg" className="sm:p-10">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/25 text-violet-300 ring-1 ring-inset ring-violet-400/25"><BookOpen className="h-5 w-5" /></span>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                        <Avatar alt={page.author?.name || ''} src={page.author?.image} fallback={initialsOf(page.author?.name)} className="h-6 w-6 text-xs" />
                        <span>{page.author?.name || 'Unknown author'}</span>
                        <span>·</span>
                        <span>Updated {format(new Date(page.updatedAt), 'd MMM yyyy, h:mm a')}</span>
                    </div>
                </div>

                {editing ? (
                    <div className="mt-6 space-y-4">
                        <input
                            value={draft.title}
                            onChange={e => setDraft({ ...draft, title: e.target.value })}
                            placeholder="Page title"
                            autoFocus
                            className="w-full bg-transparent font-display text-3xl font-semibold tracking-tight text-white outline-none placeholder:text-zinc-300"
                        />
                        <textarea
                            value={draft.content}
                            onChange={e => setDraft({ ...draft, content: e.target.value })}
                            placeholder="Write the process, contacts, decisions or anything the team should know."
                            className={cn(fieldClass, 'h-auto min-h-[420px] resize-y py-3 leading-relaxed')}
                        />
                        <p className="flex items-center gap-1.5 text-xs text-zinc-500"><Check className="h-3.5 w-3.5" />Line breaks are kept as you type them.</p>
                    </div>
                ) : (
                    <>
                        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-white">{page.title}</h1>
                        {page.content
                            ? <div className="mt-6 whitespace-pre-wrap text-[15px] leading-7 text-zinc-300">{page.content}</div>
                            : <p className="mt-6 text-zinc-500">This page is empty.</p>}
                    </>
                )}
            </Card>
            {saving && <Loader2 className="mx-auto h-5 w-5 animate-spin text-blue-300" />}
        </div>
    );
}
