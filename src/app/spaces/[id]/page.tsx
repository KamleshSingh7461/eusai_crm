"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Briefcase,
    Users,
    Target,
    Layout,
    ArrowLeft,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Activity,
    Clock,
    CheckCircle2,
    FileText,
    Loader2,
    AlertTriangle,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    budget: number; // Decimal string or number from JSON
    expenses: any[];
    _count: {
        tasks: number;
        milestones: number;
    };
}

interface Space {
    id: string;
    name: string;
    description: string;
    color: string;
    type: string;
    projects: Project[];
    resources: any[];
    wikiPages: any[];
    recentActivities: any[];
    _count: {
        projects: number;
        resources: number;
        issues: number;
        milestones: number;
    };
}

export default function SpaceDashboardPage() {
    const { id } = useParams();
    const router = useRouter();
    const [space, setSpace] = useState<Space | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) fetchSpaceDetails();
    }, [id]);

    const fetchSpaceDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/spaces/${id}`);
            if (res.ok) {
                setSpace(await res.json());
            } else {
                console.error("Failed to load space");
            }
        } catch (error) {
            console.error("Network error fetching space:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[var(--notion-bg-primary)]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2383e2]" />
                    <p className="text-[var(--notion-text-tertiary)] font-bold text-xs uppercase tracking-widest">Loading Workspace...</p>
                </div>
            </div>
        );
    }

    if (!space) {
        return (
            <div className="p-12 text-center bg-[var(--notion-bg-primary)] h-full min-h-screen flex items-center justify-center">
                <div className="max-w-md w-full p-8 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm">
                    <AlertTriangle className="w-12 h-12 text-[#FFAB00] mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-[var(--notion-text-primary)] mb-2">Space Not Found</h2>
                    <p className="text-[var(--notion-text-secondary)] mb-6 text-sm">The space you are looking for doesn't exist or acts as a ghost in the machine.</p>
                    <button
                        onClick={() => router.push('/spaces')}
                        className="w-full px-4 py-2 bg-[#2383e2] text-white rounded-sm font-bold text-sm hover:bg-[#1a6fcc] transition-colors"
                    >
                        Return to Directory
                    </button>
                </div>
            </div>
        );
    }

    // Calculators

    const totalTasks = space.projects.reduce((sum, p) => sum + p._count.tasks, 0);

    return (
        <div className="animate-in fade-in duration-500 pb-12 bg-[var(--notion-bg-primary)] min-h-screen">
            {/* Cover Image & Header */}
            <div className="relative h-48 w-full group">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-40 transition-opacity group-hover:opacity-50"
                    style={{
                        backgroundColor: space.color,
                        backgroundImage: `url('/patterns/topography.svg'), linear-gradient(to bottom, ${space.color}, var(--notion-bg-primary))`
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--notion-bg-primary)] via-[var(--notion-bg-primary)]/50 to-transparent" />

                <div className="max-w-7xl mx-auto px-6 md:px-8 h-full flex items-end pb-6 relative z-10">
                    <button
                        onClick={() => router.push('/spaces')}
                        className="absolute top-6 left-6 md:left-8 flex items-center gap-2 text-[var(--notion-text-tertiary)] hover:text-[var(--notion-text-primary)] text-xs font-bold transition-colors bg-[var(--notion-bg-primary)]/50 backdrop-blur-sm px-3 py-1.5 rounded-sm border border-transparent hover:border-[var(--notion-border-default)]"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Directory
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end gap-6 w-full">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-sm bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] flex items-center justify-center shadow-lg -mb-2 md:-mb-4 transform rotate-1 transition-transform group-hover:rotate-0">
                            <span className="text-4xl" style={{ color: space.color }}>
                                {space.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 mb-2">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl md:text-4xl font-bold text-[var(--notion-text-primary)] tracking-tight">{space.name}</h1>
                                <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-[var(--notion-bg-tertiary)] text-[var(--notion-text-secondary)] border border-[var(--notion-border-default)]">
                                    {space.type}
                                </span>
                            </div>
                            <p className="text-[var(--notion-text-secondary)] text-sm md:text-base max-w-2xl">
                                {space.description || "Mission workspace for EUSAI strategic initiatives."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-7xl mx-auto px-6 md:px-8 mt-8">
                {/* Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm">
                        <div className="flex items-center gap-2 mb-2 text-[var(--notion-text-tertiary)]">
                            <Briefcase className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Active Projects</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--notion-text-primary)]">{space._count.projects}</p>
                    </div>
                    <div className="p-4 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm">
                        <div className="flex items-center gap-2 mb-2 text-[var(--notion-text-tertiary)]">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Total Tasks</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--notion-text-primary)]">{totalTasks}</p>
                    </div>
                    <div className="p-4 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm">
                        <div className="flex items-center gap-2 mb-2 text-[var(--notion-text-tertiary)]">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Resources</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--notion-text-primary)]">{space._count.resources}</p>
                    </div>
                    <div className="p-4 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm">
                        <div className="flex items-center gap-2 mb-2 text-[var(--notion-text-tertiary)]">
                            <Target className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Milestones</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--notion-text-primary)]">{space._count.milestones}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Feed - Left 2 Columns */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Projects List */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-[var(--notion-text-tertiary)] uppercase tracking-widest flex items-center gap-2">
                                    <Layout className="w-4 h-4" /> Operations
                                </h3>
                                <Link
                                    href="/projects"
                                    className="text-xs font-bold text-[#2383e2] hover:underline flex items-center gap-1"
                                >
                                    View All <ChevronRight className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm overflow-hidden">
                                {space.projects.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <p className="text-sm text-[var(--notion-text-tertiary)]">No initialized operations.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[var(--notion-border-default)]">
                                        {space.projects.map(project => (
                                            <div key={project.id} className="p-4 hover:bg-[var(--notion-bg-tertiary)] transition-colors group">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-[var(--notion-text-primary)] group-hover:text-[#2383e2] transition-colors">
                                                            {project.name}
                                                        </h4>
                                                        <p className="text-xs text-[var(--notion-text-tertiary)] line-clamp-1 mt-0.5">
                                                            {project.description || "No mission brief."}
                                                        </p>
                                                    </div>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase",
                                                        project.status === 'EXECUTION' ? "bg-[#36B37E]/20 text-[#36B37E]" :
                                                            project.status === 'PLANNING' ? "bg-[#2383e2]/20 text-[#2383e2]" :
                                                                "bg-[var(--notion-bg-tertiary)] text-[var(--notion-text-tertiary)]"
                                                    )}>
                                                        {project.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--notion-text-secondary)]">
                                                        <CheckCircle2 className="w-3 h-3 text-[#36B37E]" />
                                                        {project._count.tasks} Tasks
                                                    </div>

                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Recent Activity */}
                        <section>
                            <h3 className="text-sm font-bold text-[var(--notion-text-tertiary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Space Pulse
                            </h3>
                            <div className="space-y-3">
                                {space.recentActivities.length === 0 ? (
                                    <p className="text-sm text-[var(--notion-text-tertiary)] italic">No recent activity recorded.</p>
                                ) : (
                                    (() => {
                                        // Activity Grouping Logic
                                        const groupedActivities: any[] = [];
                                        let currentGroup: any = null;

                                        space.recentActivities.forEach((activity: any) => {
                                            const isSameGroup = currentGroup &&
                                                currentGroup.user.name === activity.user.name &&
                                                currentGroup.action === activity.action &&
                                                currentGroup.project.name === activity.project.name &&
                                                (new Date(currentGroup.timestamp).getTime() - new Date(activity.timestamp).getTime() < 3600000); // 1 hour window

                                            if (isSameGroup) {
                                                currentGroup.count++;
                                            } else {
                                                if (currentGroup) groupedActivities.push(currentGroup);
                                                currentGroup = { ...activity, count: 1 };
                                            }
                                        });
                                        if (currentGroup) groupedActivities.push(currentGroup);

                                        return groupedActivities.map((activity: any) => {
                                            // Format action text
                                            const formatAction = (action: string, count: number) => {
                                                const formatted = action.replace(/_/g, ' ').toLowerCase();
                                                if (count > 1) {
                                                    // Pluralize if needed, simplistic approach
                                                    return `${formatted} (${count} times)`;
                                                }
                                                return formatted;
                                            };

                                            return (
                                                <div key={activity.id} className="flex gap-3 items-start p-3 rounded-sm hover:bg-[var(--notion-bg-secondary)] border border-transparent hover:border-[var(--notion-border-default)] transition-colors">
                                                    <div className="mt-0.5 w-6 h-6 rounded-full bg-[var(--notion-bg-tertiary)] flex items-center justify-center text-[10px] font-bold text-[var(--notion-text-secondary)] border border-[var(--notion-border-default)] shrink-0">
                                                        {activity.user.name[0]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-[var(--notion-text-primary)]">
                                                            <span className="font-bold">{activity.user.name}</span>
                                                            <span className="text-[var(--notion-text-secondary)]"> {formatAction(activity.action, activity.count)} </span>
                                                            <span className="text-[var(--notion-text-tertiary)]">in</span>
                                                            <span className="font-bold text-[#2383e2]"> {activity.project.name}</span>
                                                        </p>
                                                        <p className="text-[10px] text-[var(--notion-text-tertiary)] mt-1 flex items-center gap-1">
                                                            <Clock className="w-2.5 h-2.5" />
                                                            {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-8">


                        {/* Personnel */}
                        <section>
                            <h3 className="text-xs font-bold text-[var(--notion-text-tertiary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" /> Personnel
                            </h3>
                            <div className="space-y-2">
                                {space.resources.filter(r => r.type === 'PERSONNEL').length === 0 ? (
                                    <p className="text-xs text-[var(--notion-text-tertiary)]">No personnel assigned.</p>
                                ) : (
                                    space.resources.filter(r => r.type === 'PERSONNEL').map((res: any) => (
                                        <div key={res.id} className="flex items-center gap-3 p-2 hover:bg-[var(--notion-bg-secondary)] rounded-sm transition-colors border border-transparent hover:border-[var(--notion-border-default)]">
                                            <div className="w-6 h-6 rounded-full bg-[#2383e2]/20 flex items-center justify-center font-bold text-[#2383e2] text-[10px]">
                                                {res.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-[var(--notion-text-primary)] truncate">{res.name}</p>
                                                <p className="text-[9px] text-[var(--notion-text-tertiary)] uppercase font-bold">{res.role || 'Member'}</p>
                                            </div>
                                            <div className="text-[9px] font-mono text-[var(--notion-text-tertiary)]">
                                                {res.status}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Wiki */}
                        <section>
                            <h3 className="text-xs font-bold text-[var(--notion-text-tertiary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" /> Knowledge
                            </h3>
                            <div className="space-y-1">
                                {space.wikiPages.length === 0 ? (
                                    <p className="text-xs text-[var(--notion-text-tertiary)]">No documentation.</p>
                                ) : (
                                    space.wikiPages.map((page: any) => (
                                        <Link
                                            key={page.id}
                                            href={`/wiki/${page.id}`}
                                            className="block p-2 text-xs text-[var(--notion-text-secondary)] hover:bg-[var(--notion-bg-secondary)] rounded-sm transition-colors truncate hover:text-[#2383e2]"
                                        >
                                            {page.title}
                                        </Link>
                                    ))
                                )}
                                <button className="w-full text-left p-2 text-xs text-[var(--notion-text-tertiary)] hover:bg-[var(--notion-bg-secondary)] rounded-sm transition-colors flex items-center gap-2">
                                    <Plus className="w-3 h-3" /> New Page
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
