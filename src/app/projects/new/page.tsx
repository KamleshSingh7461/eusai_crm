"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    ArrowLeft,
    Save,
    Target,
    Calendar,
    DollarSign,
    Users,
    AlertCircle,
    Loader2
} from 'lucide-react';

const projectSchema = z.object({
    name: z.string().min(3, 'Project name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    startDate: z.string(),
    endDate: z.string(),
    budget: z.number().positive('Budget must be a positive number'),
    managerId: z.string().min(1, 'Please select a project manager'),
    spaceId: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface User {
    id: string;
    name: string;
    role: string;
    email: string;
}

interface Space {
    id: string;
    name: string;
}

export default function NewProjectPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [managers, setManagers] = useState<User[]>([]);
    const [isLoadingManagers, setIsLoadingManagers] = useState(true);
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);

    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            startDate: new Date().toISOString().split('T')[0],
            budget: 0,
        }
    });

    useEffect(() => {
        const fetchManagers = async () => {
            try {
                const response = await fetch('/api/users/managers');
                if (response.ok) {
                    const data = await response.json();
                    setManagers(data);

                    // Smart Default: Pre-select current user's manager if available in session
                    // Note: This requires managerId to be allowed in the session extended type
                    const currentUserManagerId = (session?.user as any)?.managerId;
                    if (currentUserManagerId) {
                        // Verify if the manager is in the fetched list (to be safe)
                        const managerExists = data.some((m: User) => m.id === currentUserManagerId);
                        if (managerExists) {
                            setValue('managerId', currentUserManagerId);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load managers", error);
            } finally {
                setIsLoadingManagers(false);
            }
        };

        const fetchSpaces = async () => {
            try {
                const response = await fetch('/api/spaces');
                if (response.ok) {
                    const data = await response.json();
                    setSpaces(data);
                }
            } catch (error) {
                console.error("Failed to load spaces", error);
            } finally {
                setIsLoadingSpaces(false);
            }
        };

        if (session) {
            fetchManagers();
            fetchSpaces();
        }
    }, [session, setValue]);

    const onSubmit = async (data: ProjectFormValues) => {
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                router.push('/projects');
            } else {
                const err = await response.json();
                console.error("Project creation failed", err);
                alert(`Failed to create project: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to create project:', error);
            alert('Network error. Please try again.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[#6B778C] hover:text-[#172B4D] transition-colors text-sm font-medium"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </button>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#172B4D]">Project Initiation</h1>
                    <p className="text-[#6B778C]">Define the scope, objectives, and allocate initial resources.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* General Information */}
                    <div className="card-eusai p-8 bg-white space-y-6">
                        <div className="flex items-center gap-2 text-[#0052CC] mb-2">
                            <Target className="w-5 h-5" />
                            <h2 className="font-bold text-lg text-[#172B4D]">General Information</h2>
                        </div>

                        <div className="space-y-2 text-[#F4F5F7] bg-[#172B4D] p-4 rounded-sm border-l-4 border-l-[#00B8D9] mb-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#00B8D9]">Organization Space / Vertical</label>
                            {isLoadingSpaces ? (
                                <div className="flex items-center gap-2 text-xs text-white/60">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Loading Spaces...
                                </div>
                            ) : (
                                <select
                                    {...register('spaceId')}
                                    className="w-full bg-white/10 border border-white/20 rounded-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#00B8D9]/50 transition-all text-white text-sm font-bold"
                                >
                                    <option value="" className="text-[#172B4D]">Unassigned (Global Workspace)</option>
                                    {spaces.map(space => (
                                        <option key={space.id} value={space.id} className="text-[#172B4D]">
                                            {space.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <p className="text-[9px] text-white/50 italic">Linking a project to a Space enables departmental analytics.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">Project Name</label>
                            <input
                                {...register('name')}
                                placeholder="e.g. Infrastructure Upgrade 2026"
                                className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF] transition-all text-[#172B4D]"
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">Description / Scope</label>
                            <textarea
                                {...register('description')}
                                rows={4}
                                placeholder="Detailed objectives and scope of work..."
                                className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF] transition-all resize-none text-[#172B4D]"
                            />
                            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                        </div>
                    </div>

                    {/* Planning & Resources */}
                    <div className="card-eusai p-8 bg-white space-y-6">
                        <div className="flex items-center gap-2 text-[#0052CC] mb-2">
                            <Calendar className="w-5 h-5" />
                            <h2 className="font-bold text-lg text-[#172B4D]">Timeline & Budget</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">Start Date</label>
                                <input
                                    {...register('startDate')}
                                    type="date"
                                    placeholder="14-02-2026"
                                    className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF] transition-all text-[#172B4D]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">End Date</label>
                                <input
                                    {...register('endDate')}
                                    type="date"
                                    placeholder="dd-mm-yyyy"
                                    className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF] transition-all text-[#172B4D]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#6B778C] uppercase tracking-wider flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Allocated Budget
                            </label>
                            <input
                                {...register('budget', { valueAsNumber: true })}
                                type="number"
                                placeholder="0.00"
                                className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF] transition-all text-[#172B4D]"
                            />
                            {errors.budget && <p className="text-xs text-red-500">{errors.budget.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#6B778C] uppercase tracking-wider flex items-center gap-2">
                                <Users className="w-4 h-4" /> Project Manager
                            </label>
                            {isLoadingManagers ? (
                                <div className="flex items-center gap-2 text-sm text-[#6B778C]">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading Managers...
                                </div>
                            ) : (
                                <select
                                    {...register('managerId')}
                                    className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF] transition-all text-[#172B4D]"
                                >
                                    <option value="">Assign a manager...</option>
                                    {managers.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.role})
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.managerId && <p className="text-xs text-red-500">{errors.managerId.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 p-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2 text-[#42526E] hover:text-[#172B4D] font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-jira-create px-12 py-3 h-auto text-base shadow-sm disabled:opacity-50"
                    >
                        {isSubmitting ? 'Creating...' : (
                            <>
                                <Save className="w-5 h-5 mx-2" />
                                Initiate Project
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
