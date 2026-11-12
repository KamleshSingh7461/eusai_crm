"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, Briefcase, CheckCircle2, Clock, Gauge, Layers, ListTodo, Search, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/Progress';
import { ExportDoc } from '@/lib/reportExport';
import { ExportMenu, SortHeader, roleName } from './shared';

const rateTone = (v: number) => (v >= 80 ? 'text-emerald-400' : v >= 50 ? 'text-amber-400' : 'text-rose-400');
const asOf = () => `As of ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;

function useJson<T>(url: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    useEffect(() => {
        let alive = true;
        setLoading(true); setError(false);
        fetch(url).then(r => (r.ok ? r.json() : Promise.reject())).then(d => alive && setData(d)).catch(() => alive && setError(true)).finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [url]);
    return { data, loading, error };
}

/* --------------------------------------------------------- Performance */

export function PerformanceView({ viewer }: { viewer: string }) {
    const { data, loading, error } = useJson<any>('/api/reports/kpi');
    const [q, setQ] = useState('');
    const [sort, setSort] = useState<{ key: 'name' | 'completionRate' | 'onTimeRate' | 'activeCount'; dir: 'asc' | 'desc' }>({ key: 'completionRate', dir: 'desc' });

    const people = useMemo(() => {
        const list: any[] = data?.employees?.list || [];
        const ql = q.trim().toLowerCase();
        const dir = sort.dir === 'asc' ? 1 : -1;
        return list.filter(e => !ql || e.name?.toLowerCase().includes(ql) || e.department?.toLowerCase().includes(ql))
            .sort((a, b) => (sort.key === 'name' ? a.name.localeCompare(b.name) : a[sort.key] - b[sort.key]) * dir);
    }, [data, q, sort]);

    if (loading) return <div className="h-72 animate-pulse rounded-xl bg-[#111113]" />;
    if (error || !data) return <div className="glass"><EmptyState icon={Gauge} title="Couldn’t load performance data" description="Try again in a moment." /></div>;

    const { employees, projects, tasks, team, risks = [], departments = [] } = data;
    const toggle = (key: typeof sort.key) => setSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));

    const buildExport = (): ExportDoc => ({
        title: 'Team performance',
        subtitle: asOf(),
        generatedBy: viewer,
        fileName: `Team performance ${new Date().toISOString().slice(0, 10)}`,
        filters: q.trim() ? [{ label: 'Search', value: q.trim() }] : [],
        summary: [
            { label: 'Task completion', value: `${tasks.completionRate}%` },
            { label: 'Completed last 7 days', value: team.velocity },
            { label: 'Overdue tasks', value: tasks.overdue },
            { label: 'Avg days to complete', value: tasks.avgResolutionTime },
            { label: 'Open issues', value: team.activeIssues },
            { label: 'Projects', value: projects.total },
        ],
        tables: [
            {
                name: 'People',
                columns: [
                    { key: 'name', header: 'Name', width: 22 }, { key: 'role', header: 'Role', width: 14 }, { key: 'department', header: 'Department', width: 18 },
                    { key: 'completionRate', header: 'Completion %', type: 'percent', width: 12 }, { key: 'onTimeRate', header: 'On time %', type: 'percent', width: 11 },
                    { key: 'activeCount', header: 'Open tasks and milestones', type: 'number', width: 16 },
                ],
                rows: people.map((e: any) => ({ ...e, role: roleName(e.role) })),
            },
            {
                name: 'Projects',
                columns: [
                    { key: 'name', header: 'Project', width: 30 }, { key: 'progress', header: 'Progress %', type: 'percent', width: 11 },
                    { key: 'issueCount', header: 'Open issues', type: 'number', width: 11 }, { key: 'riskScore', header: 'Risk score', type: 'number', width: 10 },
                    { key: 'spent', header: 'Approved spend (INR)', type: 'number', width: 16 },
                ],
                rows: projects.list || [],
            },
            {
                name: 'High-priority risks',
                columns: [{ key: 'title', header: 'Issue', width: 40 }, { key: 'severity', header: 'Severity', width: 10 }, { key: 'source', header: 'Project or department', width: 24 }, { key: 'daysOpen', header: 'Days open', type: 'number', width: 10 }],
                rows: risks,
            },
        ],
    });

    return (
        <div className="space-y-5">
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Task completion" value={`${tasks.completionRate}%`} icon={CheckCircle2} tone={tasks.completionRate >= 70 ? 'emerald' : 'amber'} note={`${tasks.completed} of ${tasks.total} tasks`} />
                <StatCard label="Completed last 7 days" value={team.velocity} icon={TrendingUp} tone="blue" note="Tasks marked done" />
                <StatCard label="Overdue tasks" value={tasks.overdue} icon={AlertTriangle} tone={tasks.overdue ? 'rose' : 'emerald'} note={`${tasks.avgResolutionTime} days to complete on average`} href="/tasks?filter=overdue" />
                <StatCard label="Open issues" value={team.activeIssues} icon={Activity} tone={team.activeIssues ? 'amber' : 'emerald'} note={`${risks.length} high priority`} href="/issues" />
            </section>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search people or departments"
                        className="h-9 w-full rounded-lg border border-[#232327] bg-[#111113] pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500/60 focus:outline-none" />
                </div>
                <div className="ml-auto"><ExportMenu build={buildExport} /></div>
            </div>

            <div className="glass overflow-hidden">
                <div className="px-5 pb-3 pt-4"><CardHeader title="People" description={`Completion and on-time rates across tasks and milestones · ${people.length} ${people.length === 1 ? 'person' : 'people'}`} /></div>
                <div className="overflow-x-auto border-t border-[#232327]">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead>
                            <tr className="border-b border-[#232327] text-left text-xs">
                                <th className="px-5 py-2.5"><SortHeader label="Name" active={sort.key === 'name'} dir={sort.dir} onClick={() => toggle('name')} /></th>
                                <th className="px-3 py-2.5 font-medium text-zinc-500">Department</th>
                                <th className="px-3 py-2.5"><SortHeader label="Completion" active={sort.key === 'completionRate'} dir={sort.dir} onClick={() => toggle('completionRate')} /></th>
                                <th className="px-3 py-2.5 text-right"><SortHeader label="On time" align="right" active={sort.key === 'onTimeRate'} dir={sort.dir} onClick={() => toggle('onTimeRate')} /></th>
                                <th className="px-5 py-2.5 text-right"><SortHeader label="Open items" align="right" active={sort.key === 'activeCount'} dir={sort.dir} onClick={() => toggle('activeCount')} /></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1C1C1F]">
                            {people.map((e: any) => (
                                <tr key={e.id} className="transition-colors hover:bg-[#18181B]">
                                    <td className="px-5 py-2.5">
                                        <Link href={`/team/${e.id}`} className="flex items-center gap-2.5">
                                            <Avatar alt={e.name} fallback={initialsOf(e.name)} className="h-7 w-7 text-[10px]" />
                                            <span><span className="block font-medium text-zinc-100 hover:underline">{e.name}</span><span className="block text-xs text-zinc-500">{roleName(e.role)}</span></span>
                                        </Link>
                                    </td>
                                    <td className="px-3 py-2.5 text-zinc-400">{e.department}</td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2"><ProgressBar value={e.completionRate} className="w-24" /><span className={cn('w-10 text-xs font-semibold tabular-nums', rateTone(e.completionRate))}>{e.completionRate}%</span></div>
                                    </td>
                                    <td className="px-3 py-2.5 text-right tabular-nums text-zinc-300">{e.onTimeRate}%</td>
                                    <td className="px-5 py-2.5 text-right tabular-nums text-zinc-300">{e.activeCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
                <Card padding="none" className="overflow-hidden lg:col-span-2">
                    <div className="px-5 pb-3 pt-4"><CardHeader title="Projects" description="Highest risk first" icon={undefined} /></div>
                    <div className="overflow-x-auto border-t border-[#232327]">
                        <table className="w-full min-w-[560px] text-sm">
                            <thead><tr className="border-b border-[#232327] text-left text-xs text-zinc-500">
                                <th className="px-5 py-2.5 font-medium">Project</th><th className="px-3 py-2.5 font-medium">Progress</th>
                                <th className="px-3 py-2.5 text-right font-medium">Open issues</th><th className="px-5 py-2.5 text-right font-medium">Risk</th>
                            </tr></thead>
                            <tbody className="divide-y divide-[#1C1C1F]">
                                {(projects.list || []).map((p: any) => (
                                    <tr key={p.id} className="hover:bg-[#18181B]">
                                        <td className="px-5 py-2.5"><Link href={`/projects/${p.id}`} className="font-medium text-zinc-100 hover:underline">{p.name}</Link></td>
                                        <td className="px-3 py-2.5"><div className="flex items-center gap-2"><ProgressBar value={p.progress} tone="blue" className="w-24" /><span className="text-xs tabular-nums text-zinc-400">{p.progress}%</span></div></td>
                                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-300">{p.issueCount}</td>
                                        <td className="px-5 py-2.5 text-right"><Badge tone={p.riskScore > 40 ? 'rose' : p.riskScore > 10 ? 'amber' : 'emerald'}>{p.riskScore > 40 ? 'High' : p.riskScore > 10 ? 'Medium' : 'Low'} · {p.riskScore}</Badge></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <div className="space-y-5">
                    <Card padding="lg">
                        <CardHeader title="High-priority risks" description="Open critical and high issues" />
                        {risks.length === 0 ? <p className="mt-4 text-sm text-zinc-500">No critical or high issues open.</p> : (
                            <ul className="mt-3 divide-y divide-[#232327]">
                                {risks.map((r: any) => (
                                    <li key={r.id} className="flex items-start gap-2.5 py-2.5">
                                        <AlertTriangle className={cn('mt-0.5 h-4 w-4 shrink-0', r.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400')} />
                                        <div className="min-w-0"><p className="truncate text-sm font-medium text-zinc-100">{r.title}</p><p className="text-xs text-zinc-500">{r.severity === 'CRITICAL' ? 'Critical' : 'High'} · {r.source}</p></div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                    <Card padding="lg">
                        <CardHeader title="By department" description="Average completion rate" />
                        <ul className="mt-3 space-y-2.5">
                            {departments.map((d: any) => (
                                <li key={d.name} className="flex items-center gap-3">
                                    <span className="min-w-0 flex-1"><span className="block truncate text-sm text-zinc-200">{d.name}</span><span className="block text-xs text-zinc-500">{d.headcount} {d.headcount === 1 ? 'person' : 'people'}</span></span>
                                    <ProgressBar value={d.avgEfficiency} className="w-20" /><span className="w-9 text-right text-xs tabular-nums text-zinc-400">{d.avgEfficiency}%</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------ Workload */

export function WorkloadView({ viewer }: { viewer: string }) {
    const { data, loading, error } = useJson<any>('/api/reports/resources');
    const [q, setQ] = useState('');

    const team = useMemo(() => {
        const ql = q.trim().toLowerCase();
        return ((data?.team || []) as any[]).filter(m => !ql || m.name?.toLowerCase().includes(ql)).sort((a, b) => b.metrics.activeTasks - a.metrics.activeTasks);
    }, [data, q]);

    if (loading) return <div className="h-72 animate-pulse rounded-xl bg-[#111113]" />;
    if (error || !data) return <div className="glass"><EmptyState icon={Layers} title="Couldn’t load workload" description="Try again in a moment." /></div>;
    const { stats } = data;
    const overloaded = team.filter(m => m.metrics.activeTasks >= 8).length;

    const buildExport = (): ExportDoc => ({
        title: 'Team workload',
        subtitle: asOf(),
        generatedBy: viewer,
        fileName: `Team workload ${new Date().toISOString().slice(0, 10)}`,
        filters: [{ label: 'Load', value: 'Open tasks per person; 10 open tasks = 100% load' }, ...(q.trim() ? [{ label: 'Search', value: q.trim() }] : [])],
        summary: [
            { label: 'Open tasks', value: stats.totalActiveTasks }, { label: 'Overdue', value: stats.totalOverdue },
            { label: 'Average load', value: `${stats.avgUtilization}%` }, { label: 'People at 8+ tasks', value: overloaded }, { label: 'People', value: team.length },
        ],
        tables: [{
            name: 'Workload by person',
            columns: [
                { key: 'name', header: 'Name', width: 24 }, { key: 'role', header: 'Role', width: 14 }, { key: 'active', header: 'Open tasks', type: 'number', width: 11 },
                { key: 'high', header: 'High priority', type: 'number', width: 12 }, { key: 'overdue', header: 'Overdue', type: 'number', width: 10 }, { key: 'load', header: 'Load %', type: 'percent', width: 10 },
            ],
            rows: team.map(m => ({ name: m.name, role: roleName(m.role), active: m.metrics.activeTasks, high: m.metrics.highPriority, overdue: m.metrics.overdue, load: Math.round(m.metrics.utilization) })),
        }],
    });

    return (
        <div className="space-y-5">
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Open tasks" value={stats.totalActiveTasks} icon={ListTodo} tone="blue" note={`Across ${team.length} people`} />
                <StatCard label="Overdue" value={stats.totalOverdue} icon={Clock} tone={stats.totalOverdue ? 'rose' : 'emerald'} note="Open tasks past deadline" href="/tasks?filter=overdue" />
                <StatCard label="Average load" value={`${stats.avgUtilization}%`} icon={Gauge} tone={stats.avgUtilization > 80 ? 'rose' : 'violet'} note="10 open tasks = 100%" />
                <StatCard label="At 8+ tasks" value={overloaded} icon={Users} tone={overloaded ? 'amber' : 'emerald'} note="May need help or rebalancing" />
            </section>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search people"
                        className="h-9 w-full rounded-lg border border-[#232327] bg-[#111113] pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500/60 focus:outline-none" />
                </div>
                <div className="ml-auto"><ExportMenu build={buildExport} /></div>
            </div>

            <div className="glass overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead><tr className="border-b border-[#232327] text-left text-xs text-zinc-500">
                            <th className="px-5 py-2.5 font-medium">Person</th><th className="px-3 py-2.5 font-medium">Load</th>
                            <th className="px-3 py-2.5 text-right font-medium">Open</th><th className="px-3 py-2.5 text-right font-medium">High priority</th><th className="px-5 py-2.5 text-right font-medium">Overdue</th>
                        </tr></thead>
                        <tbody className="divide-y divide-[#1C1C1F]">
                            {team.map(m => (
                                <tr key={m.id} className="hover:bg-[#18181B]">
                                    <td className="px-5 py-2.5">
                                        <Link href={`/team/${m.id}`} className="flex items-center gap-2.5">
                                            <Avatar src={m.image} alt={m.name} fallback={initialsOf(m.name)} className="h-7 w-7 text-[10px]" />
                                            <span><span className="block font-medium text-zinc-100 hover:underline">{m.name}</span><span className="block text-xs text-zinc-500">{roleName(m.role)}</span></span>
                                        </Link>
                                    </td>
                                    <td className="px-3 py-2.5"><div className="flex items-center gap-2"><ProgressBar value={m.metrics.utilization} tone={m.metrics.utilization >= 80 ? 'rose' : m.metrics.utilization >= 50 ? 'amber' : 'emerald'} className="w-28" /><span className="text-xs tabular-nums text-zinc-400">{Math.round(m.metrics.utilization)}%</span></div></td>
                                    <td className="px-3 py-2.5 text-right tabular-nums text-zinc-200">{m.metrics.activeTasks}</td>
                                    <td className={cn('px-3 py-2.5 text-right tabular-nums', m.metrics.highPriority ? 'text-amber-400' : 'text-zinc-600')}>{m.metrics.highPriority}</td>
                                    <td className={cn('px-5 py-2.5 text-right tabular-nums', m.metrics.overdue ? 'font-medium text-rose-400' : 'text-zinc-600')}>{m.metrics.overdue}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
