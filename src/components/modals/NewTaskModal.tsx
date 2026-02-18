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
    Loader2,
    Plus
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';

const taskSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().optional().or(z.literal('')),
    deadline: z.string().min(1, 'Deadline is required'),
    priority: z.string().min(1, 'Priority is required'),
    projectId: z.string().optional().or(z.literal('')),
    assignedToId: z.string().optional().or(z.literal('')),
    status: z.string().optional().or(z.literal('')),
    category: z.string().min(1, 'Category is required')
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
    const { showToast } = useToast();
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            priority: '1',
            status: 'TODO',
            deadline: new Date().toISOString().split('T')[0],
            category: 'CUSTOM'
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
                    const userRole = (session.user as any).role;
                    const res = await fetch('/api/team');
                    if (res.ok) {
                        const data = await res.json();
                        setTeamMembers(data.users || []);
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
                showToast('Task created successfully', 'success');
                onTaskCreated();
                onClose();
            } else {
                const data = await response.json();
                showToast(data.error || 'Failed to create task', 'error');
            }
        } catch (error) {
            console.error("Error submitting task:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative bg-[#191919]/95 border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Glossy background detail */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0052CC] to-[#0747A6] flex items-center justify-center shadow-lg shadow-blue-900/20">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Create New Task</h2>
                            <p className="text-xs text-gray-400 font-medium">Define mission objectives and requirements</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 p-8 space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Task Title
                        </label>
                        <input
                            {...register('title')}
                            placeholder="What needs to be done?"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                        />
                        {errors.title && <p className="text-[10px] font-bold text-red-400 uppercase ml-1 animate-pulse">{errors.title.message}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Description
                        </label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            placeholder="Add mission details and context..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none font-medium leading-relaxed"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Project */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Briefcase className="w-3 h-3 text-blue-400" /> Project
                            </label>
                            <div className="relative">
                                <select
                                    {...register('projectId')}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/10 transition-all appearance-none cursor-pointer text-sm font-medium"
                                >
                                    <option value="" className="bg-[#191919]">No Project</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id} className="bg-[#191919]">{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Assignee */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <UserIcon className="w-3 h-3 text-purple-400" /> Assignee
                            </label>
                            <div className="relative">
                                <select
                                    {...register('assignedToId')}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/10 transition-all appearance-none cursor-pointer text-sm font-medium"
                                >
                                    <option value="" className="bg-[#191919]">Select Member...</option>
                                    <option value={(session?.user as any)?.id} className="bg-[#191919]">Assign to Me</option>
                                    {teamMembers.map(u => (
                                        <option key={u.id} value={u.id} className="bg-[#191919]">{u.name} ({u.role})</option>
                                    ))}
                                </select>
                                {errors.assignedToId && <p className="text-[10px] font-bold text-red-400 uppercase mt-1">{errors.assignedToId.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Deadline */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-green-400" /> Due Date
                            </label>
                            <input
                                type="date"
                                {...register('deadline')}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/10 transition-all cursor-pointer text-sm font-medium [color-scheme:dark]"
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Flag className="w-3 h-3 text-yellow-400" /> Category
                            </label>
                            <select
                                {...register('category')}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/10 transition-all appearance-none cursor-pointer text-sm font-medium"
                            >
                                <option value="EUSAI_AGREEMENT" className="bg-[#191919]">EUSAI Agreement</option>
                                <option value="SPORTS_LOGO" className="bg-[#191919]">Sports Logo Agreement</option>
                                <option value="MOU" className="bg-[#191919]">MOU Integration</option>
                                <option value="BUSINESS_ORDER" className="bg-[#191919]">Business Order</option>
                                <option value="CUSTOM" className="bg-[#191919]">Custom Task</option>
                            </select>
                        </div>
                    </div>

                    {/* Form Controls */}
                    <div className="flex items-center justify-between pt-6 border-t border-[rgba(255,255,255,0.06)]">
                        {/* Priority Section */}
                        <div className="flex items-center gap-4">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority:</label>
                            <div className="flex gap-2">
                                {[
                                    { val: '1', label: 'Low', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
                                    { val: '2', label: 'Med', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
                                    { val: '3', label: 'High', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
                                ].map(p => (
                                    <button
                                        key={p.val}
                                        type="button"
                                        onClick={() => setValue('priority', p.val)}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase border transition-all ${watch('priority') === p.val
                                                ? `${p.color} ring-2 ring-white/10 scale-105 shadow-lg`
                                                : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            <input type="hidden" {...register('priority')} />
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="relative group px-8 py-2.5 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-900/20 disabled:opacity-50 transition-all flex items-center gap-2 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                {isSubmitting ? 'Synchronizing...' : 'Initialize Task'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
