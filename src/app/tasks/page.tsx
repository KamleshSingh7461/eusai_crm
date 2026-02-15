
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
    Plus
} from 'lucide-react';

export default function TasksPage() {
    const { data: session } = useSession();
    const [tasks, setTasks] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Kanban');
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [filters, setFilters] = useState({ project: 'all', priority: 'all', assignee: 'all' });
    const { showToast } = useToast?.() || { showToast: console.log };

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/tasks');
            if (response.ok) {
                const data = await response.json();
                if (data.tasks) {
                    setTasks(data.tasks);
                    setMeta(data.meta);
                } else {
                    setTasks(data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchTasks();
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
    const isManager = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);

    const filteredTasks = tasks.map(task => ({
        ...task,
        priority: task.priority === 3 ? 'high' : task.priority === 2 ? 'medium' : 'low'
    })).filter(task => {
        const projectMatch = filters.project === 'all' || task.projectId === filters.project;
        const priorityMatch = filters.priority === 'all' || task.priority === filters.priority;
        const assigneeMatch = filters.assignee === 'all' || task.userId === filters.assignee;
        return projectMatch && priorityMatch && assigneeMatch;
    });

    return (
        <div className="space-y-6 md:space-y-8 p-4 md:p-8 max-w-7xl mx-auto bg-[#F4F5F7] min-h-screen">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#0052CC]/10 flex items-center justify-center text-[#0052CC] shrink-0">
                        <CheckSquare className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#172B4D] font-display">Tasks</h1>
                        <p className="text-[#6B778C] text-sm md:text-lg">
                            {isManager ? "Team-wide task oversight." : "Personal mission objectives."}
                        </p>
                    </div>
                </div>

                {isManager && (
                    <button
                        onClick={() => setIsNewTaskModalOpen(true)}
                        className="w-full sm:w-auto bg-[#0052CC] hover:bg-[#0747A6] text-white px-6 py-2.5 rounded-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Initiate Task
                    </button>
                )}
            </div>

            {/* Manager Health Dashboard */}
            {isManager && meta && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-2 block">Task Velocity</span>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-[#172B4D]">{meta.health.velocity}%</span>
                            <span className="text-xs text-emerald-600 font-medium mb-1">Completion rate</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#F4F5F7] rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-[#0052CC]" style={{ width: `${meta.health.velocity}%` }} />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-2 block">Overdue Alerts</span>
                        <div className="text-2xl font-bold text-red-600">{meta.health.overdue}</div>
                        <p className="text-xs text-[#6B778C] mt-1">Requires immediate reallocation</p>
                    </div>
                    <div className="bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-2 block">High Priority</span>
                        <div className="text-2xl font-bold text-orange-600">{meta.health.highPriority}</div>
                        <p className="text-xs text-[#6B778C] mt-1">Critical path initiatives</p>
                    </div>
                    <div className="bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-2 block">Total Active</span>
                        <div className="text-2xl font-bold text-[#172B4D]">{meta.health.total - meta.health.completed}</div>
                        <p className="text-xs text-[#6B778C] mt-1">Ongoing team assignments</p>
                    </div>
                </div>
            )}

            {/* Team Workload Visualization (Simplified Bar List for now) */}
            {isManager && meta?.workload && (
                <div className="bg-white p-8 rounded-sm border border-[#DFE1E6] shadow-sm">
                    <h3 className="text-xs font-bold text-[#172B4D] uppercase tracking-widest mb-6">Team Workload Distribution</h3>
                    <div className="space-y-6">
                        {meta.workload.map((user: any) => (
                            <div key={user.name} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-[#42526E]">{user.name}</span>
                                    <span className="text-[#6B778C] font-medium">{user.count} tasks ({user.overdue} overdue)</span>
                                </div>
                                <div className="h-2 w-full bg-[#F4F5F7] rounded-full overflow-hidden flex">
                                    <div
                                        className="h-full bg-[#0052CC]"
                                        style={{ width: `${((user.count - user.overdue) / meta.health.total) * 100}%` }}
                                    />
                                    <div
                                        className="h-full bg-red-500"
                                        style={{ width: `${(user.overdue / meta.health.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between py-2">
                <div className="flex gap-3 w-full md:w-auto">
                    <select
                        value={filters.project}
                        onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                        className="bg-white border border-[#DFE1E6] rounded-sm px-3 py-2 text-sm text-[#172B4D] focus:outline-none focus:border-[#0052CC] min-w-[140px]"
                    >
                        <option value="all">All Projects</option>
                        {meta?.projects?.map((p: any) => (
                            <option key={p.name} value={p.name === 'No Project' ? 'none' : tasks.find(t => t.project?.name === p.name)?.projectId}>
                                {p.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        className="bg-white border border-[#DFE1E6] rounded-sm px-3 py-2 text-sm text-[#172B4D] focus:outline-none focus:border-[#0052CC]"
                    >
                        <option value="all">Any Priority</option>
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                    </select>

                    {isManager && (
                        <select
                            value={filters.assignee}
                            onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                            className="bg-white border border-[#DFE1E6] rounded-sm px-3 py-2 text-sm text-[#172B4D] focus:outline-none focus:border-[#0052CC]"
                        >
                            <option value="all">All Assignees</option>
                            {meta?.workload?.map((u: any) => (
                                <option key={u.name} value={tasks.find(t => t.assignedTo?.name === u.name)?.userId || 'unassigned'}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-[#6B778C] uppercase tracking-wider">
                    <span className="bg-[#DFE1E6] px-2 py-0.5 rounded-sm text-[#172B4D]">{filteredTasks.length}</span>
                    Assignments Found
                </div>
            </div>

            {/* Tabs / Sub-nav */}
            <div className="flex items-center gap-8 border-b border-[#DFE1E6]">
                {['Kanban', 'Calendar'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "pb-4 text-sm font-bold transition-all relative",
                            activeTab === tab ? "text-[#0052CC] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#0052CC]" : "text-[#42526E] hover:text-[#172B4D]"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* View Container */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === 'Kanban' && (
                    tasks.length === 0 ? (
                        <div className="text-center py-20 text-[#6B778C] bg-white border border-[#DFE1E6] rounded-sm shadow-sm">
                            <div className="bg-[#FAFBFC] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#DFE1E6]">
                                <CheckSquare className="w-8 h-8 opacity-50" />
                            </div>
                            <h3 className="text-lg font-bold text-[#172B4D]">Zero Pending Items</h3>
                            <p>Great job! {isManager ? "The team is currently clear of assignments." : "You have no mission-critical tasks pending."}</p>
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
                    fetchTasks();
                    setIsNewTaskModalOpen(false);
                }}
            />
        </div>
    );
}
