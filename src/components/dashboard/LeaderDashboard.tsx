"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    IndianRupee, Handshake, FileSignature, FileCheck2, Users, ListTodo, CheckCircle2, XCircle, Target,
    BarChart3, Layers, TrendingUp, TrendingDown, Minus, Download, Plus, Search, Award, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadCsv, todayStamp } from '@/lib/csv';
import { useToast } from '@/context/ToastContext';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/Progress';
import { humanize, roleTone } from '@/components/ui/tones';
import DashboardAISummary from './DashboardAISummary';
import ManagerFocus from './ManagerFocus';
import { BarList, Card, CardHeader, DashboardError, DashboardSkeleton, SectionLink, firstName, greeting, timeAgo, todayLabel } from './widgets';

type Variant = 'MANAGER' | 'TEAM_LEADER';

interface Approval { id: string; title: string; submittedBy: string; amount: string; type: string }
interface TeamMember {
    id: string; name: string; email: string; role: string; image: string | null;
    performanceScore: number; performanceTrend: 'UP' | 'DOWN' | 'NEUTRAL'; activeTasks: number; rank: number | null;
    memberSpaces?: { id: string; name: string; color: string }[];
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function LeaderDashboard({ variant }: { variant: Variant }) {
    const router = useRouter();
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [dash, setDash] = useState<any>(null);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [departments, setDepartments] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);

    const isManager = variant === 'MANAGER';
    const myId = (session?.user as any)?.id;

    const load = useCallback(async () => {
        setError(null);
        try {
            const [dashRes, teamRes] = await Promise.all([
                fetch(isManager ? '/api/dashboard/manager' : '/api/dashboard/team-leader'),
                fetch('/api/team'),
            ]);
            if (!dashRes.ok) throw new Error('The dashboard service returned an error.');
            setDash(await dashRes.json());
            if (teamRes.ok) {
                const t = await teamRes.json();
                setTeam(t.users || []);
                setDepartments(t.meta?.departments || {});
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [isManager]);

    useEffect(() => { load(); }, [load]);

    const members = useMemo(() => team.filter(m => m.id !== myId), [team, myId]);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return members.filter(m => !q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
    }, [members, query]);

    const decide = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        setBusyId(id);
        try {
            const res = await fetch(`/api/expenses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
            if (!res.ok) throw new Error();
            showToast(status === 'APPROVED' ? 'Expense approved' : 'Expense rejected', status === 'APPROVED' ? 'success' : 'info');
            setDash((prev: any) => ({ ...prev, pendingApprovals: prev.pendingApprovals.filter((a: Approval) => a.id !== id) }));
        } catch {
            showToast('Could not update the expense', 'error');
        } finally {
            setBusyId(null);
        }
    };

    if (isLoading) return <DashboardSkeleton />;
    if (error || !dash) return <DashboardError message={error || undefined} onRetry={load} />;

    const stats = dash.stats || {};
    const approvals: Approval[] = dash.pendingApprovals || [];
    const topMembers = [...members].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5);
    const totalOpenTasks = members.reduce((sum, m) => sum + (m.activeTasks || 0), 0);

    const exportTeam = () => downloadCsv(`team-${todayStamp()}`, members.map(m => ({
        Name: m.name, Email: m.email, Role: humanize(m.role), 'Performance score': m.performanceScore, Trend: humanize(m.performanceTrend), 'Assigned tasks': m.activeTasks,
        Departments: (m.memberSpaces || []).map(s => s.name).join('; '),
    })));

    return (
        <div className="space-y-6">
            <PageHeader
                hideTitleOnPhone
                eyebrow={`${isManager ? 'Manager' : 'Team leader'} overview · ${todayLabel()}`}
                title={<>{greeting()}, {firstName(session?.user?.name)}</>}
                description={isManager ? 'Your departments, projects and team at a glance.' : 'Your team’s reports, deadlines and workload at a glance.'}
                actions={
                    <>
                        <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={exportTeam} disabled={members.length === 0}>Export team</Button>
                        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => router.push('/tasks?new=1')}>Assign task</Button>
                    </>
                }
            />

            <DashboardAISummary role={isManager ? 'Manager' : 'Team Leader'} contextData={stats} />

            <ManagerFocus dash={dash} variant={variant} />

            <section className="grid gap-5 xl:grid-cols-3">
                <Card delay={0.3} padding="none" className="overflow-hidden xl:col-span-2">
                    <div className="p-6 pb-4">
                        <CardHeader
                            title="Your team"
                            description={`${members.length} people reporting to you`}
                            action={<Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search people" leftIcon={<Search />} containerClassName="w-56" />}
                        />
                    </div>
                    {filtered.length === 0
                        ? <EmptyState icon={Users} title={query ? 'No one matches' : 'No team members yet'} description={query ? 'Try a different name.' : 'People who report to you will appear here.'} />
                        : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[620px] text-sm">
                                    <thead>
                                        <tr className="border-y border-white/[0.06] bg-white/[0.02] text-left text-xs font-medium text-zinc-500">
                                            <th className="px-6 py-3 font-medium">Member</th>
                                            <th className="px-3 py-3 font-medium">Role</th>
                                            <th className="px-3 py-3 text-right font-medium">Tasks</th>
                                            <th className="px-3 py-3 font-medium">Performance</th>
                                            <th className="px-6 py-3 font-medium">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(m => (
                                            <tr key={m.id} onClick={() => router.push(`/team/${m.id}`)} className="cursor-pointer border-b border-white/[0.04] transition last:border-0 hover:bg-white/[0.025]">
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar src={m.image} alt={m.name} fallback={initialsOf(m.name)} className="h-9 w-9 text-xs" />
                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold text-zinc-100">{m.name}</p>
                                                            <p className="truncate text-xs text-zinc-500">{m.memberSpaces?.map(s => s.name).join(', ') || m.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3.5"><Badge tone={roleTone(m.role)}>{humanize(m.role)}</Badge></td>
                                                <td className="px-3 py-3.5 text-right font-semibold text-zinc-200 tabular-nums">{m.activeTasks}</td>
                                                <td className="px-3 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <ProgressBar value={m.performanceScore} className="w-24" />
                                                        <span className="w-9 text-xs font-semibold text-zinc-300 tabular-nums">{m.performanceScore || '–'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    {m.performanceTrend === 'UP' && <Badge tone="emerald" icon={<TrendingUp />}>Improving</Badge>}
                                                    {m.performanceTrend === 'DOWN' && <Badge tone="rose" icon={<TrendingDown />}>Declining</Badge>}
                                                    {m.performanceTrend === 'NEUTRAL' && <Badge tone="slate" icon={<Minus />}>Steady</Badge>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                </Card>

                <Card delay={0.35} padding="lg">
                    <CardHeader title="Approvals" description={`${approvals.length} expense${approvals.length === 1 ? '' : 's'} waiting`} />
                    {approvals.length === 0
                        ? <EmptyState icon={CheckCircle2} title="Nothing to approve" description="Expense requests from your team will show up here." className="py-8" />
                        : (
                            <ul className="mt-4 space-y-3">
                                {approvals.map(a => (
                                    <li key={a.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-zinc-100">{a.title}</p>
                                                <p className="text-xs text-zinc-500">{a.submittedBy}</p>
                                            </div>
                                            <span className="shrink-0 font-display text-base font-semibold text-white">{a.amount}</span>
                                        </div>
                                        {isManager ? (
                                            <div className="mt-3 flex gap-2">
                                                <Button size="sm" variant="success" className="flex-1" isLoading={busyId === a.id} leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => decide(a.id, 'APPROVED')}>Approve</Button>
                                                <Button size="sm" variant="secondary" className="flex-1" disabled={busyId === a.id} leftIcon={<XCircle className="h-3.5 w-3.5" />} onClick={() => decide(a.id, 'REJECTED')}>Reject</Button>
                                            </div>
                                        ) : (
                                            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-300"><Clock className="h-3.5 w-3.5" />Waiting for a manager to approve</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                </Card>
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
                <Card delay={0.4} padding="lg">
                    <CardHeader title="Top performers" description="Average weekly performance score" action={<SectionLink href="/reports/performance">All</SectionLink>} />
                    {topMembers.filter(m => m.performanceScore > 0).length === 0
                        ? <EmptyState icon={Award} title="No scores yet" description="Scores appear once weekly reports are reviewed." className="py-8" />
                        : <div className="mt-5"><BarList items={topMembers.filter(m => m.performanceScore > 0).map(m => ({ label: m.name, value: m.performanceScore, tone: 'violet' as const, href: `/team/${m.id}` }))} /></div>}
                </Card>

                {isManager ? (
                    <Card delay={0.45} padding="lg">
                        <CardHeader title="Recently completed" description="Closed in the last 30 days" action={<SectionLink href="/milestones">All</SectionLink>} />
                        {(dash.recentMilestones || []).length === 0
                            ? <EmptyState icon={Target} title="No completed milestones" description="Closed milestones will be listed here." className="py-8" />
                            : (
                                <ul className="mt-4 space-y-2">
                                    {dash.recentMilestones.slice(0, 5).map((m: any) => (
                                        <li key={m.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.03]">
                                            <Avatar src={m.ownerImage} alt={m.ownerName} fallback={initialsOf(m.ownerName)} className="h-9 w-9 text-xs" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-zinc-100">{m.title}</p>
                                                <p className="truncate text-xs text-zinc-500">{m.ownerName} · {humanize(m.category)}</p>
                                            </div>
                                            <span className="shrink-0 text-xs text-zinc-500">{timeAgo(m.completedAt)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                    </Card>
                ) : (
                    <Card delay={0.45} padding="lg">
                        <CardHeader title="Workload" description="Tasks assigned per person" action={<SectionLink href="/tasks">Tasks</SectionLink>} />
                        <div className="mt-5"><BarList items={[...members].sort((a, b) => b.activeTasks - a.activeTasks).slice(0, 6).map(m => ({ label: m.name, value: m.activeTasks, tone: m.activeTasks > 8 ? 'rose' as const : 'blue' as const }))} emptyText="No team members yet" /></div>
                    </Card>
                )}

                <Card delay={0.5} padding="lg">
                    <CardHeader title={isManager ? 'Departments' : 'Shortcuts'} description={isManager ? 'People per department' : 'Where your team works'} />
                    {isManager && Object.keys(departments).length > 0 && (
                        <div className="mt-5"><BarList items={Object.entries(departments).map(([label, value]) => ({ label, value, tone: 'cyan' as const }))} /></div>
                    )}
                    <div className="mt-5 grid grid-cols-2 gap-2">
                        {[
                            { label: 'Team', href: '/team', icon: Users, tone: 'text-violet-300 bg-violet-500/15' },
                            { label: 'Team reports', href: '/reports?activeTab=TEAM', icon: FileCheck2, tone: 'text-blue-300 bg-blue-500/15' },
                            { label: 'Performance', href: '/reports/performance', icon: BarChart3, tone: 'text-emerald-300 bg-emerald-500/15' },
                            isManager
                                ? { label: 'Milestones', href: '/milestones', icon: Target, tone: 'text-amber-300 bg-amber-500/15' }
                                : { label: 'Milestones', href: '/milestones', icon: Target, tone: 'text-amber-300 bg-amber-500/15' },
                        ].map(link => (
                            <Link key={link.href} href={link.href} className="flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5 transition hover:border-white/[0.1] hover:bg-white/[0.05]">
                                <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', link.tone)}><link.icon className="h-4 w-4" /></span>
                                <span className="truncate text-sm font-medium text-zinc-200">{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </Card>
            </section>
        </div>
    );
}
