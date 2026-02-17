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
import { cn } from '@/lib/utils';

const issueSchema = z.object({
    title: z.string().min(3, 'Summary is required'),
    description: z.string().optional(),
    projectId: z.string().optional().or(z.literal('')),
    severity: z.string().min(1, 'Severity is required'),
    owner: z.string().min(1, 'Assignee/Owner is required'),
    status: z.string().optional().or(z.literal('OPEN')),
    resolution: z.string().optional()
}).refine(data => {
    if (['CLOSED', 'RESOLVED'].includes(data.status || '') && (!data.resolution || data.resolution.length < 5)) {
        return false;
    }
    return true;
}, {
    message: "Resolution remarks are required when closing (min 5 chars)",
    path: ["resolution"]
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

    const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<IssueFormValues>({
        resolver: zodResolver(issueSchema),
        defaultValues: {
            severity: 'MEDIUM',
            status: 'OPEN',
            owner: (session?.user as any)?.name || ''
        }
    });

    const statusObj = watch('status');

    useEffect(() => {
        if (initialData) {
            reset({
                title: initialData.title,
                description: initialData.description || '',
                projectId: initialData.projectId || '',
                severity: initialData.severity,
                owner: initialData.owner,
                status: initialData.status,
                resolution: initialData.resolution || ''
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#2f3437] rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-[rgba(255,255,255,0.08)] max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.08)] bg-[#2b3033]">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-[rgba(255,255,255,0.9)] tracking-tight">
                            {initialData ? 'Update Issue' : 'Report Impediment'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-[rgba(255,255,255,0.4)] hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-wider">Summary</label>
                        <input
                            {...register('title')}
                            placeholder="Briefly describe the blocker..."
                            className="w-full bg-[#1D2125] border border-[rgba(255,255,255,0.1)] rounded-md px-3 py-2.5 text-sm text-white placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/40 focus:border-[#4C9AFF] transition-all"
                        />
                        {errors.title && <p className="text-xs text-[#FF5630] font-medium mt-1">{errors.title.message}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-wider">Description</label>
                        <textarea
                            {...register('description')}
                            placeholder="Provide operational context..."
                            rows={3}
                            className="w-full bg-[#1D2125] border border-[rgba(255,255,255,0.1)] rounded-md px-3 py-2.5 text-sm text-white placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/40 focus:border-[#4C9AFF] transition-all resize-y min-h-[80px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        {/* Project */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-wider flex items-center gap-1.5">
                                <Briefcase className="w-3 h-3" /> Project Link
                            </label>
                            <select
                                {...register('projectId')}
                                className="w-full bg-[#1D2125] border border-[rgba(255,255,255,0.1)] rounded-md px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/40 focus:border-[#4C9AFF] transition-all appearance-none"
                            >
                                <option value="">No Linked Project</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Owner/Assignee */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-wider flex items-center gap-1.5">
                                <UserIcon className="w-3 h-3" /> Owner
                            </label>
                            <input
                                {...register('owner')}
                                placeholder="Assignee"
                                className="w-full bg-[#1D2125] border border-[rgba(255,255,255,0.1)] rounded-md px-3 py-2.5 text-sm text-white placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/40 focus:border-[#4C9AFF] transition-all"
                            />
                            {errors.owner && <p className="text-xs text-[#FF5630] font-medium mt-1">{errors.owner.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        {/* Severity */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-wider flex items-center gap-1.5">
                                <Flag className="w-3 h-3" /> Severity Level
                            </label>
                            <select
                                {...register('severity')}
                                className="w-full bg-[#1D2125] border border-[rgba(255,255,255,0.1)] rounded-md px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/40 focus:border-[#4C9AFF] transition-all appearance-none"
                            >
                                <option value="CRITICAL">🔴 Critical Setup</option>
                                <option value="HIGH">🟠 High Priority</option>
                                <option value="MEDIUM">🟡 Medium</option>
                                <option value="LOW">🔵 Low</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-wider flex items-center gap-1.5">
                                <AlertTriangle className="w-3 h-3" /> Status
                            </label>
                            <select
                                {...register('status')}
                                className="w-full bg-[#1D2125] border border-[rgba(255,255,255,0.1)] rounded-md px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/40 focus:border-[#4C9AFF] transition-all appearance-none"
                            >
                                <option value="OPEN">Open Issue</option>
                                <option value="RESOLVING">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                        </div>
                    </div>

                    {/* Resolution Remarks (Conditional) */}
                    {['CLOSED', 'RESOLVED'].includes(statusObj || '') && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                            <label className="text-[10px] font-bold text-[#36B37E] uppercase tracking-wider">Resolution Remarks <span className='text-[#FF5630]'>*</span></label>
                            <textarea
                                {...register('resolution')}
                                placeholder="Details of resolution strategy..."
                                rows={3}
                                className="w-full bg-[#1D2125] border border-[#36B37E]/30 rounded-md px-3 py-2.5 text-sm text-white placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[#36B37E]/40 focus:border-[#36B37E] transition-all resize-y"
                            />
                            {errors.resolution && <p className="text-xs text-[#FF5630] font-medium mt-1">{errors.resolution.message}</p>}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-[rgba(255,255,255,0.08)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-colors uppercase tracking-wide"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 text-sm font-bold text-white bg-[#0052CC] hover:bg-[#0065FF] rounded-md shadow-[0_0_15px_rgba(0,82,204,0.3)] disabled:opacity-50 transition-all flex items-center gap-2 uppercase tracking-wide hover:transform hover:scale-105 active:scale-95"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {initialData ? 'Update Record' : 'Log Impediment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
