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
    Loader2,
    Rocket,
    Briefcase,
    FileText,
    Layout,
    User
} from 'lucide-react';
import Button from '@/components/ui/Button';

const projectSchema = z.object({
    name: z.string().min(3, 'Project name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    startDate: z.string(),
    endDate: z.string(),

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
        <div className="min-h-screen bg-[var(--notion-bg-primary)] py-8 font-sans text-[var(--notion-text-primary)] animate-in fade-in duration-500">
            <div className="max-w-2xl mx-auto px-4">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-[var(--notion-bg-tertiary)] rounded-sm text-[var(--notion-text-tertiary)] hover:text-[var(--notion-text-primary)] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                            <Rocket className="w-6 h-6 text-[#2383e2]" />
                            Initiate New Mission
                        </h1>
                        <p className="text-[var(--notion-text-tertiary)]">Define parameters for the new strategic initiative.</p>
                    </div>
                </div>

                <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[var(--notion-border-default)]">
                        <h2 className="text-lg font-bold">Mission Charter</h2>
                        <p className="text-sm text-[var(--notion-text-tertiary)]">Core details and ownership assignment.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                        {/* Project Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Mission Name
                            </label>
                            <input
                                {...register('name')}
                                placeholder="e.g., Q3 Expansion Initiative"
                                className="w-full bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] rounded-sm py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#2383e2] transition-all text-[var(--notion-text-primary)] placeholder-[var(--notion-text-disabled)]"
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Strategic Objectives
                            </label>
                            <textarea
                                {...register('description')}
                                rows={4}
                                placeholder="Describe the mission goals and success criteria..."
                                className="w-full bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] rounded-sm py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#2383e2] transition-all text-[var(--notion-text-primary)] placeholder-[var(--notion-text-disabled)] resize-none"
                            />
                            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                        </div>

                        {/* Space & Manager */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider flex items-center gap-2">
                                    <Layout className="w-4 h-4" /> Space / Department
                                </label>
                                <div className="relative">
                                    <select
                                        {...register('spaceId')}
                                        className="w-full bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] rounded-sm py-2 px-4 appearance-none focus:outline-none focus:ring-1 focus:ring-[#2383e2] transition-all text-[var(--notion-text-primary)]"
                                    >
                                        <option value="">Select Space...</option>
                                        {spaces.map((space) => (
                                            <option key={space.id} value={space.id}>
                                                {space.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-[var(--notion-text-tertiary)]">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider flex items-center gap-2">
                                    <User className="w-4 h-4" /> Mission Lead
                                </label>
                                <div className="relative">
                                    <select
                                        {...register('managerId')}
                                        className="w-full bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] rounded-sm py-2 px-4 appearance-none focus:outline-none focus:ring-1 focus:ring-[#2383e2] transition-all text-[var(--notion-text-primary)]"
                                    >
                                        <option value="">Select Manager...</option>
                                        {managers.map((manager) => (
                                            <option key={manager.id} value={manager.id}>
                                                {manager.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-[var(--notion-text-tertiary)]">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                                {errors.managerId && <p className="text-xs text-red-500">{errors.managerId.message}</p>}
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="pt-4 border-t border-[var(--notion-border-default)]">
                            <h3 className="text-sm font-bold text-[var(--notion-text-secondary)] mb-4 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Timeline
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider">Start Date</label>
                                    <input
                                        {...register('startDate')}
                                        type="date"
                                        className="w-full bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] rounded-sm py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#2383e2] transition-all text-[var(--notion-text-primary)]"
                                    />
                                    {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider">Target Completion</label>
                                    <input
                                        {...register('endDate')}
                                        type="date"
                                        className="w-full bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] rounded-sm py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#2383e2] transition-all text-[var(--notion-text-primary)]"
                                    />
                                    {errors.endDate && <p className="text-xs text-red-500">{errors.endDate.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => router.back()}
                                className="bg-[var(--notion-bg-tertiary)] text-[var(--notion-text-primary)] hover:bg-[var(--notion-bg-hover)] border-0"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                isLoading={isSubmitting}
                                className="bg-[#2383e2] hover:bg-[#1a6fcc] text-white"
                            >
                                Initiate Mission
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
