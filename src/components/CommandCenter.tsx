"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from 'framer-motion';
import {
    Home, Briefcase, Users, FileText, Plus, Search, Target, GraduationCap, Layers, CheckSquare, AlertTriangle,
    Inbox, Video, Table, Building2, User, Loader2, CornerDownLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import { StatusPill } from '@/components/ui/Badge';
import { humanize } from '@/components/ui/tones';

interface SearchResults {
    projects: { id: string; name: string; status: string }[];
    tasks: { id: string; title: string; status: string; assignedTo?: { name: string } | null }[];
    milestones: { id: string; title: string; status: string; category: string }[];
    people: { id: string; name: string; email: string; role: string; image: string | null }[];
    universities: { id: string; name: string; location: string | null; status: string }[];
}

const EMPTY: SearchResults = { projects: [], tasks: [], milestones: [], people: [], universities: [] };

const itemClass = "group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors aria-selected:bg-blue-500/15 aria-selected:text-white";
const groupClass = "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-slate-500";

function IconTile({ icon: Icon, tone }: { icon: React.ElementType; tone: string }) {
    return <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tone)}><Icon className="h-4 w-4" /></span>;
}

export default function CommandCenter() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults>(EMPTY);
    const [searching, setSearching] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();
    const role = (session?.user as any)?.role || "EMPLOYEE";

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(o => !o);
            }
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    useEffect(() => {
        if (!open) { setQuery(''); setResults(EMPTY); }
    }, [open]);

    // Debounced live search
    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) { setResults(EMPTY); setSearching(false); return; }
        setSearching(true);
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
                if (res.ok) setResults(await res.json());
            } catch { }
            setSearching(false);
        }, 220);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [query]);

    const go = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    const isLeader = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(role);
    const pages = useMemo(() => [
        { label: 'Home', href: '/', icon: Home, tone: 'bg-blue-500/15 text-blue-300' },
        { label: 'Inbox', href: '/inbox', icon: Inbox, tone: 'bg-blue-500/15 text-blue-300' },
        { label: 'Meetings', href: '/meetings', icon: Video, tone: 'bg-blue-500/15 text-blue-300' },
        { label: 'Projects', href: '/projects', icon: Briefcase, tone: 'bg-blue-500/15 text-blue-300' },
        { label: 'Milestones', href: '/milestones', icon: Target, tone: 'bg-violet-500/15 text-violet-300' },
        { label: 'Tasks', href: '/tasks', icon: CheckSquare, tone: 'bg-emerald-500/15 text-emerald-300' },
        { label: 'Issues', href: '/issues', icon: AlertTriangle, tone: 'bg-amber-500/15 text-amber-300' },
        { label: 'Reports', href: '/reports', icon: Table, tone: 'bg-cyan-500/15 text-cyan-300' },
        { label: 'Universities', href: '/universities', icon: GraduationCap, tone: 'bg-cyan-500/15 text-cyan-300' },
        { label: 'Departments', href: '/spaces', icon: Building2, tone: 'bg-emerald-500/15 text-emerald-300' },
        ...(isLeader ? [{ label: 'Team', href: '/team', icon: Users, tone: 'bg-violet-500/15 text-violet-300' }] : []),
        ...(['DIRECTOR', 'MANAGEMENT', 'MANAGER'].includes(role) ? [{ label: 'Resources', href: '/resources', icon: Layers, tone: 'bg-amber-500/15 text-amber-300' }] : []),
        { label: 'Profile and settings', href: '/profile', icon: User, tone: 'bg-slate-500/15 text-slate-300' },
    ], [isLeader, role]);

    const actions = useMemo(() => role === 'MANAGEMENT' ? [] : [
        ...(isLeader ? [{ label: 'New task', href: '/tasks?new=1', icon: Plus }] : []),
        ...(['DIRECTOR', 'MANAGER'].includes(role) ? [{ label: 'New project', href: '/projects/new', icon: Plus }] : []),
        ...(isLeader ? [{ label: 'New milestone', href: '/milestones?new=1', icon: Plus }] : []),
        { label: 'Report an issue', href: '/issues?new=1', icon: Plus },
        { label: 'Submit daily report', href: '/reports/submit', icon: FileText },
    ], [role, isLeader]);

    const q = query.trim().toLowerCase();
    const matches = (label: string) => !q || label.toLowerCase().includes(q);
    const visiblePages = pages.filter(p => matches(p.label));
    const visibleActions = actions.filter(a => matches(a.label));
    const remoteCount = Object.values(results).reduce((n, list) => n + list.length, 0);
    const nothing = visiblePages.length + visibleActions.length + remoteCount === 0;

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[150] flex items-start justify-center px-4 pt-[12vh]">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0F131B]/95 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
                    >
                        <Command shouldFilter={false} loop>
                            <div className="flex items-center gap-3 border-b border-white/[0.06] px-5">
                                {searching ? <Loader2 className="h-5 w-5 animate-spin text-blue-300" /> : <Search className="h-5 w-5 text-slate-500" />}
                                <Command.Input
                                    autoFocus
                                    value={query}
                                    onValueChange={setQuery}
                                    placeholder="Search projects, tasks, people, universities…"
                                    className="h-14 w-full bg-transparent text-base text-slate-100 outline-none placeholder:text-slate-500"
                                />
                                <kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-slate-400">Esc</kbd>
                            </div>

                            <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                                {nothing && !searching && (
                                    <div className="py-12 text-center">
                                        <p className="text-sm font-medium text-slate-300">No results for “{query}”</p>
                                        <p className="mt-1 text-xs text-slate-500">Try a project name, a person or a university.</p>
                                    </div>
                                )}

                                {results.projects.length > 0 && (
                                    <Command.Group heading="Projects" className={groupClass}>
                                        {results.projects.map(p => (
                                            <Command.Item key={p.id} value={`project-${p.id}`} onSelect={() => go(`/projects/${p.id}`)} className={itemClass}>
                                                <IconTile icon={Briefcase} tone="bg-blue-500/15 text-blue-300" />
                                                <span className="flex-1 truncate font-medium">{p.name}</span>
                                                <StatusPill status={p.status} />
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}
                                {results.tasks.length > 0 && (
                                    <Command.Group heading="Tasks" className={groupClass}>
                                        {results.tasks.map(t => (
                                            <Command.Item key={t.id} value={`task-${t.id}`} onSelect={() => go('/tasks')} className={itemClass}>
                                                <IconTile icon={CheckSquare} tone="bg-emerald-500/15 text-emerald-300" />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate font-medium">{t.title}</span>
                                                    {t.assignedTo?.name && <span className="block truncate text-xs text-slate-500">{t.assignedTo.name}</span>}
                                                </span>
                                                <StatusPill status={t.status} />
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}
                                {results.milestones.length > 0 && (
                                    <Command.Group heading="Milestones" className={groupClass}>
                                        {results.milestones.map(m => (
                                            <Command.Item key={m.id} value={`milestone-${m.id}`} onSelect={() => go('/milestones')} className={itemClass}>
                                                <IconTile icon={Target} tone="bg-violet-500/15 text-violet-300" />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate font-medium">{m.title}</span>
                                                    <span className="block truncate text-xs text-slate-500">{humanize(m.category)}</span>
                                                </span>
                                                <StatusPill status={m.status} />
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}
                                {results.people.length > 0 && (
                                    <Command.Group heading="People" className={groupClass}>
                                        {results.people.map(u => (
                                            <Command.Item key={u.id} value={`person-${u.id}`} onSelect={() => go(isLeader ? `/team/${u.id}` : '/profile')} className={itemClass}>
                                                <Avatar src={u.image} alt={u.name} fallback={initialsOf(u.name)} className="h-8 w-8 text-[11px]" />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate font-medium">{u.name}</span>
                                                    <span className="block truncate text-xs text-slate-500">{u.email}</span>
                                                </span>
                                                <span className="text-xs text-slate-500">{humanize(u.role)}</span>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}
                                {results.universities.length > 0 && (
                                    <Command.Group heading="Universities" className={groupClass}>
                                        {results.universities.map(u => (
                                            <Command.Item key={u.id} value={`uni-${u.id}`} onSelect={() => go('/universities')} className={itemClass}>
                                                <IconTile icon={GraduationCap} tone="bg-cyan-500/15 text-cyan-300" />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate font-medium">{u.name}</span>
                                                    {u.location && <span className="block truncate text-xs text-slate-500">{u.location}</span>}
                                                </span>
                                                <StatusPill status={u.status} />
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}

                                {visibleActions.length > 0 && (
                                    <Command.Group heading="Actions" className={groupClass}>
                                        {visibleActions.map(a => (
                                            <Command.Item key={a.href} value={`action-${a.href}`} onSelect={() => go(a.href)} className={itemClass}>
                                                <IconTile icon={a.icon} tone="bg-gradient-to-b from-blue-500 to-blue-600 text-white" />
                                                <span className="flex-1 font-medium">{a.label}</span>
                                                <CornerDownLeft className="h-4 w-4 text-slate-600 opacity-0 group-aria-selected:opacity-100" />
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}
                                {visiblePages.length > 0 && (
                                    <Command.Group heading="Go to" className={groupClass}>
                                        {visiblePages.map(p => (
                                            <Command.Item key={p.href} value={`page-${p.href}`} onSelect={() => go(p.href)} className={itemClass}>
                                                <IconTile icon={p.icon} tone={p.tone} />
                                                <span className="flex-1">{p.label}</span>
                                                <CornerDownLeft className="h-4 w-4 text-slate-600 opacity-0 group-aria-selected:opacity-100" />
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}
                            </Command.List>

                            <div className="flex items-center gap-4 border-t border-white/[0.06] bg-white/[0.02] px-5 py-2.5 text-xs text-slate-500">
                                <span className="flex items-center gap-1.5"><kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px]">↑↓</kbd>Navigate</span>
                                <span className="flex items-center gap-1.5"><kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px]">Enter</kbd>Open</span>
                                <span className="ml-auto">Ctrl K anywhere</span>
                            </div>
                        </Command>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
