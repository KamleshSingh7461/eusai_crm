"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
    CheckSquare,
    Loader2,
    Calendar,
    Plus,
    TrendingUp,
    AlertTriangle,
    Target as TargetIcon,
    Users,
    BarChart3,
    Filter,
    Search,
    Clock,
    CheckCircle2,
    MoreHorizontal,
    SearchX,
    Activity,
    Briefcase,
    ChevronRight,
    Flag,
    AlertCircle,
    User as UserIcon,
    TrendingDown,
    Shield
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import NewTaskModal from '@/components/modals/NewTaskModal';
import { StatusBadge, NotionButton } from '@/components/notion';
import type { StatusType } from '@/components/notion/StatusBadge';
import TaskDetailModal from '@/components/modals/TaskDetailModal';
import CompletionModal from '@/components/modals/CompletionModal';

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
    overview: {
        total: number;
        completed: number;
        overdue: number;
        highPriority: number;
        velocity: number;
        completedThisWeek: number;
        completedThisMonth: number;
    };
    teamPerformance: any[];
}

export default function TasksPage() {
    const { data: session } = useSession();
    const { showToast } = useToast?.() || { showToast: (msg: string) => console.log(msg) };

    const [tasks, setTasks] = useState<Task[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<any>({
        project: 'all',
        priority: 'all',
        role: 'all',
        status: 'all',
        overdueOnly: false,
        assignedUser: 'all'
    });

    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);

    const userRole = (session?.user as any)?.role;
    const isDirector = userRole === 'DIRECTOR';
    const isManager = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);
    const userId = (session?.user as any)?.id;

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const tasksResponse = await fetch('/api/tasks');
            if (tasksResponse.ok) {
                const tasksData = await tasksResponse.json();
                setTasks(tasksData.tasks || []);
            }

            if (isManager) {
                const analyticsResponse = await fetch('/api/tasks/analytics');
                if (analyticsResponse.ok) {
                    const analyticsData = await analyticsResponse.json();
                    setAnalytics(analyticsData);
                }
            }
        } catch (error) {
            showToast('Strategic uplink failure', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchData();
        }
    }, [session]);

    const filteredTasks = useMemo(() => {
        const now = new Date();
        return tasks.filter(task => {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                task.title.toLowerCase().includes(query) ||
                task.description?.toLowerCase().includes(query) ||
                task.project?.name?.toLowerCase().includes(query) ||
                task.assignedTo?.name?.toLowerCase().includes(query);

            const matchesProject = filters.project === 'all' || task.projectId === filters.project;
            const matchesPriority = filters.priority === 'all' ||
                (filters.priority === 'high' && task.priority === 3) ||
                (filters.priority === 'medium' && task.priority === 2) ||
                (filters.priority === 'low' && task.priority === 1);
            const matchesRole = filters.role === 'all' || task.assignedTo?.role === filters.role;
            const matchesStatus = filters.status === 'all' || task.status === filters.status;
            const matchesUser = filters.assignedUser === 'all' || task.userId === filters.assignedUser;

            const isOverdue = task.deadline && new Date(task.deadline) < now && task.status !== 'DONE';
            const matchesOverdue = !filters.overdueOnly || isOverdue;

            return matchesSearch && matchesProject && matchesPriority && matchesRole && matchesStatus && matchesOverdue && matchesUser;
        });
    }, [tasks, searchQuery, filters]);

    const localAnalytics = useMemo(() => {
        const now = new Date();
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'DONE').length;
        const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'DONE').length;
        const highPriority = tasks.filter(t => t.priority === 3).length;
        const velocity = total > 0 ? Math.round((completed / total) * 100) : 0;

        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const completedThisWeek = tasks.filter(t =>
            t.status === 'DONE' && new Date(t.updatedAt) > lastWeek
        ).length;

        return {
            overview: {
                total,
                completed,
                overdue,
                highPriority,
                velocity,
                completedThisWeek
            }
        };
    }, [tasks]);

    const displayAnalytics = analytics || localAnalytics;

    const mapStatusForBadge = (status: string): StatusType => {
        switch (status) {
            case 'DONE': return 'done';
            case 'IN_PROGRESS': return 'in-progress';
            case 'REVIEW': return 'under-review';
            case 'TODO': return 'not-started';
            default: return 'not-started';
        }
    };

    const handleUpdateStatus = async (taskId: string, status: string) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                showToast(`Operational status updated to ${status}`, 'success');
                fetchData();
            } else {
                showToast('Failed to update tactical status', 'error');
            }
        } catch (error) {
            showToast('Strategic communication failure', 'error');
        }
    };

    const handleCompleteTask = async (remarks: string, proofUrl?: string) => {
        if (!taskToComplete) return;

        try {
            const res = await fetch(`/api/tasks/${taskToComplete.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'DONE',
                    completionRemark: remarks,
                    completionProof: proofUrl
                })
            });

            if (res.ok) {
                showToast('Missions completion validated and logged', 'success');
                fetchData();
                setTaskToComplete(null);
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to validate missions completion', 'error');
            }
        } catch (error) {
            showToast('Strategic synchronization failure', 'error');
        }
    };

    const handleQuickFilter = (type: string, payload?: any) => {
        switch (type) {
            case 'ALL':
                setFilters({ project: 'all', priority: 'all', role: 'all', status: 'all', overdueOnly: false, assignedUser: 'all' });
                break;
            case 'OVERDUE':
                setFilters({ ...filters, overdueOnly: true, priority: 'all', status: 'all', assignedUser: 'all' });
                // showToast('Interrogating overdue missions...', 'success');
                break;
            case 'HIGH_PRIORITY':
                setFilters({ ...filters, priority: 'high', status: 'all', overdueOnly: false, assignedUser: 'all' });
                // showToast('Filtering critical initiatives...', 'success');
                break;
            case 'COMPLETED':
                setFilters({ ...filters, status: 'DONE', priority: 'all', overdueOnly: false, assignedUser: 'all' });
                // showToast('Retrieving historical yields...', 'success');
                break;
            case 'PERSONNEL':
                setFilters({ project: 'all', priority: 'all', role: 'all', status: 'all', overdueOnly: false, assignedUser: payload });
                // showToast(`Isolation protocol: Personnel ${payload}`, 'success');
                break;
        }

        // Auto-scroll to registry on mobile/tablet for better UX
        if (window.innerWidth < 1024) {
            document.getElementById('task-registry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#191919]">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-t-[#0052CC] border-[rgba(255,255,255,0.05)] animate-spin" />
                        <Activity className="absolute inset-0 m-auto w-6 h-6 text-[#0052CC] animate-pulse" />
                    </div>
                    <p className="text-[rgba(255,255,255,0.4)] text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Establishing Tactical Uplink...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#191919] text-[rgba(255,255,255,0.9)] pb-20">
            {/* Header / Command Center */}
            <div className="bg-[#1D2125] border-b border-[rgba(255,255,255,0.08)] shadow-xl relative z-20">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-[#0052CC] to-[#0747A6] flex items-center justify-center shadow-lg shadow-blue-900/40 shrink-0">
                                <CheckSquare className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-[rgba(255,255,255,0.4)] text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                                    <Activity className="w-3 h-3 text-[#0052CC]" />
                                    Operational Governance
                                </div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-[rgba(255,255,255,0.95)]">Task Command Center</h1>
                                <p className="hidden sm:block text-[rgba(255,255,255,0.5)] text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mt-1">
                                    {isDirector ? "Organization-wide mission tracking & execution" :
                                        isManager ? "Team tactical oversight & delivery" :
                                            "Personal operational ledger & status tracking"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {isManager && (
                                <NotionButton
                                    onClick={() => setIsNewTaskModalOpen(true)}
                                    className="bg-[#0052CC] hover:bg-[#0747A6] text-white shadow-xl shadow-blue-900/20 px-6 font-black uppercase tracking-[0.15em] text-[10px] h-11"
                                    leftIcon={Plus}
                                >
                                    Assign New Task
                                </NotionButton>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-2 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Metrics Dashboard */}
                {displayAnalytics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <MetricSummaryCard
                            label={isManager ? "Task Velocity" : "My Velocity"}
                            value={`${displayAnalytics.overview.velocity}%`}
                            subtext={isManager ? `${displayAnalytics.overview.completed} of ${displayAnalytics.overview.total} tasks` : `Completed ${displayAnalytics.overview.completed} items`}
                            icon={TrendingUp}
                            color="blue"
                            onClick={() => handleQuickFilter('ALL')}
                        />
                        <MetricSummaryCard
                            label={isManager ? "Overdue Missions" : "My Overdue"}
                            value={displayAnalytics.overview.overdue}
                            subtext="Immediate action required"
                            icon={AlertCircle}
                            color="red"
                            onClick={() => handleQuickFilter('OVERDUE')}
                        />
                        <MetricSummaryCard
                            label={isManager ? "Critical Initiatives" : "My Priority"}
                            value={displayAnalytics.overview.highPriority}
                            subtext="High-impact priority"
                            icon={TargetIcon}
                            color="orange"
                            onClick={() => handleQuickFilter('HIGH_PRIORITY')}
                        />
                        <MetricSummaryCard
                            label={isManager ? "Seven Day Yield" : "Weekly Yield"}
                            value={displayAnalytics.overview.completedThisWeek}
                            subtext="Completed this week"
                            icon={BarChart3}
                            color="emerald"
                            onClick={() => handleQuickFilter('COMPLETED')}
                        />
                    </div>
                )}

                {/* Strategic Personnel Assessment (Directors Only) */}
                {isDirector && analytics?.teamPerformance && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-1">
                            <Shield className="w-4 h-4 text-[#0052CC]" />
                            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Strategic Personnel Assessment</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {analytics.teamPerformance.map((member: any) => (
                                <div
                                    key={member.id}
                                    onClick={() => handleQuickFilter('PERSONNEL', member.id)}
                                    className="bg-[#2f3437] border border-[rgba(255,255,255,0.08)] p-5 rounded-lg hover:border-[rgba(255,255,255,0.2)] transition-all group cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-[#1D2125] border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-black text-[#0052CC] text-sm shadow-inner group-hover:scale-110 transition-transform">
                                                {member.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white tracking-tight">{member.name}</h4>
                                                <p className="text-[9px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">{member.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-white">{Math.round((member.completed / member.total) * 100) || 0}%</span>
                                            <span className="text-[8px] font-black text-[rgba(255,255,255,0.2)] uppercase">Yield</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-tighter">
                                            <span className="text-[rgba(255,255,255,0.4)]">Operations</span>
                                            <span className="text-white">{member.completed}/{member.total}</span>
                                        </div>
                                        <div className="h-1 w-full bg-[#1D2125] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#0052CC] transition-all duration-1000"
                                                style={{ width: `${(member.completed / member.total) * 100 || 0}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-1.5">
                                                <AlertTriangle className={cn("w-3 h-3", member.overdue > 0 ? "text-red-500" : "text-[rgba(255,255,255,0.1)]")} />
                                                <span className={cn("text-[9px] font-black", member.overdue > 0 ? "text-red-400" : "text-[rgba(255,255,255,0.2)]")}>{member.overdue} Overdue</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <TargetIcon className={cn("w-3 h-3", member.highPriority > 0 ? "text-orange-500" : "text-[rgba(255,255,255,0.1)]")} />
                                                <span className={cn("text-[9px] font-black", member.highPriority > 0 ? "text-orange-400" : "text-[rgba(255,255,255,0.2)]")}>{member.highPriority} Critical</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters & Control Deck */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-[#2f3437] p-4 lg:p-3 rounded-lg border border-[rgba(255,255,255,0.08)] shadow-lg sticky top-0 z-30 backdrop-blur-md bg-opacity-95">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.3)] group-focus-within:text-[#0052CC] transition-colors" />
                        <input
                            placeholder="Interrogate data... (Title, Project, Assignee)"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none text-sm pl-12 focus:ring-0 placeholder-[rgba(255,255,255,0.3)] text-[rgba(255,255,255,0.8)] font-bold tracking-tight py-2 sm:py-1"
                        />
                    </div>

                    <div className="h-px w-full lg:h-8 lg:w-px bg-[rgba(255,255,255,0.08)]" />

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:items-center gap-3 lg:gap-4 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-3">
                            <span className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.15em] lg:tracking-widest">Priority:</span>
                            <select
                                value={filters.priority}
                                onChange={e => setFilters({ ...filters, priority: e.target.value })}
                                className="bg-[#191919] border border-[rgba(255,255,255,0.1)] text-[10px] font-black uppercase tracking-wider text-[rgba(255,255,255,0.7)] focus:ring-1 focus:ring-[#0052CC] cursor-pointer hover:bg-[#3b4045] rounded-md px-2 py-1.5 transition-all outline-none h-8 lg:h-9 w-full lg:w-32"
                            >
                                <option value="all">All Priorities</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-3">
                            <span className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.15em] lg:tracking-widest">Status:</span>
                            <select
                                value={filters.status}
                                onChange={e => setFilters({ ...filters, status: e.target.value })}
                                className="bg-[#191919] border border-[rgba(255,255,255,0.1)] text-[10px] font-black uppercase tracking-wider text-[rgba(255,255,255,0.7)] focus:ring-1 focus:ring-[#0052CC] cursor-pointer hover:bg-[#3b4045] rounded-md px-2 py-1.5 transition-all outline-none h-8 lg:h-9 w-full lg:w-32"
                            >
                                <option value="all">All Statuses</option>
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="REVIEW">Review</option>
                                <option value="DONE">Done</option>
                            </select>
                        </div>

                        {isDirector && (
                            <div className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-3 col-span-2 md:col-span-1">
                                <span className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.15em] lg:tracking-widest">Role:</span>
                                <select
                                    value={filters.role}
                                    onChange={e => setFilters({ ...filters, role: e.target.value })}
                                    className="bg-[#191919] border border-[rgba(255,255,255,0.1)] text-[10px] font-black uppercase tracking-wider text-[rgba(255,255,255,0.7)] focus:ring-1 focus:ring-[#0052CC] cursor-pointer hover:bg-[#3b4045] rounded-md px-2 py-1.5 transition-all outline-none h-8 lg:h-9 w-full lg:w-32"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="MANAGER">Managers</option>
                                    <option value="TEAM_LEADER">Team Leaders</option>
                                    <option value="EMPLOYEE">Employees</option>
                                    <option value="INTERN">Interns</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Registry View (Database Table) */}
                <div id="task-registry" className="scroll-mt-32">
                    {
                        filteredTasks.length === 0 ? (
                            <div className="bg-[#2f3437] border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-xl py-32 flex flex-col items-center justify-center text-center px-8">
                                <SearchX className="w-16 h-16 text-[rgba(255,255,255,0.1)] mb-6" />
                                <h3 className="text-xl font-black text-[rgba(255,255,255,0.9)] tracking-tight">Tactical Vacuum Detected</h3>
                                <p className="text-[rgba(255,255,255,0.4)] text-sm mt-3 max-w-sm font-medium">No tasks match your current interrogative parameters. Adjust filters to expand scope.</p>
                                <NotionButton
                                    variant="default"
                                    className="mt-8 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.08)] text-[10px] font-black uppercase tracking-widest"
                                    onClick={() => {
                                        setFilters({ project: 'all', priority: 'all', role: 'all', status: 'all' });
                                        setSearchQuery('');
                                    }}
                                >
                                    Reset Registry
                                </NotionButton>
                            </div>
                        ) : (
                            <div className="bg-[#2f3437] border border-[rgba(255,255,255,0.09)] rounded-lg overflow-hidden shadow-2xl">
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[rgba(0,0,0,0.2)] border-b border-[rgba(255,255,255,0.08)]">
                                                <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] w-12 hidden sm:table-cell">REF</th>
                                                <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] min-w-[200px] sm:min-w-[300px]">Strategic Task</th>
                                                <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em]">Status</th>
                                                <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] hidden md:table-cell">Priority</th>
                                                <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em]">Deadline</th>
                                                <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] hidden lg:table-cell">Project</th>
                                                <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] hidden md:table-cell">Assignee</th>
                                                <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
                                            {filteredTasks.map((t, idx) => (
                                                <tr key={t.id} className="hover:bg-[rgba(255,255,255,0.04)] transition-all duration-300 group relative">
                                                    <td className="px-5 py-5 text-[10px] font-black font-mono text-[rgba(255,255,255,0.15)] group-hover:text-[#0052CC] transition-colors hidden sm:table-cell">
                                                        {String(idx + 1).padStart(3, '0')}
                                                    </td>
                                                    <td className="px-5 py-5 cursor-pointer" onClick={() => setSelectedTaskForDetail(t)}>
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-[13px] font-black tracking-tight text-[rgba(255,255,255,0.9)] group-hover:text-[#0052CC] transition-colors">{t.title}</span>
                                                            <span className="text-[10px] text-[rgba(255,255,255,0.4)] font-bold uppercase tracking-wider line-clamp-1 max-w-[150px] sm:max-w-sm">{t.description || "Operational task tracking."}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-5">
                                                        <StatusBadge status={mapStatusForBadge(t.status)} size="sm" />
                                                    </td>
                                                    <td className="px-5 py-5 hidden md:table-cell">
                                                        <div className={cn(
                                                            "text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-[0.1em] border inline-flex items-center gap-1.5 shadow-sm",
                                                            t.priority === 3 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                t.priority === 2 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                        )}>
                                                            <div className={cn("w-1 h-1 rounded-full",
                                                                t.priority === 3 ? 'bg-red-400' :
                                                                    t.priority === 2 ? 'bg-orange-400' :
                                                                        'bg-blue-400'
                                                            )} />
                                                            {t.priority === 3 ? 'High' : t.priority === 2 ? 'Medium' : 'Low'}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-5">
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-1.5 text-xs text-[rgba(255,255,255,0.7)] font-black tracking-tight">
                                                                <Clock className="w-3.5 h-3.5 text-[rgba(255,255,255,0.2)]" />
                                                                {new Date(t.deadline).toLocaleDateString()}
                                                            </div>
                                                            {new Date(t.deadline) < new Date() && t.status !== 'DONE' && (
                                                                <span className="text-[9px] font-black text-red-500/80 uppercase tracking-tighter">Overdue</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-5 hidden lg:table-cell">
                                                        {t.project ? (
                                                            <div className="flex items-center gap-2 group/link cursor-pointer">
                                                                <div className="p-1.5 bg-blue-500/10 rounded-md border border-blue-500/20 group-hover/link:bg-blue-500/20 transition-all">
                                                                    <Briefcase className="w-3 h-3 text-[#0052CC]" />
                                                                </div>
                                                                <span className="text-xs font-black text-[#0052CC] tracking-tight group-hover/link:underline truncate max-w-[100px]">{t.project.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[rgba(255,255,255,0.1)] text-[9px] font-black tracking-[0.2em] uppercase">GENERAL</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-5 hidden md:table-cell">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded bg-[#1D2125] border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-black text-white text-[10px] shadow-inner shrink-0">
                                                                {t.assignedTo?.name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-[rgba(255,255,255,0.9)] tracking-tight truncate max-w-[120px]">{t.assignedTo?.name || "Staff"}</span>
                                                                <span className="text-[9px] font-black text-[rgba(255,255,255,0.25)] uppercase tracking-tighter truncate">{t.assignedTo?.role || "Operational"}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 sm:translate-x-2 sm:group-hover:translate-x-0">
                                                            {(t.userId === userId || isManager) && t.status !== 'DONE' && (
                                                                <button
                                                                    onClick={() => setTaskToComplete(t)}
                                                                    className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-md border border-[rgba(16,185,129,0.1)] sm:border-transparent hover:border-emerald-500/30 transition-all active:scale-90"
                                                                    title="Mark as Complete"
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button className="p-2 hover:bg-[rgba(255,255,255,0.05)] border border-transparent hover:border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.3)] hover:text-white rounded-md transition-all">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card List */}
                                <div className="md:hidden divide-y divide-[rgba(255,255,255,0.05)]">
                                    {filteredTasks.map((t) => (
                                        <div key={t.id} className="p-4 active:bg-[rgba(255,255,255,0.02)] transition-colors">
                                            <div className="flex items-start justify-between gap-3 mb-2.5">
                                                <div className="flex flex-col gap-1 min-w-0">
                                                    <span className="text-[13px] font-black text-white leading-tight">{t.title}</span>
                                                    <span className="text-[10px] text-[rgba(255,255,255,0.4)] font-bold uppercase tracking-wider truncate">{t.description || "No description provided."}</span>
                                                </div>
                                                <StatusBadge status={mapStatusForBadge(t.status)} size="sm" />
                                            </div>

                                            <div className="flex items-center justify-between gap-2 overflow-hidden">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className={cn(
                                                        "text-[8px] font-black px-1 py-0.5 rounded-sm uppercase tracking-tighter border shrink-0",
                                                        t.priority === 3 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            t.priority === 2 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    )}>
                                                        {t.priority === 3 ? 'High' : t.priority === 2 ? 'Med' : 'Low'}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[9px] font-black text-[rgba(255,255,255,0.5)] shrink-0">
                                                        <Clock className="w-2.5 h-2.5 opacity-30" />
                                                        {new Date(t.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </div>
                                                    {t.project && (
                                                        <div className="text-[8px] font-black text-[#0052CC] uppercase tracking-wider truncate">
                                                            {t.project.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center font-black text-[8px]">
                                                        {t.assignedTo?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-[rgba(255,255,255,0.4)]">{t.assignedTo?.name || "Unassigned"}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {(t.userId === userId || isManager) && t.status !== 'DONE' && (
                                                        <button
                                                            onClick={() => setTaskToComplete(t)}
                                                            className="px-4 py-2 bg-[#0052CC]/10 text-[#0052CC] text-[10px] font-black uppercase tracking-[0.1em] rounded border border-[#0052CC]/20 active:scale-90 transition-all shadow-lg active:bg-[#0052CC] active:text-white"
                                                        >
                                                            Complete Task
                                                        </button>
                                                    )}
                                                    <button className="p-2 text-[rgba(255,255,255,0.2)] hover:text-white transition-colors">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                </div>

                <NewTaskModal
                    isOpen={isNewTaskModalOpen}
                    onClose={() => setIsNewTaskModalOpen(false)}
                    onTaskCreated={() => {
                        fetchData();
                        setIsNewTaskModalOpen(false);
                    }}
                />

                <TaskDetailModal
                    isOpen={!!selectedTaskForDetail}
                    onClose={() => setSelectedTaskForDetail(null)}
                    task={selectedTaskForDetail}
                />

                <CompletionModal
                    isOpen={!!taskToComplete}
                    onClose={() => setTaskToComplete(null)}
                    onComplete={handleCompleteTask}
                    title={taskToComplete?.title || ''}
                    type="TASK"
                />
            </div>
        </div>
    );
}

function MetricSummaryCard({ label, value, subtext, icon: Icon, color, onClick }: any) {
    const colorStyles: any = {
        blue: "text-blue-400 border-blue-500/20",
        emerald: "text-emerald-400 border-emerald-500/20",
        orange: "text-orange-400 border-orange-500/20",
        red: "text-red-400 border-red-500/20"
    };

    return (
        <div
            onClick={onClick}
            className="bg-[#2f3437] border border-[rgba(255,255,255,0.08)] p-5 sm:p-6 rounded-lg flex items-center gap-4 sm:gap-6 shadow-xl relative overflow-hidden group hover:bg-[#32393d] transition-all duration-500 cursor-pointer hover:border-[rgba(255,255,255,0.2)] active:scale-[0.98]"
        >
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-700">
                <Icon className="w-12 h-12 sm:w-16 sm:h-16 transform rotate-12" />
            </div>

            <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500", colorStyles[color])}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="flex flex-col min-w-0">
                <span className="text-[9px] sm:text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] mb-1 truncate">{label}</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-none">{value}</span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-bold text-[rgba(255,255,255,0.25)] tracking-wide mt-2 truncate">{subtext}</span>
            </div>

            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0 hidden sm:block">
                <ChevronRight className="w-4 h-4 text-[#0052CC]" />
            </div>
        </div>
    );
}
