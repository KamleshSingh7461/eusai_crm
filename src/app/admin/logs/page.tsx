"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, History, Search } from 'lucide-react';
import { downloadCsv, todayStamp } from '@/lib/csv';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { timeAgo } from '@/components/dashboard/widgets';
import { humanize } from '@/components/ui/tones';

interface ActivityRow {
    id: string;
    action: string;
    metadata: string | null;
    timestamp: string;
    user: { name: string | null; email: string } | null;
    project: { id: string; name: string } | null;
}

/** Short readable summary of an activity's JSON metadata. */
const describe = (metadata: string | null) => {
    if (!metadata) return '';
    try {
        const m = JSON.parse(metadata);
        return Object.entries(m).filter(([, v]) => v !== null && v !== '' && typeof v !== 'object').slice(0, 3).map(([k, v]) => `${humanize(k)}: ${v}`).join(' · ');
    } catch {
        return metadata.slice(0, 80);
    }
};

export default function SystemLogsPage() {
    const [rows, setRows] = useState<ActivityRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        fetch('/api/admin/system?view=logs')
            .then(res => (res.ok ? res.json() : { activities: [] }))
            .then(data => setRows(data.activities || []))
            .finally(() => setLoading(false));
    }, []);

    const q = query.trim().toLowerCase();
    const filtered = useMemo(() => rows.filter(r => !q
        || r.action.toLowerCase().includes(q) || r.user?.name?.toLowerCase().includes(q) || r.project?.name.toLowerCase().includes(q)), [rows, q]);

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="System admin"
                title="System logs"
                description="The latest 100 recorded actions across all projects."
                actions={<Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} disabled={filtered.length === 0}
                    onClick={() => downloadCsv(`system-log-${todayStamp()}`, filtered.map(r => ({ Time: new Date(r.timestamp).toLocaleString('en-IN'), Action: humanize(r.action), User: r.user?.name || r.user?.email || '', Project: r.project?.name || '', Details: describe(r.metadata) })))}>Export</Button>}
            />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by action, person or project" leftIcon={<Search />} containerClassName="max-w-md" />
            <Card padding="none" className="overflow-hidden">
                {loading ? <div className="space-y-2 p-4">{[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12" />)}</div>
                    : filtered.length === 0 ? <EmptyState icon={History} title={rows.length ? 'Nothing matches' : 'No activity recorded yet'} description={rows.length ? 'Try a different search.' : 'Actions like expenses and knowledge pages are logged here.'} />
                        : (
                            <ul className="divide-y divide-white/[0.05]">
                                {filtered.map(r => (
                                    <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02]">
                                        <Avatar alt={r.user?.name || ''} fallback={initialsOf(r.user?.name || r.user?.email)} className="h-9 w-9 text-xs" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-zinc-200"><span className="font-semibold text-white">{r.user?.name || r.user?.email || 'System'}</span> · {humanize(r.action)}</p>
                                            <p className="truncate text-xs text-zinc-500">{describe(r.metadata) || 'No details'}</p>
                                        </div>
                                        {r.project && <Link href={`/projects/${r.project.id}`}><Badge tone="blue">{r.project.name}</Badge></Link>}
                                        <span className="w-24 text-right text-xs text-zinc-500" title={new Date(r.timestamp).toLocaleString('en-IN')}>{timeAgo(r.timestamp)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
            </Card>
        </div>
    );
}
