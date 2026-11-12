"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { AlertTriangle, ChevronLeft, ChevronRight, ClipboardList, Clock, FileText, LayoutList, ListChecks, Rows3, Search, TriangleAlert, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { ExportDoc } from '@/lib/reportExport';
import { DateRange, ExportMenu, SortHeader, rangeLabel, roleName, utilTone } from './shared';

export interface DailyReport {
    id: string; userId: string; date: string; submittedAt?: string;
    tasksCompleted: number; hoursWorked: number; utilization?: number | null;
    accomplishments: string; challenges: string | null; tomorrowPlan: string | null;
    user: { name: string; image: string | null; role: string };
}

type SortKey = 'date' | 'person' | 'tasks' | 'hours' | 'util';
const PAGE = 50;
const VIEW_KEY = 'eusai-reports-view';
const dayKey = (iso: string) => format(new Date(iso), 'yyyy-MM-dd');
const firstLine = (s?: string | null) => (s || '').split('\n').map(l => l.replace(/^[\s•\-*]+/, '').trim()).filter(Boolean).join(' · ');

interface Props {
    scope: 'team' | 'my';
    range: DateRange;
    viewer: string;
    people: { id: string; name: string; role: string }[];
}

export default function DailyReportsView({ scope, range, viewer, people }: Props) {
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [search, setSearch] = useState('');
    const [personId, setPersonId] = useState('ALL');
    const [blockersOnly, setBlockersOnly] = useState(false);
    const [view, setView] = useState<'table' | 'detailed'>('table');
    const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' });
    const [shown, setShown] = useState(PAGE);
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    useEffect(() => { try { const v = localStorage.getItem(VIEW_KEY); if (v === 'table' || v === 'detailed') setView(v); } catch { } }, []);
    const switchView = (v: 'table' | 'detailed') => { setView(v); try { localStorage.setItem(VIEW_KEY, v); } catch { } };

    const load = useCallback(async () => {
        setLoading(true); setFailed(false);
        try {
            const res = await fetch(`/api/reports/daily?type=${scope}&startDate=${range.from}&endDate=${range.to}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setReports(data.reports || []);
        } catch { setFailed(true); setReports([]); } finally { setLoading(false); setShown(PAGE); }
    }, [scope, range.from, range.to]);
    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = reports.filter(r =>
            (personId === 'ALL' || r.userId === personId) &&
            (!blockersOnly || (r.challenges || '').trim().length > 0) &&
            (!q || [r.user?.name, r.accomplishments, r.challenges, r.tomorrowPlan].some(v => (v || '').toLowerCase().includes(q))));
        const dir = sort.dir === 'asc' ? 1 : -1;
        const val = (r: DailyReport): string | number => sort.key === 'date' ? r.date : sort.key === 'person' ? (r.user?.name || '') : sort.key === 'tasks' ? r.tasksCompleted : sort.key === 'hours' ? r.hoursWorked : (r.utilization ?? 0);
        return [...list].sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * dir || (a.user?.name || '').localeCompare(b.user?.name || ''); });
    }, [reports, search, personId, blockersOnly, sort]);

    const stats = useMemo(() => {
        const n = filtered.length;
        const hours = filtered.reduce((s, r) => s + Number(r.hoursWorked || 0), 0);
        const tasks = filtered.reduce((s, r) => s + Number(r.tasksCompleted || 0), 0);
        const utils = filtered.filter(r => r.utilization !== null && r.utilization !== undefined);
        return {
            n, tasks, hours: Math.round(hours * 10) / 10,
            avgHours: n ? Math.round((hours / n) * 10) / 10 : 0,
            avgUtil: utils.length ? Math.round(utils.reduce((s, r) => s + Number(r.utilization), 0) / utils.length) : 0,
            people: new Set(filtered.map(r => r.userId)).size,
            blockers: filtered.filter(r => (r.challenges || '').trim()).length,
        };
    }, [filtered]);

    const toggleSort = (key: SortKey) => setSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));

    const buildExport = (): ExportDoc => {
        const person = people.find(p => p.id === personId)?.name;
        const filters = [
            ...(scope === 'team' ? [{ label: 'Person', value: person || 'Everyone in your scope' }] : []),
            ...(search.trim() ? [{ label: 'Search', value: search.trim() }] : []),
            ...(blockersOnly ? [{ label: 'Showing', value: 'Only reports with blockers' }] : []),
        ];
        const byPerson = new Map<string, { name: string; role: string; n: number; hours: number; tasks: number; util: number; utilN: number; blockers: number }>();
        for (const r of filtered) {
            const p = byPerson.get(r.userId) || { name: r.user?.name || 'Unknown', role: roleName(r.user?.role), n: 0, hours: 0, tasks: 0, util: 0, utilN: 0, blockers: 0 };
            p.n++; p.hours += Number(r.hoursWorked || 0); p.tasks += Number(r.tasksCompleted || 0);
            if (r.utilization !== null && r.utilization !== undefined) { p.util += Number(r.utilization); p.utilN++; }
            if ((r.challenges || '').trim()) p.blockers++;
            byPerson.set(r.userId, p);
        }
        return {
            title: scope === 'team' ? 'Team daily reports' : 'My daily reports',
            subtitle: rangeLabel(range),
            generatedBy: viewer,
            fileName: `${scope === 'team' ? 'Team' : 'My'} daily reports ${range.from} to ${range.to}`,
            filters,
            summary: [
                { label: 'Reports filed', value: stats.n },
                ...(scope === 'team' ? [{ label: 'People reporting', value: stats.people }] : []),
                { label: 'Tasks completed', value: stats.tasks },
                { label: 'Hours logged', value: stats.hours },
                { label: 'Average utilisation', value: `${stats.avgUtil}%` },
                { label: 'Reports with blockers', value: stats.blockers },
            ],
            tables: [
                {
                    name: 'Daily reports',
                    columns: [
                        { key: 'date', header: 'Date', type: 'date', width: 12 },
                        ...(scope === 'team' ? [{ key: 'name', header: 'Name', width: 18 }, { key: 'role', header: 'Role', width: 12 }] as const : []),
                        { key: 'tasks', header: 'Tasks', type: 'number', width: 7 },
                        { key: 'hours', header: 'Hours', type: 'decimal', width: 7 },
                        { key: 'util', header: 'Utilisation %', type: 'percent', width: 10 },
                        { key: 'done', header: 'What got done', type: 'longtext', width: 50 },
                        { key: 'blockers', header: 'Blockers', type: 'longtext', width: 32 },
                        { key: 'plan', header: 'Plan for next day', type: 'longtext', width: 32 },
                        { key: 'submitted', header: 'Submitted at', width: 16 },
                    ] as any,
                    rows: filtered.map(r => ({
                        date: dayKey(r.date), name: r.user?.name, role: roleName(r.user?.role),
                        tasks: r.tasksCompleted ?? 0, hours: r.hoursWorked ?? 0, util: r.utilization ?? null,
                        done: r.accomplishments, blockers: r.challenges || '', plan: r.tomorrowPlan || '',
                        submitted: r.submittedAt ? format(new Date(r.submittedAt), 'd MMM yyyy, h:mm a') : '',
                    })),
                },
                ...(scope === 'team' ? [{
                    name: 'Summary by person',
                    description: 'Totals for the same period and filters.',
                    columns: [
                        { key: 'name', header: 'Name', width: 22 }, { key: 'role', header: 'Role', width: 14 },
                        { key: 'n', header: 'Reports filed', type: 'number' as const, width: 12 }, { key: 'tasks', header: 'Tasks completed', type: 'number' as const, width: 13 },
                        { key: 'hours', header: 'Total hours', type: 'decimal' as const, width: 11 }, { key: 'avgHours', header: 'Avg hours / report', type: 'decimal' as const, width: 14 },
                        { key: 'avgUtil', header: 'Avg utilisation %', type: 'percent' as const, width: 14 }, { key: 'blockers', header: 'Reports with blockers', type: 'number' as const, width: 16 },
                    ],
                    rows: [...byPerson.values()].sort((a, b) => a.name.localeCompare(b.name)).map(p => ({
                        name: p.name, role: p.role, n: p.n, tasks: p.tasks, hours: Math.round(p.hours * 10) / 10,
                        avgHours: p.n ? Math.round((p.hours / p.n) * 10) / 10 : 0, avgUtil: p.utilN ? Math.round(p.util / p.utilN) : null, blockers: p.blockers,
                    })),
                }] : []),
            ],
        };
    };

    const current = openIndex !== null ? filtered[openIndex] : null;
    const groups = useMemo(() => {
        const m = new Map<string, DailyReport[]>();
        for (const r of filtered.slice(0, shown)) { const k = dayKey(r.date); m.set(k, [...(m.get(k) || []), r]); }
        return [...m.entries()];
    }, [filtered, shown]);

    return (
        <div className="space-y-5">
            {/* headline numbers */}
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Reports filed" value={stats.n} icon={ClipboardList} tone="blue" note={scope === 'team' ? `${stats.people} ${stats.people === 1 ? 'person' : 'people'}` : rangeLabel(range)} />
                <StatCard label="Hours logged" value={stats.hours} icon={Clock} tone="violet" note={`${stats.avgHours}h per report on average`} />
                <StatCard label="Average utilisation" value={`${stats.avgUtil}%`} icon={ListChecks} tone={stats.avgUtil >= 75 ? 'emerald' : stats.avgUtil >= 50 ? 'amber' : 'rose'} note={`${stats.tasks} tasks completed`} />
                <StatCard label="Reports with blockers" value={stats.blockers} icon={TriangleAlert} tone={stats.blockers ? 'amber' : 'emerald'} note={stats.blockers ? 'Filter to review them' : 'No blockers raised'} onClick={stats.blockers ? () => setBlockersOnly(true) : undefined} />
            </section>

            {/* toolbar */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder={scope === 'team' ? 'Search names or report text' : 'Search your reports'}
                        className="h-9 w-full rounded-lg border border-[#232327] bg-[#111113] pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500/60 focus:outline-none" />
                </div>
                {scope === 'team' && people.length > 0 && (
                    <select value={personId} onChange={e => setPersonId(e.target.value)} aria-label="Person"
                        className="h-9 max-w-[220px] rounded-lg border border-[#232327] bg-[#111113] px-3 text-sm text-zinc-100 focus:border-blue-500/60 focus:outline-none">
                        <option value="ALL">Everyone</option>
                        {people.map(p => <option key={p.id} value={p.id}>{p.name} · {roleName(p.role)}</option>)}
                    </select>
                )}
                <button type="button" onClick={() => setBlockersOnly(b => !b)} aria-pressed={blockersOnly}
                    className={cn('flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
                        blockersOnly ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-[#232327] bg-[#111113] text-zinc-400 hover:text-zinc-200')}>
                    <AlertTriangle className="h-4 w-4" />With blockers
                </button>
                <div className="ml-auto flex items-center gap-2">
                    <div role="tablist" aria-label="Layout" className="inline-flex items-center gap-0.5 rounded-lg border border-[#232327] bg-[#111113] p-1">
                        {([['table', 'Table', Rows3], ['detailed', 'Detailed', LayoutList]] as const).map(([id, label, Icon]) => (
                            <button key={id} role="tab" aria-selected={view === id} onClick={() => switchView(id)}
                                className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors', view === id ? 'bg-[#27272A] text-white' : 'text-zinc-400 hover:text-zinc-200')}>
                                <Icon className="h-4 w-4" /><span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>
                    <ExportMenu build={buildExport} disabled={loading || filtered.length === 0} />
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-[#111113]" />)}</div>
            ) : failed ? (
                <div className="glass"><EmptyState icon={FileText} title="Couldn’t load reports" description="Check your connection and try again." action={<button onClick={load} className="text-sm font-medium text-blue-400 hover:text-blue-300">Retry</button>} /></div>
            ) : filtered.length === 0 ? (
                <div className="glass"><EmptyState icon={FileText} title="No reports for these filters" description={reports.length ? 'Try clearing the search or blockers filter.' : `Nothing was filed for ${rangeLabel(range)}.`} /></div>
            ) : view === 'table' ? (
                <div className="glass overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-sm">
                            <thead className="sticky top-0 z-10 bg-[#111113]">
                                <tr className="border-b border-[#232327] text-left text-xs">
                                    <th className="px-4 py-3"><SortHeader label="Date" active={sort.key === 'date'} dir={sort.dir} onClick={() => toggleSort('date')} /></th>
                                    {scope === 'team' && <th className="px-3 py-3"><SortHeader label="Person" active={sort.key === 'person'} dir={sort.dir} onClick={() => toggleSort('person')} /></th>}
                                    <th className="px-3 py-3 text-right"><SortHeader label="Tasks" align="right" active={sort.key === 'tasks'} dir={sort.dir} onClick={() => toggleSort('tasks')} /></th>
                                    <th className="px-3 py-3 text-right"><SortHeader label="Hours" align="right" active={sort.key === 'hours'} dir={sort.dir} onClick={() => toggleSort('hours')} /></th>
                                    <th className="px-3 py-3 text-right"><SortHeader label="Utilisation" align="right" active={sort.key === 'util'} dir={sort.dir} onClick={() => toggleSort('util')} /></th>
                                    <th className="px-3 py-3 font-medium text-zinc-500">What got done</th>
                                    <th className="px-4 py-3 font-medium text-zinc-500">Blockers</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1C1C1F]">
                                {filtered.slice(0, shown).map((r, i) => (
                                    <tr key={r.id} onClick={() => setOpenIndex(i)} className="cursor-pointer transition-colors hover:bg-[#18181B]">
                                        <td className="whitespace-nowrap px-4 py-3 align-top">
                                            <p className="font-medium text-zinc-100">{format(new Date(r.date), 'd MMM')}</p>
                                            <p className="text-xs text-zinc-500">{format(new Date(r.date), 'EEE yyyy')}</p>
                                        </td>
                                        {scope === 'team' && (
                                            <td className="px-3 py-3 align-top">
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar src={r.user?.image} alt={r.user?.name} fallback={initialsOf(r.user?.name)} className="h-7 w-7 text-[10px]" />
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-zinc-100">{r.user?.name}</p>
                                                        <p className="text-xs text-zinc-500">{roleName(r.user?.role)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-3 py-3 text-right align-top tabular-nums text-zinc-200">{r.tasksCompleted ?? 0}</td>
                                        <td className="px-3 py-3 text-right align-top tabular-nums text-zinc-200">{r.hoursWorked ?? 0}</td>
                                        <td className={cn('px-3 py-3 text-right align-top font-medium tabular-nums', utilTone(r.utilization))}>{r.utilization ?? '–'}{r.utilization !== null && r.utilization !== undefined ? '%' : ''}</td>
                                        <td className="max-w-[420px] px-3 py-3 align-top"><p className="line-clamp-2 text-zinc-300">{firstLine(r.accomplishments)}</p></td>
                                        <td className="max-w-[240px] px-4 py-3 align-top">
                                            {(r.challenges || '').trim()
                                                ? <p className="line-clamp-2 text-amber-300/90">{firstLine(r.challenges)}</p>
                                                : <span className="text-zinc-600">None</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <TableFooter shown={Math.min(shown, filtered.length)} total={filtered.length} onMore={() => setShown(s => s + PAGE)} />
                </div>
            ) : (
                <div className="space-y-6">
                    {groups.map(([day, list]) => (
                        <section key={day}>
                            <div className="mb-2 flex items-baseline justify-between">
                                <h3 className="font-display text-[15px] font-semibold text-white">{format(new Date(`${day}T00:00:00`), 'EEEE, d MMMM yyyy')}</h3>
                                <span className="text-xs text-zinc-500">{list.length} report{list.length === 1 ? '' : 's'}</span>
                            </div>
                            <div className="grid gap-3 lg:grid-cols-2">
                                {list.map(r => (
                                    <article key={r.id} onClick={() => setOpenIndex(filtered.indexOf(r))} className="glass glass-hover cursor-pointer p-4">
                                        <header className="flex items-center gap-3">
                                            {scope === 'team' && <Avatar src={r.user?.image} alt={r.user?.name} fallback={initialsOf(r.user?.name)} className="h-8 w-8 text-[11px]" />}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-white">{scope === 'team' ? r.user?.name : format(new Date(r.date), 'EEEE')}</p>
                                                <p className="text-xs text-zinc-500">{scope === 'team' ? roleName(r.user?.role) : 'Your report'}{r.submittedAt ? ` · sent ${format(new Date(r.submittedAt), 'h:mm a')}` : ''}</p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums text-zinc-400">
                                                <span><b className="font-semibold text-zinc-100">{r.tasksCompleted ?? 0}</b> tasks</span>
                                                <span><b className="font-semibold text-zinc-100">{r.hoursWorked ?? 0}</b>h</span>
                                                <span className={cn('font-semibold', utilTone(r.utilization))}>{r.utilization ?? 0}%</span>
                                            </div>
                                        </header>
                                        <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-zinc-300">{r.accomplishments}</p>
                                        {(r.challenges || '').trim() && (
                                            <p className="mt-3 flex gap-2 rounded-lg bg-amber-500/[0.07] px-3 py-2 text-[13px] text-amber-200/90"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" /><span className="line-clamp-2">{r.challenges}</span></p>
                                        )}
                                    </article>
                                ))}
                            </div>
                        </section>
                    ))}
                    {shown < filtered.length && <TableFooter shown={shown} total={filtered.length} onMore={() => setShown(s => s + PAGE)} />}
                </div>
            )}

            {/* full report */}
            <Modal
                open={!!current}
                onClose={() => setOpenIndex(null)}
                size="lg"
                title={current ? (scope === 'team' ? current.user?.name : 'Your daily report') : ''}
                description={current ? `${format(new Date(current.date), 'EEEE, d MMMM yyyy')}${scope === 'team' ? ` · ${roleName(current.user?.role)}` : ''}${current.submittedAt ? ` · sent ${format(new Date(current.submittedAt), 'h:mm a')}` : ''}` : ''}
                icon={current && scope === 'team' ? <Avatar src={current.user?.image} alt={current.user?.name} fallback={initialsOf(current.user?.name)} className="h-10 w-10 text-xs" /> : undefined}
                footer={current && (
                    <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-xs text-zinc-500">{(openIndex ?? 0) + 1} of {filtered.length}</span>
                        <div className="flex items-center gap-2">
                            {scope === 'team' && <Link href={`/team/${current.userId}`} className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-[#1F1F23] hover:text-zinc-100"><Users className="mr-1.5 inline h-4 w-4" />Profile</Link>}
                            <button type="button" aria-label="Previous report" disabled={!openIndex} onClick={() => setOpenIndex(i => (i ? i - 1 : i))}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2F2F35] text-zinc-300 hover:bg-[#1F1F23] disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                            <button type="button" aria-label="Next report" disabled={openIndex === null || openIndex >= filtered.length - 1} onClick={() => setOpenIndex(i => (i !== null && i < filtered.length - 1 ? i + 1 : i))}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2F2F35] text-zinc-300 hover:bg-[#1F1F23] disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                        </div>
                    </div>
                )}
            >
                {current && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-3 gap-2">
                            {[['Tasks completed', current.tasksCompleted ?? 0, 'text-white'], ['Hours worked', current.hoursWorked ?? 0, 'text-white'], ['Utilisation', `${current.utilization ?? 0}%`, utilTone(current.utilization)]].map(([l, v, c]) => (
                                <div key={l as string} className="rounded-lg border border-[#232327] bg-[#18181B] px-3 py-2.5">
                                    <p className="text-xs text-zinc-500">{l}</p>
                                    <p className={cn('mt-0.5 text-lg font-semibold tabular-nums', c as string)}>{v}</p>
                                </div>
                            ))}
                        </div>
                        <ReportSection title="What got done" text={current.accomplishments} />
                        <ReportSection title="Blockers or challenges" text={current.challenges} tone="amber" />
                        <ReportSection title="Plan for the next day" text={current.tomorrowPlan} />
                    </div>
                )}
            </Modal>
        </div>
    );
}

function ReportSection({ title, text, tone }: { title: string; text?: string | null; tone?: 'amber' }) {
    return (
        <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-500">{title}</p>
            {(text || '').trim()
                ? <p className={cn('whitespace-pre-line rounded-lg border px-3.5 py-3 text-sm leading-relaxed', tone === 'amber' ? 'border-amber-500/20 bg-amber-500/[0.06] text-amber-100/90' : 'border-[#232327] bg-[#18181B] text-zinc-200')}>{text}</p>
                : <p className="text-sm text-zinc-600">Nothing added.</p>}
        </div>
    );
}

function TableFooter({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) {
    return (
        <div className="flex items-center justify-between border-t border-[#232327] px-4 py-3 text-xs text-zinc-500">
            <span>Showing {shown} of {total}</span>
            {shown < total && <button type="button" onClick={onMore} className="font-medium text-blue-400 hover:text-blue-300">Show {Math.min(PAGE, total - shown)} more</button>}
        </div>
    );
}
