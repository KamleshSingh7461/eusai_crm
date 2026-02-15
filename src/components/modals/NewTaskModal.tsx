"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    X,
    Calendar,
    Flag,
    Briefcase,
    User as UserIcon,
    Loader2
} from 'lucide-react';
import { useSession } from 'next-auth/react';

const taskSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().optional().or(z.literal('')),
    deadline: z.string().min(1, 'Deadline is required'),
    priority: z.string().min(1, 'Priority is required'),
    projectId: z.string().optional().or(z.literal('')),
    assignedToId: z.string().min(1, 'Assignee is required'),
    status: z.string().optional().or(z.literal(''))
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface User {
    id: string;
    name: string;
    role: string;
}

interface Project {
    id: string;
    name: string;
}

interface NewTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskCreated: () => void;
}

export default function NewTaskModal({ isOpen, onClose, onTaskCreated }: NewTaskModalProps) {
    const { data: session } = useSession();
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            priority: 'medium',
            status: 'TODO',
            deadline: new Date().toISOString().split('T')[0]
        }
    });

    // Fetch team members and projects when modal opens
    useEffect(() => {
        if (isOpen && session) {
            const fetchData = async () => {
                setIsLoadingData(true);
                try {
                    // 1. Fetch Projects
                    const projectsRes = await fetch('/api/projects');
                    if (projectsRes.ok) {
                        setProjects(await projectsRes.json());
                    }

                    // 2. Fetch Team Members (for picking assignee)
                    // If Team Leader, fetch subordinates. If Director/Manager, fetch everyone or hierarchy.
                    // We can reuse /api/users/managers? or create /api/users/team?
                    // For now, let's try /api/dashboard/team-leader if TL, or just use a generic team fetch.
                    // Actually, let's rely on a new generic user fetch or the team-leader one.
                    // Simpler: Reuse /api/team if available or /api/users/managers (but that's for managers).

                    // Let's call /api/team if user is Director/Manager, or /api/dashboard/team-leader if TL
                    const userRole = (session.user as any).role;
                    let usersUrl = '';

                    if (userRole === 'TEAM_LEADER') {
                        const res = await fetch('/api/dashboard/team-leader');
                        if (res.ok) {
                            const data = await res.json();
                            // The API returns { stats: ..., team: [...] }
                            setTeamMembers(data.team);
                            // Ensure the TL can also assign to themselves (they might not be in the 'team' array of subordinates)
                            // We can add "Me" option manually in the UI check
                        }
                    } else if (['DIRECTOR', 'MANAGER'].includes(userRole)) {
                        // Managers can assign to anyone usually
                        // We might need a generic /api/users/all endpoint or similar.
                        // For now let's reuse /api/team which returns users with hierarchy
                        const res = await fetch('/api/team');
                        if (res.ok) {
                            const data = await res.json();
                            // flatten hierarchy or just use the list
                            // The API returns { users: [...], meta: ... }
                            setTeamMembers(data.users || []);
                        }
                    }

                } catch (error) {
                    console.error("Failed to load form data", error);
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchData();
        }
    }, [isOpen, session]);

    const onSubmit = async (data: TaskFormValues) => {
        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                reset();
                onTaskCreated();
                onClose();
            } else {
                console.error("Failed to create task");
            }
        } catch (error) {
            console.error("Error submitting task:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE1E6]">
                    <h2 className="text-lg font-bold text-[#172B4D]">Create New Task</h2>
                    <button onClick={onClose} className="text-[#6B778C] hover:text-[#172B4D] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#6B778C] uppercase">Task Title</label>
                        <input
                            {...register('title')}
                            placeholder="What needs to be done?"
                            className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF] outline-none transition-all"
                        />
                        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#6B778C] uppercase">Description</label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            placeholder="Add details..."
                            className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF] outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Project */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#6B778C] uppercase flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> Project
                            </label>
                            <select
                                {...register('projectId')}
                                className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF] outline-none transition-all"
                            >
                                <option value="">No Project</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Assignee */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#6B778C] uppercase flex items-center gap-1">
                                <UserIcon className="w-3 h-3" /> Assign To
                            </label>
                            <select
                                {...register('assignedToId')}
                                className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF] outline-none transition-all"
                            >
                                <option value="">Select Member...</option>
                                <option value={(session?.user as any)?.id}>Me (Self)</option>
                                {teamMembers.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                            {errors.assignedToId && <p className="text-xs text-red-500">{errors.assignedToId.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Deadline */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#6B778C] uppercase flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Due Date
                            </label>
                            <input
                                type="date"
                                {...register('deadline')}
                                className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF] outline-none transition-all"
                            />
                        </div>

                        {/* Priority */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#6B778C] uppercase flex items-center gap-1">
                                <Flag className="w-3 h-3" /> Priority
                            </label>
                            <select
                                {...register('priority')}
                                className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF] outline-none transition-all"
                            >
                                <option value="1">Low</option>
                                <option value="2">Medium</option>
                                <option value="3">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DFE1E6]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-[#42526E] hover:bg-gray-100 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 text-sm font-medium text-white bg-[#0052CC] hover:bg-[#0065FF] rounded shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
