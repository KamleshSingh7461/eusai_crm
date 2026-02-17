"use client";

import React, { useEffect, useState } from 'react';
import KanbanBoard from '@/components/KanbanBoard';
import CalendarView from '@/components/CalendarView';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import NewTaskModal from '@/components/modals/NewTaskModal';
import { useToast } from '@/context/ToastContext';
import {
    CheckSquare,
    Loader2,
    Calendar,
    Plus,
    TrendingUp,
    AlertTriangle,
    Target,
    Users,
    BarChart3,
    Filter
} from 'lucide-react';

export default function TasksPage() {
    const { data: session } = useSession();
    const [tasks, setTasks] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Kanban');
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [filters, setFilters] = useState({ project: 'all', priority: 'all', assignee: 'all', role: 'all' });
    const { showToast } = useToast?.() || { showToast: console.log };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const tasksResponse = await fetch('/api/tasks');
            if (tasksResponse.ok) {
                const tasksData = await tasksResponse.json();
                setTasks(tasksData.tasks || []);
            }

            // Fetch analytics for directors/managers
            const userRole = (session?.user as any)?.role;
            if (['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole)) {
                const analyticsResponse = await fetch('/api/tasks/analytics');
                if (analyticsResponse.ok) {
                    const analyticsData = await analyticsResponse.json();
                    setAnalytics(analyticsData);
                }
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchData();
        }
    }, [session]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F4F5F7]">
                <Loader2 className="w-10 h-10 animate-spin text-[#0052CC]" />
            </div>
        );
    }

    const userRole = (session?.user as any)?.role;
    const isDirector = userRole === 'DIRECTOR';
    const isManager = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);

    const filteredTasks = tasks.map(task => ({
        ...task,
        priority: task.priority === 3 ? 'high' : task.priority === 2 ? 'medium' : 'low'
    })).filter(task => {
        const projectMatch = filters.project === 'all' || task.projectId === filters.project;
        const priorityMatch = filters.priority === 'all' || task.priority === filters.priority;
        const assigneeMatch = filters.assignee === 'all' || task.userId === filters.assignee;
        const roleMatch = filters.role === 'all' || task.assignedTo?.role === filters.role;
        return projectMatch && priorityMatch && assigneeMatch && roleMatch;
    });

    return (
        <div className="space-y-6 md:space-y-8 p-4 md:p-8 max-w-7xl mx-auto bg-[#F4F5F7] min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#0052CC]/10 flex items-center justify-center text-[#0052CC] shrink-0">
                        <CheckSquare className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-heading font-display">
                            {isDirector ? "Task Command Center" : "Tasks"}
                        </h1>
                        <p className="text-body text-sm md:text-lg">
                            {isDirector ? "Organization-wide task tracking & performance" :
                                isManager ? "Team task oversight & execution" :
                                    "My assigned tasks & status updates"}
                        </p>
                    </div>
                </div>

                {isManager && (
                    <button
                        onClick={() => setIsNewTaskModalOpen(true)}
                        className="w-full sm:w-auto bg-[#0052CC] hover:bg-[#0747A6] text-white px-6 py-2.5 rounded-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Assign New Task
                    </button>
                )}
            </div>

            {/* Director Tracking Dashboard */}
            {isDirector && analytics && (
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[var(--notion-bg-primary)] p-6 rounded-sm border border-[var(--notion-border-default)] shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-body uppercase tracking-wider">Completion Rate</span>
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="text-3xl font-bold text-heading">{analytics.overview.velocity}%</div>
                            <p className="text-xs text-body mt-1">{analytics.overview.completed} of {analytics.overview.total} tasks</p>
                            <div className="h-1.5 w-full bg-[#F4F5F7] rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${analytics.overview.velocity}%` }} />
                            </div>
                        </div>

                        <div className="bg-[var(--notion-bg-primary)] p-6 rounded-sm border border-[var(--notion-border-default)] shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-body uppercase tracking-wider">Overdue Tasks</span>
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                            </div>
                            <div className="text-3xl font-bold text-red-600">{analytics.overview.overdue}</div>
                            <p className="text-xs text-body mt-1">Require immediate attention</p>
                        </div>

                        <div className="bg-[var(--notion-bg-primary)] p-6 rounded-sm border border-[var(--notion-border-default)] shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-body uppercase tracking-wider">High Priority</span>
                                <Target className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="text-3xl font-bold text-orange-600">{analytics.overview.highPriority}</div>
                            <p className="text-xs text-body mt-1">Critical initiatives in progress</p>
                        </div>

                        <div className="bg-[var(--notion-bg-primary)] p-6 rounded-sm border border-[var(--notion-border-default)] shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-body uppercase tracking-wider">Completed This Week</span>
                                <BarChart3 className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="text-3xl font-bold text-heading">{analytics.overview.completedThisWeek}</div>
                            <p className="text-xs text-body mt-1">Tasks closed in last 7 days</p>
                        </div>
                    </div>

                    {/* Team Performance Table */}
                    <div className="bg-[var(--notion-bg-primary)] p-6 rounded-sm border border-[var(--notion-border-default)] shadow-sm">
                        <h3 className="text-sm font-bold text-heading uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Team Performance Breakdown
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--notion-border-default)]">
                                        <th className="text-left text-xs font-bold text-body uppercase tracking-wider py-3">Team Member</th>
                                        <th className="text-left text-xs font-bold text-body uppercase tracking-wider py-3">Role</th>
                                        <th className="text-center text-xs font-bold text-body uppercase tracking-wider py-3">Total</th>
                                        <th className="text-center text-xs font-bold text-body uppercase tracking-wider py-3">Completed</th>
                                        <th className="text-center text-xs font-bold text-body uppercase tracking-wider py-3">Overdue</th>
                                        <th className="text-center text-xs font-bold text-body uppercase tracking-wider py-3">High Priority</th>
                                        <th className="text-right text-xs font-bold text-body uppercase tracking-wider py-3">Progress</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.teamPerformance.map((member: any) => {
                                        const completion = member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0;
                                        return (
                                            <tr key={member.id} className="border-b border-[#F4F5F7] hover:bg-[var(--notion-bg-hover)] transition-colors">
                                                <td className="py-3">
                                                    <span className="font-medium text-heading">{member.name}</span>
                                                </td>
                                                <td className="py-3">
                                                    <span className="text-xs text-body">{member.role}</span>
                                                </td>
                                                <td className="text-center py-3">
                                                    <span className="font-medium text-heading">{member.total}</span>
                                                </td>
                                                <td className="text-center py-3">
                                                    <span className="text-emerald-600 font-medium">{member.completed}</span>
                                                </td>
                                                <td className="text-center py-3">
                                                    <span className={cn("font-medium", member.overdue > 0 ? "text-red-600" : "text-body")}>
                                                        {member.overdue}
                                                    </span>
                                                </td>
                                                <td className="text-center py-3">
                                                    <span className={cn("font-medium", member.highPriority > 0 ? "text-orange-600" : "text-body")}>
                                                        {member.highPriority}
                                                    </span>
                                                </td>
                                                <td className="text-right py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-20 h-2 bg-[#F4F5F7] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-[#0052CC]"
                                                                style={{ width: `${completion}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium text-heading w-10 text-right">{completion}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between py-2 bg-[var(--notion-bg-primary)] p-4 rounded-sm border border-[var(--notion-border-default)]">
                <div className="flex items-center gap-2 text-xs font-bold text-body uppercase tracking-wider">
                    <Filter className="w-4 h-4" />
                    Filters
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {isDirector && (
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                            className="bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm px-3 py-2 text-sm text-heading focus:outline-none focus:border-[#0052CC]">
                            <option value="all">All Roles</option>
                            <option value="MANAGER">Managers</option>
                            <option value="TEAM_LEADER">Team Leaders</option>
                            <option value="EMPLOYEE">Employees</option>
                            <option value="INTERN">Interns</option>
                        </select>
                    )}
                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        className="bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm px-3 py-2 text-sm text-heading focus:outline-none focus:border-[#0052CC]">
                        <option value="all">All Priorities</option>
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-heading">
                    <span className="bg-[#0052CC] text-white px-3 py-1 rounded-sm">{filteredTasks.length}</span>
                    Tasks Displayed
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-[var(--notion-border-default)]">
                {['Kanban', 'Calendar'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "pb-4 text-sm font-bold transition-all relative",
                            activeTab === tab ? "text-[#0052CC] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#0052CC]" : "text-subheading hover:text-heading"
                        )}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* View Container */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === 'Kanban' && (
                    tasks.length === 0 ? (
                        <div className="text-center py-20 text-body bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm">
                            <div className="bg-[var(--notion-bg-secondary)] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--notion-border-default)]">
                                <CheckSquare className="w-8 h-8 opacity-50" />
                            </div>
                            <h3 className="text-lg font-bold text-heading">No Tasks Found</h3>
                            <p>{isManager ? "Assign tasks to get started." : "You have no tasks assigned."}</p>
                        </div>
                    ) : (
                        <KanbanBoard initialTasks={filteredTasks} />
                    )
                )}
                {activeTab === 'Calendar' && (
                    <CalendarView />
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
        </div>
    );
}
