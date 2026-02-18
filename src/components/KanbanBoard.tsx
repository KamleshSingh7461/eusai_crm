"use client";

import React, { useState } from 'react';
import {
    Plus,
    MoreVertical,
    MessageSquare,
    Paperclip,
    Calendar,
    ChevronRight,
    Briefcase
} from 'lucide-react';


interface Task {
    id: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
    priority: 'low' | 'medium' | 'high';
    comments?: number;
    attachments?: number;
    project?: { name: string };
    deadline?: string;
    assignedTo?: {
        name: string | null;
        image: string | null;
        email: string | null;
    };
}

interface KanbanBoardProps {
    initialTasks?: Task[];
}

export default function KanbanBoard({ initialTasks = [] }: KanbanBoardProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    // Update local state when props change (simple sync)
    React.useEffect(() => {
        if (initialTasks.length > 0) {
            setTasks(initialTasks);
        }
    }, [initialTasks]);

    const columns = [
        { id: 'TODO', name: 'To Do', color: 'bg-slate-500' },
        { id: 'IN_PROGRESS', name: 'In Progress', color: 'bg-blue-500' },
        { id: 'REVIEW', name: 'Review', color: 'bg-yellow-500' },
        { id: 'DONE', name: 'Completed', color: 'bg-green-500' },
    ];

    const moveTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const statusOrder: Task['status'][] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
        const currentIndex = statusOrder.indexOf(task.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, status: nextStatus } : t
        ));

        // Call API
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();

                // Revert on error
                setTasks(prev => prev.map(t =>
                    t.id === taskId ? { ...t, status: task.status } : t
                ));

                // Handle permission error (403) gracefully without console error
                if (response.status === 403) {
                    if (typeof window !== 'undefined' && (window as any).showToast) {
                        (window as any).showToast(
                            errorData.error || 'You do not have permission to update this task',
                            'error'
                        );
                    }
                    return; // Exit gracefully without throwing
                }

                // For other errors, throw
                throw new Error(errorData.error || 'Failed to update task');
            }

            // Success toast
            if (typeof window !== 'undefined' && (window as any).showToast) {
                (window as any).showToast('Task status updated successfully', 'success');
            }
        } catch (error: any) {
            // Revert on error
            setTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, status: task.status } : t
            ));

            console.error('Failed to update task status:', error);

            // Show error toast
            if (typeof window !== 'undefined' && (window as any).showToast) {
                const errorMessage = error.message.includes('assigned employee')
                    ? 'Only the assigned employee can update task status'
                    : 'Failed to update task';
                (window as any).showToast(errorMessage, 'error');
            }
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full min-h-[600px]">
            {columns.map((col) => (
                <div key={col.id} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${col.color}`} />
                            <h3 className="font-bold text-foreground uppercase text-xs tracking-widest">{col.name}</h3>
                            <span className="text-xs text-muted-foreground bg-muted py-0.5 px-2 rounded-full">
                                {tasks.filter(t => t.status === col.id).length}
                            </span>
                        </div>
                        <button className="text-muted-foreground hover:text-primary transition-colors">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 flex-1">
                        {tasks
                            .filter(t => t.status === col.id)
                            .map((task) => (
                                <div
                                    key={task.id}
                                    className="card-eusai p-4 rounded-xl border border-border bg-[#F4F5F7]/50 hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                                    onClick={() => moveTask(task.id)}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex gap-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-50 text-red-600' :
                                                task.priority === 'medium' ? 'bg-orange-50 text-orange-600' :
                                                    'bg-blue-50 text-blue-600'
                                                }`}>
                                                {task.priority || 'medium'}
                                            </span>
                                        </div>
                                        <button className="text-muted-foreground group-hover:text-primary transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <h4 className="font-semibold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
                                        {task.title}
                                    </h4>

                                    {task.project && (
                                        <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                                            <Briefcase className="w-3 h-3" />
                                            {task.project.name}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            {task.deadline && (
                                                <div className="flex items-center gap-1 text-[11px]">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Assignee Avatar */}
                                        {task.assignedTo ? (
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700" title={task.assignedTo.name || 'Unknown'}>
                                                {task.assignedTo.name ? task.assignedTo.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center">
                                                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
