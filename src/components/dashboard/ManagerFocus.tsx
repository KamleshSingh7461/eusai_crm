"use client";

import React from 'react';
import Link from 'next/link';
import { differenceInCalendarDays, format } from 'date-fns';
import { AlertTriangle, Briefcase, CalendarClock, CheckCircle2, ClipboardCheck, FileWarning, Handshake, IndianRupee, ListTodo, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/Progress';
import { humanize, statusTone } from '@/components/ui/tones';
import { Card, CardHeader, SectionLink } from './widgets';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const PRIORITY: Record<number, { label: string; tone: 'rose' | 'amber' | 'slate' }> = { 3: { label: 'High', tone: 'rose' }, 2: { label: 'Medium', tone: 'amber' }, 1: { label: 'Low', tone: 'slate' } };

function dueLabel(date: string) {
    const days = differenceInCalendarDays(new Date(date), new Date());
    if (days < 0) return { text: `${-days} day${days === -1 ? '' : 's'} late`, late: true };
    if (days === 0) return { text: 'Due today', late: false };
    if (days === 1) return { text: 'Tomorrow', late: false };
    return { text: format(new Date(date), 'd MMM'), late: false };
}

/** The manager's "what needs me today" block: report compliance, overdue work, milestones and projects. */
export default function ManagerFocus({ dash, variant = 'MANAGER' }: { dash: any; variant?: 'MANAGER' | 'TEAM_LEADER' }) {
    const isManager = variant === 'MANAGER';
    const s = dash.stats || {};
    const missing: any[] = dash.missingReports || [];
    const overdue: any[] = dash.overdueTasks || [];
    const milestones: any[] = dash.upcomingMilestones || [];
    const projects: any[] = dash.projects || [];
    const expected = s.reportsExpected || 0;

    return (
        <>
            <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                {dash.todayOff ? (
                    <StatCard label="Daily reports today" value="Day off" icon={ClipboardCheck} tone="slate"
                        note={`No report due · ${dash.todayOff}`} href="/holidays" />
                ) : (
                    <StatCard label="Daily reports today" value={`${s.reportsSubmitted || 0}/${expected}`} icon={ClipboardCheck}
                        tone={expected && s.reportsSubmitted >= expected ? 'emerald' : 'amber'}
                        note={missing.length ? `${missing.length} not submitted yet` : 'Everyone has reported'} href="/reports?activeTab=TEAM" />
                )}
                <StatCard label="Overdue tasks" value={s.overdueTasks || 0} icon={AlertTriangle} tone={s.overdueTasks ? 'rose' : 'emerald'}
                    note={`${s.openTasks || 0} open across your team`} href="/tasks?filter=overdue" />
                <StatCard label="Due this week" value={s.dueThisWeek || 0} icon={CalendarClock} tone="blue"
                    note={`${s.completedThisWeek || 0} completed · ${dash.workingDaysThisWeek ?? 5} working day${dash.workingDaysThisWeek === 1 ? '' : 's'}${dash.holidaysThisWeek?.length ? ` (${dash.holidaysThisWeek.join(', ')})` : ''}`} href="/tasks" />
                <StatCard label="Milestones at risk" value={s.atRiskMilestones || 0} icon={Target} tone={s.atRiskMilestones ? 'amber' : 'emerald'}
                    note="Delayed, flagged or past target" href="/milestones" />
            </section>

            {missing.length > 0 && (
                <Card padding="none" className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20"><FileWarning className="h-[18px] w-[18px]" /></span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">{missing.length} of {expected} haven’t submitted today’s report</p>
                        <p className="text-[13px] text-zinc-500">The submission window is 5:00 PM to 11:59 PM IST.</p>
                    </div>
                    <div className="hidden items-center sm:flex">
                        <div className="flex -space-x-2">
                            {missing.slice(0, 6).map(m => (
                                <Link key={m.id} href={`/team/${m.id}`} title={m.name} className="rounded-full ring-2 ring-[#111113]">
                                    <Avatar src={m.image} alt={m.name} fallback={initialsOf(m.name)} className="h-8 w-8 text-[11px]" />
                                </Link>
                            ))}
                        </div>
                        {missing.length > 6 && <span className="ml-2 text-xs text-zinc-500">+{missing.length - 6}</span>}
                    </div>
                    <Link href="/reports?activeTab=TEAM" className="rounded-lg border border-[#2F2F35] bg-[#18181B] px-3 py-1.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-[#1F1F23]">Team reports</Link>
                </Card>
            )}

            <section className="grid gap-5 xl:grid-cols-3">
                <Card padding="none" className="overflow-hidden xl:col-span-2">
                    <div className="p-5 pb-3">
                        <CardHeader title="Needs attention" description="Your team’s overdue tasks, oldest first" action={<SectionLink href="/tasks?filter=overdue">All overdue</SectionLink>} />
                    </div>
                    {overdue.length === 0
                        ? <EmptyState icon={CheckCircle2} title="Nothing overdue" description="Every task on your team is on schedule." className="py-10" />
                        : (
                            <ul className="divide-y divide-[#232327] border-t border-[#232327]">
                                {overdue.map(t => {
                                    const due = dueLabel(t.deadline);
                                    const p = PRIORITY[t.priority] || PRIORITY[1];
                                    return (
                                        <li key={t.id}>
                                            <Link href={`/tasks?taskId=${t.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#18181B]">
                                                <Avatar src={t.assigneeImage} alt={t.assignee || ''} fallback={initialsOf(t.assignee)} className="h-8 w-8 shrink-0 text-[11px]" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-zinc-100">{t.title}</p>
                                                    <p className="truncate text-xs text-zinc-500">{t.assignee || 'Unassigned'}{t.project ? ` · ${t.project}` : ''}</p>
                                                </div>
                                                <Badge tone={p.tone} className="hidden sm:inline-flex">{p.label}</Badge>
                                                <span className={cn('w-20 shrink-0 text-right text-xs font-medium', due.late ? 'text-rose-400' : 'text-zinc-400')}>{due.text}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                </Card>

                <Card padding="lg">
                    <CardHeader title="Upcoming milestones" description="Overdue or due in the next 14 days" action={<SectionLink href="/milestones">All</SectionLink>} />
                    {milestones.length === 0
                        ? <EmptyState icon={Target} title="Nothing due soon" description="Milestones due in the next two weeks appear here." className="py-8" />
                        : (
                            <ul className="mt-4 space-y-3">
                                {milestones.map(m => {
                                    const due = dueLabel(m.targetDate);
                                    return (
                                        <li key={m.id}>
                                            <Link href={`/milestones?milestoneId=${m.id}`} className="block rounded-lg p-2 -m-2 transition-colors hover:bg-[#18181B]">
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="min-w-0 truncate text-sm font-medium text-zinc-100">{m.title}</p>
                                                    <span className={cn('shrink-0 text-xs font-medium', due.late || m.atRisk ? 'text-rose-400' : 'text-zinc-400')}>{due.text}</span>
                                                </div>
                                                <p className="mt-0.5 truncate text-xs text-zinc-500">{m.ownerName}{m.university ? ` · ${m.university}` : ''} · {humanize(m.category)}</p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <ProgressBar value={m.progress} tone={m.atRisk ? 'rose' : 'blue'} className="flex-1" />
                                                    <span className="w-8 text-right text-xs tabular-nums text-zinc-400">{m.progress}%</span>
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                </Card>
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
                <Card padding="none" className="overflow-hidden xl:col-span-2">
                    <div className="p-5 pb-3">
                        <CardHeader title={isManager ? 'Your projects' : 'Team projects'} description={`${s.activeProjects || 0} active · most behind first`} action={<SectionLink href="/projects">All projects</SectionLink>} />
                    </div>
                    {projects.length === 0
                        ? <EmptyState icon={Briefcase} title="No active projects" description={isManager ? 'Projects you manage, or that sit in your departments, appear here.' : 'Projects where your team has open work appear here.'} className="py-10" />
                        : (
                            <div className="overflow-x-auto border-t border-[#232327]">
                                <table className="w-full min-w-[560px] text-sm">
                                    <thead>
                                        <tr className="border-b border-[#232327] text-left text-xs text-zinc-500">
                                            <th className="px-5 py-2.5 font-medium">Project</th>
                                            <th className="px-3 py-2.5 font-medium">Status</th>
                                            <th className="px-3 py-2.5 font-medium">Progress</th>
                                            <th className="px-3 py-2.5 text-right font-medium">Open</th>
                                            <th className="px-5 py-2.5 text-right font-medium">Overdue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#232327]">
                                        {projects.map(p => (
                                            <tr key={p.id} className="transition-colors hover:bg-[#18181B]">
                                                <td className="px-5 py-3">
                                                    <Link href={`/projects/${p.id}`} className="font-medium text-zinc-100 hover:underline">{p.name}</Link>
                                                    <p className="text-xs text-zinc-500">Ends {format(new Date(p.endDate), 'd MMM yyyy')}</p>
                                                </td>
                                                <td className="px-3 py-3"><Badge tone={statusTone(p.status)}>{humanize(p.status)}</Badge></td>
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <ProgressBar value={p.progress} className="w-24" />
                                                        <span className="text-xs tabular-nums text-zinc-400">{p.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums text-zinc-300">{p.openTasks}</td>
                                                <td className={cn('px-5 py-3 text-right tabular-nums', p.overdue ? 'font-medium text-rose-400' : 'text-zinc-500')}>{p.overdue}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                </Card>

                <Card padding="lg">
                    <CardHeader title="Business" description="Partnerships across your team" />
                    <dl className="mt-4 divide-y divide-[#232327]">
                        {[
                            { label: 'Revenue from paid orders', value: inr(s.revenue || 0), icon: IndianRupee, href: '/milestones' },
                            { label: 'Active MOUs', value: s.activeMOUs || 0, icon: Handshake, href: '/milestones' },
                            { label: 'Open issues', value: `${s.openIssues || 0}${s.criticalIssues ? ` · ${s.criticalIssues} high` : ''}`, icon: AlertTriangle, href: '/issues' },
                            { label: 'Open tasks', value: s.openTasks || 0, icon: ListTodo, href: '/tasks' },
                        ].map(row => (
                            <Link key={row.label} href={row.href} className="flex items-center gap-3 py-2.5 transition-colors hover:text-white">
                                <row.icon className="h-4 w-4 text-zinc-500" />
                                <dt className="flex-1 text-sm text-zinc-400">{row.label}</dt>
                                <dd className="text-sm font-semibold tabular-nums text-zinc-100">{row.value}</dd>
                            </Link>
                        ))}
                    </dl>
                </Card>
            </section>
        </>
    );
}
