"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    X,
    AlertTriangle,
    Flag,
    Briefcase,
    User as UserIcon,
    Loader2
} from 'lucide-react';
import { useSession } from 'next-auth/react';

const issueSchema = z.object({
    title: z.string().min(3, 'Summary is required'),
    projectId: z.string().optional().or(z.literal('')),
    severity: z.string().min(1, 'Severity is required'),
    owner: z.string().min(1, 'Assignee/Owner is required'),
    status: z.string().optional().or(z.literal('OPEN'))
});

type IssueFormValues = z.infer<typeof issueSchema>;

interface Project {
    id: string;
    name: string;
}

interface IssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onIssueCreated: () => void;
    initialData?: any; // For editing
}

export default function IssueModal({ isOpen, onClose, onIssueCreated, initialData }: IssueModalProps) {
    const { data: session } = useSession();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<IssueFormValues>({
        resolver: zodResolver(issueSchema),
        defaultValues: {
            severity: 'MEDIUM',
            status: 'OPEN',
            owner: (session?.user as any)?.name || ''
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                title: initialData.title,
                projectId: initialData.projectId || '',
                severity: initialData.severity,
                owner: initialData.owner,
                status: initialData.status
            });
        }
    }, [initialData, reset]);

    useEffect(() => {
        if (isOpen && session) {
            const fetchData = async () => {
                setIsLoadingData(true);
                try {
                    const projectsRes = await fetch('/api/projects');
                    if (projectsRes.ok) {
                        setProjects(await projectsRes.json());
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

    const onSubmit = async (data: IssueFormValues) => {
        try {
            const url = initialData ? `/api/issues` : '/api/issues';
            const method = initialData ? 'PUT' : 'POST';
            const body = initialData ? { ...data, id: initialData.id } : data;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                reset();
                onIssueCreated();
                onClose();
            } else {
                console.error("Failed to save issue");
            }
        } catch (error) {
            console.error("Error saving issue:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-[#DFE1E6]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE1E6]">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-[#DE350B]" />
                        <h2 className="text-lg font-bold text-[#172B4D]">{initialData ? 'Update Issue' : 'Report New Impediment'}</h2>
                    </div>
                    <button onClick={onClose} className="text-[#6B778C] hover:text-[#172B4D] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#6B778C] uppercase">Summary</label>
                        <input
                            {...register('title')}
                            placeholder="Briefly describe the blocker..."
                            className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#DE350B]/20 focus:border-[#DE350B] outline-none transition-all"
                        />
                        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Project */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#6B778C] uppercase flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> Project
                            </label>
                            <select
                                {...register('projectId')}
                                className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#DE350B]/20 focus:border-[#DE350B] outline-none transition-all"
                            >
                                <option value="">No Project</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Owner/Assignee */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#6B778C] uppercase flex items-center gap-1">
                                <UserIcon className="w-3 h-3" /> Reporter / Owner
                            </label>
                            <input
                                {...register('owner')}
                                placeholder="Name of owner"
                                className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#DE350B]/20 focus:border-[#DE350B] outline-none transition-all"
                            />
                            {errors.owner && <p className="text-xs text-red-500">{errors.owner.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Severity */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#6B778C] uppercase flex items-center gap-1">
                                <Flag className="w-3 h-3" /> Severity
                            </label>
                            <select
                                {...register('severity')}
                                className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#DE350B]/20 focus:border-[#DE350B] outline-none transition-all"
                            >
                                <option value="CRITICAL">Critical</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#6B778C] uppercase flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Status
                            </label>
                            <select
                                {...register('status')}
                                className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#DE350B]/20 focus:border-[#DE350B] outline-none transition-all"
                            >
                                <option value="OPEN">Open</option>
                                <option value="RESOLVING">Resolving</option>
                                <option value="CLOSED">Closed</option>
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
                            className="px-6 py-2 text-sm font-medium text-white bg-[#DE350B] hover:bg-[#BF2600] rounded shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {initialData ? 'Update Issue' : 'Report Issue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
