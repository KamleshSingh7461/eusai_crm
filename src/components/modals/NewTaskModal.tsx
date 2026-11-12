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
import Modal, { ModalIcon } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { FieldLabel, fieldClass, fieldErrorClass } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

const taskSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().optional().or(z.literal('')),
    deadline: z.string().min(1, 'Deadline is required'),
    priority: z.string().min(1, 'Priority is required'),
    projectId: z.string().optional().or(z.literal('')),
    assignedToId: z.string().optional().or(z.literal('')),
    assignedToIds: z.array(z.string()).optional(),
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
    defaultProjectId?: string;
    defaultSpaceId?: string;
}

export default function NewTaskModal({ isOpen, onClose, onTaskCreated, defaultProjectId, defaultSpaceId }: NewTaskModalProps) {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            priority: '1',
            status: 'TODO',
            deadline: new Date().toISOString().split('T')[0],
            category: 'CUSTOM',
            projectId: defaultProjectId || ''
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
                        const data = await projectsRes.json();
                        if (defaultSpaceId) {
                            const filtered = data.filter((p: any) => p.spaceId === defaultSpaceId);
                            setProjects(filtered);
                            if (filtered.length > 0 && !defaultProjectId) {
                                setValue('projectId', filtered[0].id);
                            }
                        } else {
                            setProjects(data);
                        }
                    }

                    // 2. Fetch Team Members (for picking assignee)
                    const userRole = (session.user as any).role;
                    const res = await fetch('/api/team');
                    if (res.ok) {
                        const data = await res.json();
                        setTeamMembers((data.users || []).filter((u: any) => !u.isSuspended));
                    }

                } catch (error) {
                    console.error("Failed to load form data", error);
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchData();
            if (defaultProjectId) {
                setValue('projectId', defaultProjectId);
            }
        }
    }, [isOpen, session, defaultSpaceId, defaultProjectId]);

    const toggleAssignee = (id: string) => {
        setSelectedAssignees(prev =>
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    const onSubmit = async (values: TaskFormValues) => {
        try {
            const submitData = {
                ...values,
                assignedToIds: isMultiSelectMode ? selectedAssignees : (values.assignedToId ? [values.assignedToId] : [])
            };

            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
            });

            if (response.ok) {
                reset();
                setSelectedAssignees([]);
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

    const me = (session?.user as any)?.id;
    const priority = watch('priority');
    const PRIORITIES = [
        { val: '1', label: 'Low', active: 'border-zinc-500/50 bg-zinc-700/40 text-zinc-100' },
        { val: '2', label: 'Medium', active: 'border-amber-500/50 bg-amber-500/15 text-amber-300' },
        { val: '3', label: 'High', active: 'border-rose-500/50 bg-rose-500/15 text-rose-300' },
    ];

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            size="md"
            title="New task"
            description="Assign work with a deadline and priority."
            icon={<ModalIcon><Briefcase /></ModalIcon>}
            onSubmit={handleSubmit(onSubmit)}
            footer={<>
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting} leftIcon={<Plus className="h-4 w-4" />}>Create task</Button>
            </>}
        >
            <div className="space-y-5">
                <div>
                    <FieldLabel htmlFor="task-title" required>Title</FieldLabel>
                    <input id="task-title" {...register('title')} placeholder="What needs to be done?" className={cn(fieldClass, errors.title && fieldErrorClass)} />
                    {errors.title && <p className="mt-1.5 text-xs text-rose-400">{errors.title.message}</p>}
                </div>

                <div>
                    <FieldLabel htmlFor="task-description">Description</FieldLabel>
                    <textarea id="task-description" {...register('description')} rows={3} placeholder="Add details and context" className={cn(fieldClass, 'h-auto resize-y py-2.5 leading-relaxed')} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <FieldLabel htmlFor="task-project">Project</FieldLabel>
                        <select id="task-project" {...register('projectId')} className={fieldClass}>
                            <option value="">No project</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <div className="flex items-baseline justify-between gap-2">
                            <FieldLabel htmlFor="task-assignee">{isMultiSelectMode ? 'Assignees' : 'Assignee'}</FieldLabel>
                            <button type="button" onClick={() => setIsMultiSelectMode(!isMultiSelectMode)} className="mb-1.5 text-xs font-medium text-blue-400 hover:text-blue-300">
                                {isMultiSelectMode ? 'Assign one person' : 'Assign several'}
                            </button>
                        </div>
                        {isMultiSelectMode ? (
                            <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-lg border border-[#2F2F35] bg-[#18181B] p-1.5">
                                {[...(session?.user ? [{ id: me, name: 'Me', role: 'Self' }] : []), ...teamMembers.filter(u => u.id !== me)].map(u => (
                                    <label key={u.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-[#1F1F23]">
                                        <input type="checkbox" checked={selectedAssignees.includes(u.id)} onChange={() => toggleAssignee(u.id)} className="h-4 w-4 rounded accent-blue-600" />
                                        <span className="text-sm text-zinc-200">{u.name}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <>
                                <select id="task-assignee" {...register('assignedToId')} className={cn(fieldClass, errors.assignedToId && fieldErrorClass)}>
                                    <option value="">Choose a person</option>
                                    <option value={me}>Me</option>
                                    {teamMembers.filter(u => u.id !== me).map(u => <option key={u.id} value={u.id}>{u.name} ({u.role.replace(/_/g, ' ').toLowerCase()})</option>)}
                                </select>
                                {errors.assignedToId && <p className="mt-1.5 text-xs text-rose-400">{errors.assignedToId.message}</p>}
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <FieldLabel htmlFor="task-deadline" required>Due date</FieldLabel>
                        <input id="task-deadline" type="date" {...register('deadline')} className={cn(fieldClass, '[color-scheme:dark]', errors.deadline && fieldErrorClass)} />
                        {errors.deadline && <p className="mt-1.5 text-xs text-rose-400">{errors.deadline.message}</p>}
                    </div>
                    <div>
                        <FieldLabel htmlFor="task-category">Category</FieldLabel>
                        <select id="task-category" {...register('category')} className={fieldClass}>
                            <option value="EUSAI_AGREEMENT">EUSAI agreement</option>
                            <option value="SPORTS_LOGO">Sports logo agreement</option>
                            <option value="MOU">MOU</option>
                            <option value="BUSINESS_ORDER">Business order</option>
                            <option value="CUSTOM">Other</option>
                        </select>
                    </div>
                </div>

                <div>
                    <FieldLabel>Priority</FieldLabel>
                    <div role="radiogroup" aria-label="Priority" className="grid grid-cols-3 gap-1.5">
                        {PRIORITIES.map(p => (
                            <button key={p.val} type="button" role="radio" aria-checked={priority === p.val} onClick={() => setValue('priority', p.val)}
                                className={cn('h-9 rounded-lg border text-sm font-medium transition-colors',
                                    priority === p.val ? p.active : 'border-[#2F2F35] bg-[#18181B] text-zinc-400 hover:text-zinc-200')}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <input type="hidden" {...register('priority')} />
                </div>

                {isLoadingData && <p className="flex items-center gap-2 text-xs text-zinc-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading projects and people…</p>}
            </div>
        </Modal>
    );
}
