"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import {
    CheckCircle2, Flame, AlertCircle, Target, FileText, GraduationCap, IndianRupee,
    Clock, PlayCircle, ArrowUpRight, CalendarDays, Send,
    CalendarOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Badge, { StatusPill } from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/ui/EmptyState';
import { ProgressBar, ProgressRing } from '@/components/ui/Progress';
import { humanize } from '@/components/ui/tones';
import ExpenseModal from '@/components/modals/ExpenseModal';
import TaskDetailModal from '@/components/modals/TaskDetailModal';
import { isReportWindowOpen } from '@/lib/reportWindow';
import { Card, CardHeader, DashboardError, DashboardSkeleton, firstName, greeting, todayLabel } from './widgets';

interface DashboardData {
    hasSubmittedReport: boolean;
    /** set on weekends and holidays: no report is due today */
    todayOff?: string | null;
    reportSubmissionTime: string | null;
    kpi: { efficiencyScore: number; streak: number; overdueMissions: number; activeMilestones: number; completedMilestones: number };
    milestones: any[];
    recentTasks: any[];
    pendingExpenses: any[];
}

const PRIORITY: Record<number, { label: string; tone: 'rose' | 'amber' | 'slate' }> = {
    3: { label: 'High', tone: 'rose' }, 2: { label: 'Medium', tone: 'amber' }, 1: { label: 'Low', tone: 'slate' },
};

export default function EmployeeDashboard() {
    const { data: session } = useSession();
    const router = useRouter();
    const { showToast } = useToast();
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [section, setSection] = useState<'tasks' | 'milestones'>('tasks');
    const [expenseOpen, setExpenseOpen] = useState(false);
    const [startingId, setStartingId] = useState<string | null>(null);
    const [openTask, setOpenTask] = useState<any | null>(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const res = await fetch('/api/dashboard/employee');
            if (!res.ok) throw new Error('The dashboard service returned an error.');
            setData(await res.json());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const startTask = async (taskId: string) => {
        setStartingId(taskId);
        try {
            const res = await fetch(`/api/tasks/${taskId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'IN_PROGRESS' }) });
            if (!res.ok) throw new Error();
            showToast('Task moved to in progress', 'success');
            load();
        } catch {
            showToast('Could not update the task', 'error');
        } finally {
            setStartingId(null);
        }
    };

    if (isLoading) return <DashboardSkeleton />;
    if (error || !data) return <DashboardError message={error || undefined} onRetry={load} />;

    const { kpi } = data;
    const totalMilestones = kpi.activeMilestones + kpi.completedMilestones;
    // "Due now" once the IST submission window has opened
    const isLate = isReportWindowOpen();

    return (
        <div className="space-y-6">
            <PageHeader
                hideTitleOnPhone
                eyebrow={todayLabel()}
                title={<>{greeting()}, {firstName(session?.user?.name)}</>}
                description="Your work, deadlines and progress at a glance."
                actions={
                    <>
                        <Button variant="secondary" leftIcon={<IndianRupee className="h-4 w-4" />} onClick={() => setExpenseOpen(true)}>Expense request</Button>
                        <Button leftIcon={<FileText className="h-4 w-4" />} onClick={() => router.push('/reports/submit')}>
                            {data.hasSubmittedReport ? 'Update report' : 'Submit report'}
                        </Button>
                    </>
                }
            />

            {!data.hasSubmittedReport && data.todayOff ? (
            <Card delay={0.05} padding="none" className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 ring-1 ring-inset ring-zinc-700/70"><CalendarOff className="h-5 w-5" /></span>
                <div className="min-w-[200px] flex-1">
                    <p className="text-sm font-semibold text-white">No report due today · {data.todayOff}</p>
                    <p className="text-sm text-zinc-400">Enjoy the day off. Your {kpi.streak}-day streak is safe. If you worked, you can still submit a report.</p>
                </div>
                <Button size="sm" variant="secondary" leftIcon={<Send className="h-3.5 w-3.5" />} onClick={() => router.push('/reports/submit')}>Submit anyway</Button>
            </Card>
            ) : (
            <Card delay={0.05} padding="none" className={cn('flex flex-wrap items-center gap-4 px-5 py-4',
                data.hasSubmittedReport ? 'border-emerald-400/20  bg-emerald-500/[0.1] '
                    : isLate ? 'border-rose-400/20  bg-rose-500/[0.12] ' : 'border-blue-400/20  bg-blue-500/[0.12] ')}>
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset',
                    data.hasSubmittedReport ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25' : isLate ? 'bg-rose-500/15 text-rose-300 ring-rose-400/25' : 'bg-blue-500/15 text-blue-300 ring-blue-400/25')}>
                    {data.hasSubmittedReport ? <CheckCircle2 className="h-5 w-5" /> : isLate ? <AlertCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                </span>
                <div className="min-w-[200px] flex-1">
                    <p className="text-sm font-semibold text-white">
                        {data.hasSubmittedReport ? "Today's report is submitted" : isLate ? "Today's report is due now" : "Today's report is still pending"}
                    </p>
                    <p className="text-sm text-zinc-400">
                        {data.hasSubmittedReport && data.reportSubmissionTime
                            ? `Sent at ${format(new Date(data.reportSubmissionTime), 'h:mm a')}. Keep your ${kpi.streak}-day streak going tomorrow.`
                            : 'Submit between 5:00 PM and 11:59 PM IST.'}
                    </p>
                </div>
                {!data.hasSubmittedReport && <Button size="sm" variant={isLate ? 'danger' : 'primary'} leftIcon={<Send className="h-3.5 w-3.5" />} onClick={() => router.push('/reports/submit')}>Submit now</Button>}
            </Card>
            )}

            <section className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
                <StatCard delay={0.1} label="Completion rate" value={`${kpi.efficiencyScore}%`} icon={CheckCircle2}
                    tone={kpi.efficiencyScore >= 80 ? 'emerald' : kpi.efficiencyScore >= 60 ? 'amber' : 'rose'} note="Tasks done, last 30 days" href="/tasks" />
                <StatCard delay={0.15} label="Report streak" value={kpi.streak} icon={Flame} tone="amber" note={kpi.streak === 1 ? 'day in a row' : 'days in a row'} href="/reports" />
                <StatCard delay={0.2} label="Overdue" value={kpi.overdueMissions} icon={AlertCircle} tone={kpi.overdueMissions > 0 ? 'rose' : 'emerald'}
                    note={kpi.overdueMissions > 0 ? 'Tasks and milestones past due' : "You're fully up to date"} href="/tasks" />
                <StatCard delay={0.25} label="Active milestones" value={kpi.activeMilestones} icon={Target} tone="violet" note={`${kpi.completedMilestones} completed`} href="/milestones" />
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
                <div className="space-y-4 xl:col-span-2">
                    <Tabs value={section} onChange={id => setSection(id as any)} items={[
                        { id: 'tasks', label: 'My tasks', icon: CheckCircle2, count: data.recentTasks.length },
                        { id: 'milestones', label: 'My milestones', icon: Target, count: data.milestones.length },
                    ]} />

                    {section === 'tasks' && (
                        <Card padding="none" className="overflow-hidden">
                            {data.recentTasks.length === 0
                                ? <EmptyState icon={CheckCircle2} title="You're all caught up" description="New tasks assigned to you will appear here." />
                                : (
                                    <ul className="divide-y divide-white/[0.05]">
                                        {data.recentTasks.map((task: any) => {
                                            const overdue = isPast(new Date(task.deadline));
                                            const priority = PRIORITY[task.priority] || PRIORITY[1];
                                            return (
                                                <li key={task.id} className="group flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-white/[0.025]">
                                                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                                                        task.status === 'IN_PROGRESS' ? 'bg-blue-500/15 text-blue-300 ring-blue-400/25' : 'bg-white/[0.04] text-zinc-400 ring-white/10')}>
                                                        {task.status === 'IN_PROGRESS' ? <PlayCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-zinc-100">{task.title}</p>
                                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                                            {task.project?.name && <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-zinc-300">{task.project.name}</span>}
                                                            <span className={cn('flex items-center gap-1', overdue && 'text-rose-300')}>
                                                                <CalendarDays className="h-3.5 w-3.5" />
                                                                {overdue ? 'Overdue ' : 'Due '}{formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Badge tone={priority.tone}>{priority.label}</Badge>
                                                    <StatusPill status={task.status} />
                                                    <div className="flex gap-2">
                                                        {task.status === 'TODO' && (
                                                            <Button size="sm" variant="secondary" isLoading={startingId === task.id} leftIcon={<PlayCircle className="h-3.5 w-3.5" />} onClick={() => startTask(task.id)}>Start</Button>
                                                        )}
                                                        <Button size="sm" variant="ghost" rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />} onClick={() => setOpenTask(task)}>Open</Button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                        </Card>
                    )}

                    {section === 'milestones' && (
                        data.milestones.length === 0
                            ? <Card><EmptyState icon={Target} title="No milestones assigned" description="Milestones you own will appear here." /></Card>
                            : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {data.milestones.map((m: any, i: number) => (
                                        <Card key={m.id} delay={i * 0.03} interactive onClick={() => router.push('/milestones')}>
                                            <div className="flex items-center justify-between gap-2">
                                                <Badge tone="violet" icon={<Target />}>{humanize(m.category)}</Badge>
                                                <StatusPill status={m.status} />
                                            </div>
                                            <p className="mt-4 font-semibold text-white">{m.title}</p>
                                            <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                                                <GraduationCap className="h-3.5 w-3.5" />{m.university?.name || m.project?.name || 'General'}
                                                <span>·</span>
                                                <CalendarDays className="h-3.5 w-3.5" />{format(new Date(m.targetDate), 'd MMM yyyy')}
                                            </p>
                                            <div className="mt-4 flex items-center justify-between text-xs">
                                                <span className="text-zinc-400">Progress</span>
                                                <span className="font-semibold text-zinc-200 tabular-nums">{m.progress}%</span>
                                            </div>
                                            <ProgressBar value={m.progress} tone="blue" className="mt-2 h-2" glow />
                                        </Card>
                                    ))}
                                </div>
                            )
                    )}
                </div>

                <div className="space-y-5">
                    <Card delay={0.3} padding="lg">
                        <CardHeader title="Milestone completion" description={`${kpi.completedMilestones} of ${totalMilestones} done`} />
                        <div className="mt-5 flex justify-center">
                            <ProgressRing value={totalMilestones ? (kpi.completedMilestones / totalMilestones) * 100 : 0} size={140} stroke={12} label="complete" from="#A78BFA" to="#60A5FA" />
                        </div>
                    </Card>

                    <Card delay={0.4} padding="lg">
                        <CardHeader title="Expense requests" description="Waiting for approval"
                            action={<Button size="sm" variant="secondary" onClick={() => setExpenseOpen(true)}>New</Button>} />
                        {data.pendingExpenses.length === 0
                            ? <p className="mt-4 text-sm text-zinc-500">Nothing waiting for approval.</p>
                            : (
                                <ul className="mt-4 space-y-3">
                                    {data.pendingExpenses.map((e: any) => (
                                        <li key={e.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300"><IndianRupee className="h-4 w-4" /></span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-zinc-100">{e.description || humanize(e.category)}</p>
                                                <p className="truncate text-xs text-zinc-500">{e.project?.name}</p>
                                            </div>
                                            <span className="text-sm font-semibold text-white tabular-nums">₹{Number(e.amount).toLocaleString('en-IN')}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                    </Card>
                </div>
            </section>

            <TaskDetailModal isOpen={!!openTask} onClose={() => setOpenTask(null)} onDelete={load} task={openTask} />
            <ExpenseModal open={expenseOpen} onClose={() => setExpenseOpen(false)} onCreated={load} />
        </div>
    );
}
