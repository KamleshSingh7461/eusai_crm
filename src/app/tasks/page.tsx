"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, isPast } from 'date-fns';
import {
    CheckSquare, Plus, TrendingUp, AlertCircle, Target, BarChart3, Search, CheckCircle2, Briefcase,
    Trash2, Eye, PlayCircle, LayoutList, Columns3, CalendarDays, Download, X, ChevronRight, BellRing
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadCsv, todayStamp } from '@/lib/csv';
import { useToast } from '@/context/ToastContext';
import NewTaskModal from '@/components/modals/NewTaskModal';
import TaskDetailModal from '@/components/modals/TaskDetailModal';
import CompletionModal from '@/components/modals/CompletionModal';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import Badge, { StatusPill } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import Select from '@/components/ui/Select';
import StatCard from '@/components/ui/StatCard';
import Tabs from '@/components/ui/Tabs';
import { ProgressBar } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { humanize, roleTone } from '@/components/ui/tones';

interface Task {
    id: string;
    title: string;
    description: string;
    deadline: string;
    status: string;
    priority: number;
    projectId?: string;
    userId?: string;
    category?: string;
    project?: { id: string; name: string };
    assignedTo?: { id: string; name: string; role: string; email: string };
    updatedAt: string;
}

interface Analytics {
    overview: { total: number; completed: number; overdue: number; highPriority: number; velocity: number; completedThisWeek: number };
    teamPerformance?: { id: string; name: string; role: string; total: number; completed: number; overdue: number; highPriority: number }[];
}

const DEFAULT_FILTERS = { priority: 'all', role: 'all', status: 'all', overdueOnly: false, assignedUser: 'all' };
const PRIORITY: Record<number, { label: string; tone: 'rose' | 'amber' | 'slate' }> = {
    3: { label: 'High', tone: 'rose' }, 2: { label: 'Medium', tone: 'amber' }, 1: { label: 'Low', tone: 'slate' },
};
const COLUMNS = [
    { id: 'TODO', label: 'To do', dot: 'bg-zinc-400' },
    { id: 'IN_PROGRESS', label: 'In progress', dot: 'bg-blue-400' },
    { id: 'REVIEW', label: 'In review', dot: 'bg-amber-400' },
    { id: 'DONE', label: 'Done', dot: 'bg-emerald-400' },
];

const isOverdue = (t: Task) => !!t.deadline && isPast(new Date(t.deadline)) && t.status !== 'DONE';

function TasksContent() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const router = useRouter();
    const params = useSearchParams();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [view, setView] = useState<'list' | 'board'>('list');
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;
    const isDirector = userRole === 'DIRECTOR' || userRole === 'MANAGEMENT';
    const canAssign = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);
    const isLeader = canAssign || userRole === 'MANAGEMENT';

    const fetchData = useCallback(async () => {
        try {
            const tasksResponse = await fetch('/api/tasks');
            if (tasksResponse.ok) setTasks((await tasksResponse.json()).tasks || []);
            if (isLeader) {
                const analyticsResponse = await fetch('/api/tasks/analytics');
                if (analyticsResponse.ok) setAnalytics(await analyticsResponse.json());
            }
        } catch {
            showToast('Could not load tasks', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [isLeader, showToast]);

    useEffect(() => { if (session) fetchData(); }, [session, fetchData]);

    // Deep links from the dashboards: ?filter=overdue narrows the list, ?taskId=<id> opens that task.
    useEffect(() => {
        if (params.get('filter') === 'overdue') setFilters({ ...DEFAULT_FILTERS, overdueOnly: true });
    }, [params]);

    useEffect(() => {
        const id = params.get('taskId');
        if (!id || tasks.length === 0) return;
        const task = tasks.find(t => t.id === id);
        if (task) setSelectedTaskForDetail(task);
    }, [params, tasks]);

    // /tasks?new=1 (from the Create menu) opens the new-task dialog.
    useEffect(() => {
        if (params.get('new') === '1' && canAssign) {
            setIsNewTaskModalOpen(true);
            router.replace('/tasks');
        }
    }, [params, canAssign, router]);

    useEffect(() => {
        try { const saved = localStorage.getItem('eusai-task-view'); if (saved === 'board' || saved === 'list') setView(saved); } catch { }
    }, []);
    const changeView = (v: 'list' | 'board') => {
        setView(v);
        try { localStorage.setItem('eusai-task-view', v); } catch { }
    };

    const filteredTasks = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return tasks.filter(task =>
            (!query || task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query)
                || task.project?.name?.toLowerCase().includes(query) || task.assignedTo?.name?.toLowerCase().includes(query))
            && (filters.priority === 'all' || String(task.priority) === filters.priority)
            && (filters.role === 'all' || task.assignedTo?.role === filters.role)
            && (filters.status === 'all' || task.status === filters.status)
            && (filters.assignedUser === 'all' || task.userId === filters.assignedUser)
            && (!filters.overdueOnly || isOverdue(task))
        );
    }, [tasks, searchQuery, filters]);

    const overview = useMemo(() => {
        if (analytics?.overview) return analytics.overview;
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'DONE').length;
        const weekAgo = Date.now() - 7 * 864e5;
        return {
            total, completed,
            overdue: tasks.filter(isOverdue).length,
            highPriority: tasks.filter(t => t.priority === 3).length,
            velocity: total ? Math.round((completed / total) * 100) : 0,
            completedThisWeek: tasks.filter(t => t.status === 'DONE' && new Date(t.updatedAt).getTime() > weekAgo).length,
        };
    }, [analytics, tasks]);

    const updateStatus = async (task: Task, status: string) => {
        if (status === 'DONE') return setTaskToComplete(task);
        setBusyId(task.id);
        try {
            const res = await fetch(`/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error);
            showToast(`Moved to ${humanize(status).toLowerCase()}`, 'success');
            setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, status } : t)));
        } catch (e: any) {
            showToast(e.message || 'Could not update the task', 'error');
        } finally {
            setBusyId(null);
        }
    };

    const handleCompleteTask = async (remarks: string, proofUrl?: string) => {
        if (!taskToComplete) return;
        try {
            const res = await fetch(`/api/tasks/${taskToComplete.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DONE', completionRemark: remarks, completionProof: proofUrl })
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error);
            showToast('Task completed', 'success');
            setTaskToComplete(null);
            fetchData();
        } catch (e: any) {
            showToast(e.message || 'Could not complete the task', 'error');
        }
    };

    // Emails and push-notifies the assignee about an overdue task.
    const sendOverdueReminder = async (task: Task) => {
        setBusyId(task.id);
        try {
            const res = await fetch('/api/notifications/overdue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entityType: 'TASK', entityId: task.id }) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error);
            showToast(data.message || `Reminder sent to ${task.assignedTo?.name || 'the assignee'}`, 'success');
        } catch (e: any) {
            showToast(e.message || 'Could not send the reminder', 'error');
        } finally {
            setBusyId(null);
        }
    };

    const handleDeleteTask = async (task: Task) => {
        if (!confirm(`Delete “${task.title}”? This can't be undone.`)) return;
        try {
            const res = await fetch(`/api/tasks?id=${task.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error);
            showToast('Task deleted', 'success');
            setTasks(prev => prev.filter(t => t.id !== task.id));
        } catch (e: any) {
            showToast(e.message || 'Could not delete the task', 'error');
        }
    };

    const quickFilter = (type: 'ALL' | 'OVERDUE' | 'HIGH' | 'DONE' | 'PERSON', payload?: string) => {
        if (type === 'ALL') setFilters(DEFAULT_FILTERS);
        if (type === 'OVERDUE') setFilters({ ...DEFAULT_FILTERS, overdueOnly: true });
        if (type === 'HIGH') setFilters({ ...DEFAULT_FILTERS, priority: '3' });
        if (type === 'DONE') setFilters({ ...DEFAULT_FILTERS, status: 'DONE' });
        if (type === 'PERSON' && payload) setFilters({ ...DEFAULT_FILTERS, assignedUser: payload });
        document.getElementById('task-registry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const activeFilterCount = (filters.priority !== 'all' ? 1 : 0) + (filters.status !== 'all' ? 1 : 0) + (filters.role !== 'all' ? 1 : 0)
        + (filters.assignedUser !== 'all' ? 1 : 0) + (filters.overdueOnly ? 1 : 0);
    const personFilterName = filters.assignedUser !== 'all' ? (tasks.find(t => t.userId === filters.assignedUser)?.assignedTo?.name || 'one person') : null;

    const exportTasks = () => downloadCsv(`tasks-${todayStamp()}`, filteredTasks.map(t => ({
        Task: t.title, Status: humanize(t.status), Priority: PRIORITY[t.priority]?.label || '', Deadline: t.deadline ? format(new Date(t.deadline), 'yyyy-MM-dd') : '',
        Overdue: isOverdue(t) ? 'Yes' : 'No', Project: t.project?.name || '', Assignee: t.assignedTo?.name || '',
    })));

    const canChangeStatus = (t: Task) => t.userId === userId;

    const TaskActions = ({ t, compact }: { t: Task; compact?: boolean }) => (
        <div className="flex items-center justify-end gap-1">
            {canChangeStatus(t) && t.status === 'TODO' && (
                <Button size="sm" variant="ghost" isLoading={busyId === t.id} onClick={() => updateStatus(t, 'IN_PROGRESS')} title="Start" leftIcon={<PlayCircle className="h-4 w-4 text-blue-300" />}>{!compact && 'Start'}</Button>
            )}
            {canChangeStatus(t) && t.status !== 'DONE' && (
                <Button size="sm" variant="ghost" onClick={() => setTaskToComplete(t)} title="Mark complete" leftIcon={<CheckCircle2 className="h-4 w-4 text-emerald-300" />}>{!compact && 'Complete'}</Button>
            )}
            {canAssign && isOverdue(t) && (
                <Button size="sm" variant="ghost" isLoading={busyId === t.id} onClick={() => sendOverdueReminder(t)} title="Send overdue reminder (email and push)" aria-label="Send overdue reminder"><BellRing className="h-4 w-4 text-amber-300" /></Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setSelectedTaskForDetail(t)} title="Details" aria-label="Details"><Eye className="h-4 w-4" /></Button>
            {canAssign && (
                <Button size="sm" variant="ghost" onClick={() => handleDeleteTask(t)} title="Delete" aria-label="Delete" className="hover:text-rose-300"><Trash2 className="h-4 w-4" /></Button>
            )}
        </div>
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-20 w-1/2" />
                <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}</div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Work"
                title="Tasks"
                description={isDirector ? 'Every task across the organization.' : canAssign ? 'Your team’s tasks and delivery.' : 'Tasks assigned to you.'}
                actions={
                    <>
                        <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={exportTasks} disabled={filteredTasks.length === 0}>Export</Button>
                        {canAssign && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsNewTaskModalOpen(true)}>New task</Button>}
                    </>
                }
            />

            <section className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
                <StatCard delay={0.05} label="Completion rate" value={`${overview.velocity}%`} icon={TrendingUp} tone="blue" note={`${overview.completed} of ${overview.total} done`} onClick={() => quickFilter('ALL')} />
                <StatCard delay={0.1} label="Overdue" value={overview.overdue} icon={AlertCircle} tone={overview.overdue > 0 ? 'rose' : 'emerald'} note="Show overdue tasks" onClick={() => quickFilter('OVERDUE')} />
                <StatCard delay={0.15} label="High priority" value={overview.highPriority} icon={Target} tone="amber" note="Show high priority" onClick={() => quickFilter('HIGH')} />
                <StatCard delay={0.2} label="Done this week" value={overview.completedThisWeek} icon={BarChart3} tone="emerald" note="Show completed" onClick={() => quickFilter('DONE')} />
            </section>

            {isDirector && analytics?.teamPerformance && analytics.teamPerformance.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-display text-lg font-semibold text-white">By person</h2>
                        <span className="text-sm text-zinc-500">Click someone to see only their tasks</span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {analytics.teamPerformance.map((m, i) => {
                            const pct = m.total ? Math.round((m.completed / m.total) * 100) : 0;
                            return (
                                <Card key={m.id} delay={0.05 + i * 0.02} interactive padding="sm" onClick={() => quickFilter('PERSON', m.id)}
                                    className={cn(filters.assignedUser === m.id && 'border-blue-400/40 ring-1 ring-blue-400/30')}>
                                    <div className="flex items-center gap-3">
                                        <Avatar alt={m.name} fallback={initialsOf(m.name)} className="h-9 w-9 text-xs" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-white">{m.name}</p>
                                            <p className="text-xs text-zinc-500">{humanize(m.role)}</p>
                                        </div>
                                        <span className="font-display text-lg font-semibold text-white tabular-nums">{pct}%</span>
                                    </div>
                                    <ProgressBar value={pct} className="mt-3" />
                                    <div className="mt-3 flex items-center justify-between text-xs">
                                        <span className="text-zinc-400">{m.completed}/{m.total} done</span>
                                        <span className="flex gap-3">
                                            <span className={m.overdue > 0 ? 'text-rose-300' : 'text-zinc-600'}>{m.overdue} overdue</span>
                                            <span className={m.highPriority > 0 ? 'text-amber-300' : 'text-zinc-600'}>{m.highPriority} high</span>
                                        </span>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </section>
            )}

            <div id="task-registry" className="scroll-mt-24 space-y-4">
                <div className="glass sticky top-[72px] z-20 flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
                    <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by title, project or person" leftIcon={<Search />} containerClassName="lg:flex-1" />
                    <div className="grid grid-cols-2 gap-3 sm:flex">
                        <Select value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })} containerClassName="sm:w-40"
                            options={[{ value: 'all', label: 'Any priority' }, { value: '3', label: 'High' }, { value: '2', label: 'Medium' }, { value: '1', label: 'Low' }]} />
                        <Select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} containerClassName="sm:w-40"
                            options={[{ value: 'all', label: 'Any status' }, ...COLUMNS.map(c => ({ value: c.id, label: c.label }))]} />
                        {isDirector && (
                            <Select value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value })} containerClassName="sm:w-40"
                                options={[{ value: 'all', label: 'Any role' }, ...['MANAGER', 'TEAM_LEADER', 'EMPLOYEE', 'INTERN'].map(r => ({ value: r, label: humanize(r) }))]} />
                        )}
                    </div>
                    <Tabs size="sm" value={view} onChange={id => changeView(id as any)} items={[{ id: 'list', label: 'List', icon: LayoutList }, { id: 'board', label: 'Board', icon: Columns3 }]} />
                </div>

                {activeFilterCount > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-zinc-500">{filteredTasks.length} of {tasks.length} tasks</span>
                        {filters.overdueOnly && <Badge tone="rose">Overdue only</Badge>}
                        {personFilterName && <Badge tone="blue">{personFilterName}</Badge>}
                        <button onClick={() => setFilters(DEFAULT_FILTERS)} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-zinc-400 ring-1 ring-inset ring-white/10 hover:text-white">
                            <X className="h-3 w-3" />Clear filters
                        </button>
                    </div>
                )}

                {filteredTasks.length === 0 ? (
                    <Card>
                        <EmptyState
                            icon={CheckSquare}
                            title={tasks.length === 0 ? 'No tasks yet' : 'No tasks match'}
                            description={tasks.length === 0 ? (canAssign ? 'Assign the first task to your team.' : 'Tasks assigned to you will appear here.') : 'Try a different search or clear the filters.'}
                            action={tasks.length === 0
                                ? canAssign && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsNewTaskModalOpen(true)}>New task</Button>
                                : <Button variant="secondary" onClick={() => { setFilters(DEFAULT_FILTERS); setSearchQuery(''); }}>Clear filters</Button>}
                        />
                    </Card>
                ) : view === 'list' ? (
                    <Card padding="none" className="overflow-hidden">
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead>
                                    <tr className="border-b border-white/[0.06] bg-white/[0.02] text-left text-xs font-medium text-zinc-500">
                                        <th className="px-6 py-3 font-medium">Task</th>
                                        <th className="px-3 py-3 font-medium">Status</th>
                                        <th className="px-3 py-3 font-medium">Priority</th>
                                        <th className="px-3 py-3 font-medium">Deadline</th>
                                        <th className="px-3 py-3 font-medium">Project</th>
                                        <th className="px-3 py-3 font-medium">Assignee</th>
                                        <th className="px-6 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTasks.map(t => {
                                        const overdue = isOverdue(t);
                                        const priority = PRIORITY[t.priority] || PRIORITY[1];
                                        return (
                                            <tr key={t.id} className="group border-b border-white/[0.04] transition last:border-0 hover:bg-white/[0.025]">
                                                <td className="max-w-[340px] cursor-pointer px-6 py-3.5" onClick={() => setSelectedTaskForDetail(t)}>
                                                    <p className="truncate font-semibold text-zinc-100 group-hover:text-blue-200">{t.title}</p>
                                                    {t.description && <p className="mt-0.5 truncate text-xs text-zinc-500">{t.description}</p>}
                                                </td>
                                                <td className="px-3 py-3.5"><StatusPill status={t.status} /></td>
                                                <td className="px-3 py-3.5"><Badge tone={priority.tone}>{priority.label}</Badge></td>
                                                <td className="px-3 py-3.5">
                                                    <p className={cn('flex items-center gap-1.5 whitespace-nowrap', overdue ? 'text-rose-300' : 'text-zinc-300')}>
                                                        <CalendarDays className="h-3.5 w-3.5 opacity-60" />{t.deadline ? format(new Date(t.deadline), 'd MMM yyyy') : '–'}
                                                    </p>
                                                    {overdue && <p className="text-xs text-rose-400/80">Overdue</p>}
                                                </td>
                                                <td className="px-3 py-3.5">
                                                    {t.project
                                                        ? <button onClick={() => router.push(`/projects/${t.project!.id}`)} className="flex max-w-[160px] items-center gap-1.5 truncate text-blue-300 hover:text-blue-200"><Briefcase className="h-3.5 w-3.5 shrink-0" />{t.project.name}</button>
                                                        : <span className="text-zinc-600">General</span>}
                                                </td>
                                                <td className="px-3 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar alt={t.assignedTo?.name || ''} fallback={initialsOf(t.assignedTo?.name)} className="h-7 w-7 text-[11px]" />
                                                        <div className="min-w-0">
                                                            <p className="max-w-[120px] truncate text-zinc-200">{t.assignedTo?.name || 'Unassigned'}</p>
                                                            {t.assignedTo?.role && <p className="text-xs text-zinc-500">{humanize(t.assignedTo.role)}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5"><TaskActions t={t} compact /></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <ul className="divide-y divide-white/[0.05] md:hidden">
                            {filteredTasks.map(t => {
                                const priority = PRIORITY[t.priority] || PRIORITY[1];
                                return (
                                    <li key={t.id} className="p-4">
                                        <button className="w-full text-left" onClick={() => setSelectedTaskForDetail(t)}>
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="font-semibold text-zinc-100">{t.title}</p>
                                                <StatusPill status={t.status} />
                                            </div>
                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                                <Badge tone={priority.tone}>{priority.label}</Badge>
                                                <span className={cn('flex items-center gap-1', isOverdue(t) && 'text-rose-300')}><CalendarDays className="h-3.5 w-3.5" />{t.deadline ? format(new Date(t.deadline), 'd MMM') : '–'}</span>
                                                {t.project && <span className="text-blue-300">{t.project.name}</span>}
                                                <span>{t.assignedTo?.name || 'Unassigned'}</span>
                                            </div>
                                        </button>
                                        <div className="mt-3"><TaskActions t={t} /></div>
                                    </li>
                                );
                            })}
                        </ul>
                    </Card>
                ) : (
                    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                        <div className="grid min-w-[1000px] grid-cols-4 gap-4">
                            {COLUMNS.map(col => {
                                const items = filteredTasks.filter(t => t.status === col.id);
                                return (
                                    <div key={col.id} className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-3">
                                        <div className="mb-3 flex items-center gap-2 px-1">
                                            <span className={cn('h-2 w-2 rounded-full', col.dot)} />
                                            <span className="text-sm font-semibold text-zinc-200">{col.label}</span>
                                            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-semibold text-zinc-400">{items.length}</span>
                                        </div>
                                        <div className="space-y-2.5">
                                            {items.map(t => {
                                                const priority = PRIORITY[t.priority] || PRIORITY[1];
                                                const next = COLUMNS[COLUMNS.findIndex(c => c.id === t.status) + 1];
                                                return (
                                                    <div key={t.id} className="glass glass-hover cursor-pointer rounded-xl p-3.5" onClick={() => setSelectedTaskForDetail(t)}>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-sm font-semibold leading-snug text-zinc-100">{t.title}</p>
                                                            <Badge tone={priority.tone}>{priority.label}</Badge>
                                                        </div>
                                                        {t.project && <p className="mt-1.5 truncate text-xs text-blue-300">{t.project.name}</p>}
                                                        <div className="mt-3 flex items-center justify-between">
                                                            <span className={cn('flex items-center gap-1 text-xs', isOverdue(t) ? 'text-rose-300' : 'text-zinc-500')}>
                                                                <CalendarDays className="h-3.5 w-3.5" />{t.deadline ? format(new Date(t.deadline), 'd MMM') : '–'}
                                                            </span>
                                                            <Avatar alt={t.assignedTo?.name || ''} fallback={initialsOf(t.assignedTo?.name)} className="h-6 w-6 text-xs" />
                                                        </div>
                                                        {canChangeStatus(t) && next && (
                                                            <button
                                                                onClick={e => { e.stopPropagation(); updateStatus(t, next.id); }}
                                                                disabled={busyId === t.id}
                                                                className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-white/[0.06] py-1.5 text-xs font-medium text-zinc-400 transition hover:border-white/[0.12] hover:text-white disabled:opacity-50"
                                                            >
                                                                Move to {next.label.toLowerCase()} <ChevronRight className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {items.length === 0 && <p className="rounded-xl border border-dashed border-white/[0.06] py-6 text-center text-xs text-zinc-600">Nothing here</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <NewTaskModal isOpen={isNewTaskModalOpen} onClose={() => setIsNewTaskModalOpen(false)} onTaskCreated={() => { fetchData(); setIsNewTaskModalOpen(false); }} />
            <TaskDetailModal isOpen={!!selectedTaskForDetail} onClose={() => setSelectedTaskForDetail(null)} onDelete={fetchData} task={selectedTaskForDetail as any} />
            <CompletionModal isOpen={!!taskToComplete} onClose={() => setTaskToComplete(null)} onComplete={handleCompleteTask} title={taskToComplete?.title || ''} type="TASK" />
        </div>
    );
}

export default function TasksPage() {
    return <Suspense fallback={<Skeleton className="h-96" />}><TasksContent /></Suspense>;
}
