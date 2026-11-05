"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Users, Globe, Briefcase, Award, ShieldAlert, FileWarning, Clock, Download, BarChart3, Search,
    Building2, GraduationCap, CheckCircle2, ArrowUpRight, Wifi, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadCsv, todayStamp } from '@/lib/csv';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import Badge, { StatusPill } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/ui/EmptyState';
import { ProgressBar, ProgressRing } from '@/components/ui/Progress';
import { humanize, roleTone, TONES } from '@/components/ui/tones';
import DashboardAISummary from './DashboardAISummary';
import {
    ActivityList, BarList, BarTrend, Card, CardHeader, DashboardError, DashboardSkeleton, DonutBreakdown,
    SectionLink, TrendChart, firstName, greeting, timeAgo, todayLabel
} from './widgets';

interface DirectorData {
    stats: {
        partnerCount: number; staffCount: number; marketCoverage: number; criticalIssues: number;
        totalOpenIssues: number; taskCompletionRate: number; activeProjects: number; missingReports: number;
    };
    employees: { id: string; name: string; role: string; image: string | null; pendingTasks: number; pendingMilestones: number }[];
    topPerformers: { id: string; name: string; image: string | null; role: string; score: number }[];
    projects: { id: string; name: string; status: string; managerName: string; taskCount: number; milestoneCount: number; completedMilestones: number; progress: number }[];
    spaceDistribution: { id: string; name: string; color: string; projectCount: number }[];
    recentMilestones: { id: string; title: string; projectName: string; ownerName: string; ownerImage: string | null; status: string; completedAt: string | null }[];
    globalActivity: { id: string; title: string; status: string; assignedTo?: string; assignedToImage?: string; projectName?: string; updatedAt: string }[];
    charts: {
        weeklyProductivity: { day: string; tasks: number }[];
        monthlyProductivity: { name: string; tasks: number }[];
        taskStatus: { name: string; value: number }[];
        projectStatus: { name: string; value: number }[];
        issueSeverity: { name: string; value: number }[];
    };
}

interface PresenceUser { id: string; name: string; email: string; role: string; image: string | null; isOnline: boolean; lastLogin: string | null }

type Section = 'overview' | 'team' | 'projects' | 'activity';

export default function DirectorDashboard() {
    const router = useRouter();
    const { data: session } = useSession();
    const [data, setData] = useState<DirectorData | null>(null);
    const [presence, setPresence] = useState<PresenceUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [section, setSection] = useState<Section>('overview');
    const [query, setQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [res, activityRes] = await Promise.all([fetch('/api/dashboard/director'), fetch('/api/users/activity')]);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'The dashboard service returned an error.');
            }
            setData(await res.json());
            if (activityRes.ok) setPresence((await activityRes.json()).activity || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const q = query.trim().toLowerCase();
    const filteredStaff = useMemo(() => (data?.employees || []).filter(e =>
        (roleFilter === 'ALL' || e.role === roleFilter) && (!q || e.name?.toLowerCase().includes(q))
    ), [data, q, roleFilter]);
    const filteredProjects = useMemo(() => (data?.projects || []).filter(p =>
        !q || p.name.toLowerCase().includes(q) || p.managerName.toLowerCase().includes(q)
    ), [data, q]);
    const filteredPresence = useMemo(() => presence.filter(u =>
        !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    ), [presence, q]);

    if (isLoading) return <DashboardSkeleton />;
    if (error || !data) return <DashboardError message={error || undefined} onRetry={load} />;

    const { stats, charts } = data;
    const submitted = Math.max(0, stats.staffCount - stats.missingReports);
    const compliance = stats.staffCount > 0 ? (submitted / stats.staffCount) * 100 : 100;
    const weekly = charts.weeklyProductivity.map(d => d.tasks);
    const monthly = charts.monthlyProductivity.map(d => d.tasks);
    const monthTotal = monthly.reduce((a, b) => a + b, 0);
    const lastMonth = monthly[monthly.length - 1] ?? 0;
    const prevMonth = monthly[monthly.length - 2] ?? 0;
    const monthDelta = prevMonth > 0 ? Math.round(((lastMonth - prevMonth) / prevMonth) * 100) : null;
    const onlineCount = presence.filter(u => u.isOnline).length;
    const roles = Array.from(new Set(data.employees.map(e => e.role)));

    const exportSnapshot = () => {
        if (section === 'projects') {
            downloadCsv(`projects-${todayStamp()}`, data.projects.map(p => ({ Project: p.name, Status: humanize(p.status), Managers: p.managerName, Tasks: p.taskCount, Milestones: p.milestoneCount, 'Milestones done': p.completedMilestones, 'Progress %': p.progress })));
        } else if (section === 'activity') {
            downloadCsv(`staff-presence-${todayStamp()}`, presence.map(u => ({ Name: u.name, Email: u.email, Role: humanize(u.role), Online: u.isOnline ? 'Yes' : 'No', 'Last login': u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never' })));
        } else {
            downloadCsv(`staff-workload-${todayStamp()}`, data.employees.map(e => ({ Name: e.name, Role: humanize(e.role), 'Open tasks': e.pendingTasks, 'Open milestones': e.pendingMilestones })));
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow={`Director overview · ${todayLabel()}`}
                title={<>{greeting()}, <span className="text-gradient-brand">{firstName(session?.user?.name)}</span></>}
                description="How your organization is performing today."
                actions={
                    <>
                        <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={exportSnapshot}>Export</Button>
                        <Button leftIcon={<BarChart3 className="h-4 w-4" />} onClick={() => router.push('/reports/performance')}>Performance report</Button>
                    </>
                }
            />

            {stats.missingReports > 0 && (
                <Card delay={0.05} padding="none" className="flex flex-wrap items-center gap-4 border-rose-400/20 bg-gradient-to-r from-rose-500/[0.12] via-rose-500/[0.04] to-transparent px-5 py-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/25"><FileWarning className="h-5 w-5" /></span>
                    <div className="min-w-[200px] flex-1">
                        <p className="text-sm font-semibold text-white">{stats.missingReports} of {stats.staffCount} team members haven't submitted today's report</p>
                        <p className="text-sm text-slate-400">The submission window closes at 11:59 PM IST.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => router.push('/reports?activeTab=TEAM')}>Review reports</Button>
                </Card>
            )}

            <DashboardAISummary role="DIRECTOR" contextData={data} />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <Tabs
                    value={section}
                    onChange={id => { setSection(id as Section); setQuery(''); }}
                    items={[
                        { id: 'overview', label: 'Organization pulse', icon: Globe },
                        { id: 'team', label: 'Staff analytics', icon: Users, count: data.employees.length },
                        { id: 'projects', label: 'Project portfolio', icon: Briefcase, count: data.projects.length },
                        { id: 'activity', label: 'Presence', icon: Clock, count: onlineCount },
                    ]}
                />
                {section !== 'overview' && (
                    <Input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={section === 'projects' ? 'Search projects or managers' : 'Search people'}
                        leftIcon={<Search />}
                        containerClassName="w-full sm:w-72"
                    />
                )}
            </div>

            {section === 'overview' && (
                <div className="space-y-6">
                    <section className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
                        <StatCard delay={0.1} label="Missing reports" value={stats.missingReports} icon={FileWarning} tone={stats.missingReports > 0 ? 'rose' : 'emerald'}
                            note={stats.missingReports > 0 ? 'Not submitted today' : 'Everyone has reported'} href="/reports?activeTab=TEAM" />
                        <StatCard delay={0.15} label="Active projects" value={stats.activeProjects} icon={Briefcase} tone="blue" trend={weekly}
                            note={`${stats.taskCompletionRate}% of all tasks completed`} href="/projects" />
                        <StatCard delay={0.2} label="Total staff" value={stats.staffCount} icon={Users} tone="violet"
                            note={`${onlineCount} online now`} href="/team" />
                        <StatCard delay={0.25} label="Critical risks" value={stats.criticalIssues} icon={ShieldAlert} tone={stats.criticalIssues > 0 ? 'rose' : 'emerald'}
                            note={`${stats.totalOpenIssues} open issues in total`} href="/issues" />
                    </section>

                    <section className="grid gap-5 xl:grid-cols-3">
                        <Card delay={0.3} padding="lg" className="xl:col-span-2">
                            <CardHeader title="Delivery velocity" description="Tasks completed per month, last 6 months" />
                            <div className="mt-3 flex items-baseline gap-3">
                                <p className="font-display text-3xl font-bold text-white tabular-nums">{monthTotal}</p>
                                {monthDelta !== null && <Badge tone={monthDelta >= 0 ? 'emerald' : 'rose'} icon={<ArrowUpRight className={cn(monthDelta < 0 && 'rotate-90')} />}>{monthDelta >= 0 ? '+' : ''}{monthDelta}% vs last month</Badge>}
                            </div>
                            <div className="mt-4">
                                <TrendChart data={charts.monthlyProductivity} xKey="name" series={[{ key: 'tasks', label: 'Tasks completed', color: '#60A5FA' }]} />
                            </div>
                        </Card>
                        <Card delay={0.35} padding="lg">
                            <CardHeader title="Report compliance" description="Daily reports submitted today" />
                            <div className="mt-6 flex justify-center"><ProgressRing value={compliance} label="submitted" /></div>
                            <div className="mt-6 space-y-3 text-sm">
                                <div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="flex-1 text-slate-300">Submitted</span><span className="font-semibold text-white tabular-nums">{submitted}</span></div>
                                <div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" /><span className="flex-1 text-slate-300">Missing</span><span className="font-semibold text-white tabular-nums">{stats.missingReports}</span></div>
                            </div>
                        </Card>
                    </section>

                    <section className="grid gap-5 xl:grid-cols-3">
                        <Card delay={0.4} padding="lg">
                            <CardHeader title="Top performers" description="Tasks completed, last 30 days" action={<SectionLink href="/reports/performance">All</SectionLink>} />
                            <ul className="mt-5 space-y-2">
                                {data.topPerformers.map((user, index) => (
                                    <li key={user.id}>
                                        <Link href={`/team/${user.id}`} className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.04]">
                                            <div className="relative">
                                                <Avatar src={user.image} alt={user.name} fallback={initialsOf(user.name)} className="h-10 w-10 text-xs" />
                                                {index < 3 && (
                                                    <span className={cn('absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ring-2 ring-[#0B0E14]',
                                                        index === 0 ? 'bg-amber-400 text-amber-950' : index === 1 ? 'bg-slate-300 text-slate-300' : 'bg-orange-700 text-orange-50')}>{index + 1}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-100">{user.name}</p>
                                                <p className="text-xs text-slate-500">{humanize(user.role)}</p>
                                            </div>
                                            <Badge tone="emerald">{user.score} done</Badge>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            {data.topPerformers.length === 0 && <EmptyState icon={Award} title="No rankings yet" description="Rankings appear once employees complete tasks." className="py-8" />}
                        </Card>

                        <Card delay={0.45} padding="lg">
                            <CardHeader title="Task status" description="Every task across the organization" action={<SectionLink href="/tasks">Tasks</SectionLink>} />
                            <div className="mt-5"><DonutBreakdown data={charts.taskStatus} centerLabel="tasks" emptyText="No tasks created yet" /></div>
                        </Card>

                        <Card delay={0.5} padding="lg" className="flex flex-col">
                            <CardHeader title="Risk exposure" description={`${stats.totalOpenIssues} open issues`} action={<SectionLink href="/issues">Issues</SectionLink>} />
                            <div className="mt-5 flex-1">
                                {charts.issueSeverity.length > 0
                                    ? <BarList items={['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => ({ label: humanize(s), value: charts.issueSeverity.find(i => i.name === s)?.value || 0, tone: s === 'CRITICAL' ? 'rose' as const : s === 'HIGH' ? 'amber' as const : s === 'MEDIUM' ? 'blue' as const : 'slate' as const }))} />
                                    : <EmptyState icon={CheckCircle2} title="No open risks" description="Nothing needs escalation right now." className="py-6" />}
                            </div>
                        </Card>
                    </section>

                    <section className="grid gap-5 xl:grid-cols-3">
                        <Card delay={0.55} padding="lg" className="xl:col-span-2">
                            <CardHeader title="Latest work" description="Most recently updated tasks" action={<SectionLink href="/recent">Full feed</SectionLink>} />
                            <div className="mt-4">
                                <ActivityList items={data.globalActivity.slice(0, 7).map(a => ({
                                    id: a.id, title: a.title, who: a.assignedTo, image: a.assignedToImage, subtitle: a.projectName, at: a.updatedAt, done: a.status === 'DONE', href: '/tasks',
                                }))} />
                            </div>
                        </Card>
                        <div className="grid gap-5">
                            <Card delay={0.6} padding="lg">
                                <CardHeader title="Departments" description="Open projects per department" action={<SectionLink href="/spaces">All</SectionLink>} />
                                <div className="mt-5">
                                    <BarList items={data.spaceDistribution.slice(0, 5).map(s => ({ label: s.name, value: s.projectCount, color: s.color, href: `/spaces/${s.id}` }))} emptyText="No departments yet" />
                                </div>
                            </Card>
                            <Card delay={0.65} padding="lg">
                                <div className="flex items-center gap-4">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/25 to-cyan-500/5 text-cyan-300 ring-1 ring-inset ring-cyan-400/25"><GraduationCap className="h-5 w-5" /></span>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-400">University partners</p>
                                        <p className="font-display text-2xl font-bold text-white tabular-nums">{stats.partnerCount}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-400">Coverage</p>
                                        <p className="font-display text-2xl font-bold text-cyan-300 tabular-nums">{stats.marketCoverage}%</p>
                                    </div>
                                </div>
                                <ProgressBar value={stats.marketCoverage} tone="cyan" className="mt-4 h-2" glow />
                                <div className="mt-4"><SectionLink href="/universities">Universities</SectionLink></div>
                            </Card>
                        </div>
                    </section>

                    {data.recentMilestones.length > 0 && (
                        <Card delay={0.7} padding="lg">
                            <CardHeader title="Recent milestones" description="Newest milestones across all projects" action={<SectionLink href="/milestones">Milestones</SectionLink>} />
                            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {data.recentMilestones.slice(0, 6).map(m => (
                                    <Link key={m.id} href="/milestones" className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition hover:border-white/[0.1] hover:bg-white/[0.04]">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300"><Target className="h-4 w-4" /></span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-100">{m.title}</p>
                                            <p className="truncate text-xs text-slate-500">{m.ownerName} · {m.projectName}</p>
                                        </div>
                                        <StatusPill status={m.status} />
                                    </Link>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {section === 'team' && (
                <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                        {['ALL', ...roles].map(r => (
                            <button key={r} onClick={() => setRoleFilter(r)} className={cn('rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition',
                                roleFilter === r ? 'bg-blue-500/15 text-blue-200 ring-blue-400/30' : 'text-slate-400 ring-white/10 hover:text-slate-200')}>
                                {r === 'ALL' ? `Everyone (${data.employees.length})` : `${humanize(r)} (${data.employees.filter(e => e.role === r).length})`}
                            </button>
                        ))}
                    </div>
                    {filteredStaff.length === 0
                        ? <Card><EmptyState icon={Users} title="No one matches" description="Try a different name or role filter." /></Card>
                        : (
                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {filteredStaff.map((emp, i) => {
                                    const load = emp.pendingTasks + emp.pendingMilestones;
                                    return (
                                        <Card key={emp.id} delay={Math.min(i, 8) * 0.03} interactive onClick={() => router.push(`/team/${emp.id}`)} className="group">
                                            <div className="flex items-center gap-4">
                                                <Avatar src={emp.image} alt={emp.name} fallback={initialsOf(emp.name)} className="h-12 w-12 text-sm" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-semibold text-white group-hover:text-blue-200">{emp.name}</p>
                                                    <Badge tone={roleTone(emp.role)} className="mt-1">{humanize(emp.role)}</Badge>
                                                </div>
                                                <ArrowUpRight className="h-4 w-4 text-slate-600 transition group-hover:text-slate-300" />
                                            </div>
                                            <div className="mt-5 grid grid-cols-2 gap-3">
                                                <div className="rounded-xl bg-white/[0.03] p-3">
                                                    <p className="font-display text-2xl font-bold text-white tabular-nums">{emp.pendingTasks}</p>
                                                    <p className="text-xs text-slate-500">Open tasks</p>
                                                </div>
                                                <div className="rounded-xl bg-white/[0.03] p-3">
                                                    <p className="font-display text-2xl font-bold text-violet-300 tabular-nums">{emp.pendingMilestones}</p>
                                                    <p className="text-xs text-slate-500">Open milestones</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between text-xs">
                                                <span className="text-slate-500">Workload</span>
                                                <span className={cn('font-medium', load > 10 ? 'text-rose-300' : load > 5 ? 'text-amber-300' : 'text-emerald-300')}>
                                                    {load > 10 ? 'Heavy' : load > 5 ? 'Moderate' : 'Light'}
                                                </span>
                                            </div>
                                            <ProgressBar value={Math.min(100, load * 8)} tone={load > 10 ? 'rose' : load > 5 ? 'amber' : 'emerald'} className="mt-2" />
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                </div>
            )}

            {section === 'projects' && (
                <Card padding="none" className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead>
                                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-left text-xs font-medium text-slate-500">
                                    <th className="px-6 py-3 font-medium">Project</th>
                                    <th className="px-3 py-3 font-medium">Managers</th>
                                    <th className="px-3 py-3 font-medium">Status</th>
                                    <th className="px-3 py-3 text-right font-medium">Tasks</th>
                                    <th className="px-3 py-3 text-right font-medium">Milestones</th>
                                    <th className="px-6 py-3 font-medium">Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.map(p => (
                                    <tr key={p.id} onClick={() => router.push(`/projects/${p.id}`)} className="cursor-pointer border-b border-white/[0.04] transition last:border-0 hover:bg-white/[0.025]">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300"><Briefcase className="h-4 w-4" /></span>
                                                <span className="font-semibold text-slate-100">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-slate-400">{p.managerName}</td>
                                        <td className="px-3 py-4"><StatusPill status={p.status} /></td>
                                        <td className="px-3 py-4 text-right font-semibold text-slate-200 tabular-nums">{p.taskCount}</td>
                                        <td className="px-3 py-4 text-right text-slate-300 tabular-nums">{p.completedMilestones}/{p.milestoneCount}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <ProgressBar value={p.progress} className="w-28" />
                                                <span className="w-9 text-xs font-semibold text-slate-300 tabular-nums">{p.progress}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredProjects.length === 0 && (
                        <EmptyState icon={Briefcase} title={q ? 'No projects match' : 'No projects yet'} description={q ? 'Try a different search.' : 'Create the first project to start tracking delivery.'}
                            action={!q && <Button leftIcon={<Briefcase className="h-4 w-4" />} onClick={() => router.push('/projects/new')}>New project</Button>} />
                    )}
                </Card>
            )}

            {section === 'activity' && (
                <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-3 sm:gap-5">
                        <StatCard label="Online now" value={onlineCount} icon={Wifi} tone="emerald" />
                        <StatCard label="Total staff" value={presence.length} icon={Users} tone="blue" />
                        <StatCard label="Never signed in" value={presence.filter(u => !u.lastLogin).length} icon={Building2} tone="amber" />
                    </div>
                    <Card padding="none" className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-sm">
                                <thead>
                                    <tr className="border-b border-white/[0.06] bg-white/[0.02] text-left text-xs font-medium text-slate-500">
                                        <th className="px-6 py-3 font-medium">Person</th>
                                        <th className="px-3 py-3 font-medium">Role</th>
                                        <th className="px-3 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium">Last sign-in</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPresence.map(u => (
                                        <tr key={u.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025]">
                                            <td className="px-6 py-3.5">
                                                <Link href={`/team/${u.id}`} className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <Avatar src={u.image} alt={u.name} fallback={initialsOf(u.name)} className="h-9 w-9 text-xs" />
                                                        <span className={cn('absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-[#0B0E14]', u.isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600')} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-100 hover:text-blue-200">{u.name}</p>
                                                        <p className="text-xs text-slate-500">{u.email}</p>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-3 py-3.5"><Badge tone={roleTone(u.role)}>{humanize(u.role)}</Badge></td>
                                            <td className="px-3 py-3.5">{u.isOnline ? <Badge tone="emerald" dot>Online</Badge> : <Badge tone="slate">Offline</Badge>}</td>
                                            <td className="px-6 py-3.5">
                                                {u.lastLogin
                                                    ? <div><p className="text-slate-200">{new Date(u.lastLogin).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p><p className="text-xs text-slate-500">{timeAgo(u.lastLogin)}</p></div>
                                                    : <Badge tone="amber">Never</Badge>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredPresence.length === 0 && <EmptyState icon={Users} title="No one matches" description="Try a different search." />}
                    </Card>
                </div>
            )}
        </div>
    );
}
