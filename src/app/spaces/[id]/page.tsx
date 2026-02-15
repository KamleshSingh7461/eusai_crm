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
    TrendingUp,
    ChevronRight,
    PieChart,
    ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Space {
    id: string;
    name: string;
    description: string;
    color: string;
    type: string;
    projects: any[];
    resources: any[];
    wikiPages: any[];
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
    const [activeTab, setActiveTab] = useState('OVERVIEW');

    useEffect(() => {
        if (id) fetchSpaceDetails();
    }, [id]);

    const fetchSpaceDetails = async () => {
        setIsLoading(true);
        try {
            console.log(`[DEBUG] Fetching space: ${id}`);
            const res = await fetch(`/api/spaces/${id}`);
            if (res.ok) {
                setSpace(await res.json());
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error(`[DEBUG] Failed to load space. Status: ${res.status}`, errorData);
                // We could set a specific error state here if needed
            }
        } catch (error) {
            console.error("[DEBUG] Network error fetching space:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#FAFBFC]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#0052CC]" />
                    <p className="text-[#6B778C] font-bold text-sm uppercase tracking-widest">Entering Space Workspace...</p>
                </div>
            </div>
        );
    }

    if (!space) {
        return (
            <div className="p-12 text-center bg-[#FAFBFC] h-full">
                <div className="max-w-md mx-auto p-10 bg-white border border-[#DFE1E6] rounded-sm shadow-sm">
                    <AlertTriangle className="w-16 h-16 text-[#FFAB00] mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-[#172B4D] mb-2">Space Not Found</h2>
                    <p className="text-[#6B778C] mb-4 text-sm">The space you are looking for doesn't exist or you don't have permission to access it.</p>
                    <p className="text-[10px] text-[#6B778C] mb-8 font-mono bg-[#F4F5F7] p-2 rounded-sm break-all">ID: {id}</p>
                    <button
                        onClick={() => router.push('/spaces')}
                        className="px-6 py-2 bg-[#0052CC] text-white rounded-sm font-bold text-sm hover:bg-[#0747A6] transition-colors"
                    >
                        Back to Directory
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 pb-12">
            {/* Space Header Banner */}
            <div className="relative h-40 w-full overflow-hidden" style={{ backgroundColor: space.color }}>
                <div className="absolute inset-0 opacity-10 bg-[url('/grid.svg')] bg-repeat shadow-inner" />
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="max-w-7xl mx-auto px-8 h-full flex items-end pb-8 relative z-10">
                    <button
                        onClick={() => router.push('/spaces')}
                        className="absolute top-6 left-8 flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        SPACES DIRECTORY
                    </button>

                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-lg bg-white p-1 shadow-2xl transform -rotate-2">
                            <div
                                className="w-full h-full rounded-sm flex items-center justify-center text-white text-2xl font-black"
                                style={{ backgroundColor: space.color }}
                            >
                                {space.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                        </div>
                        <div className="text-white">
                            <h1 className="text-3xl font-black tracking-tight">{space.name}</h1>
                            <div className="flex items-center gap-3 mt-1 opacity-90">
                                <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 bg-white/20 rounded-sm">
                                    {space.type}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-white/50" />
                                <span className="text-xs font-medium italic">{space.description || "Mission workspace for EUSAI strategic verticals."}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-7xl mx-auto px-8 mt-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Active Projects', value: space._count.projects, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Space Resources', value: space._count.resources, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Tracked Milestones', value: space._count.milestones, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Active Issues', value: space._count.issues, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
                    ].map((stat, idx) => (
                        <div key={idx} className="card-jira p-5 border-[#DFE1E6] bg-white group hover:border-blue-400 transition-all">
                            <div className="flex items-center justify-between">
                                <div className={cn("p-2 rounded-sm", stat.bg)}>
                                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                                <span className="text-2xl font-bold text-[#172B4D]">{stat.value}</span>
                            </div>
                            <p className="mt-4 text-[10px] font-bold text-[#6B778C] uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Projects Section */}
                        <div className="bg-white border border-[#DFE1E6] rounded-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                                <h3 className="font-bold text-[#172B4D] flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-[#0052CC]" />
                                    Active Initiatives
                                </h3>
                                <Link href="/projects" className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1">
                                    Manage All <ExternalLink className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="divide-y divide-[#DFE1E6]">
                                {space.projects.length === 0 ? (
                                    <div className="p-12 text-center text-[#6B778C]">
                                        <p className="text-sm">No projects currently linked to this space.</p>
                                    </div>
                                ) : (
                                    space.projects.map((project: any) => (
                                        <div key={project.id} className="p-6 hover:bg-[#FAFBFC] transition-colors group">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-[#172B4D] group-hover:text-[#0052CC] transition-colors">{project.name}</h4>
                                                    <p className="text-xs text-[#6B778C] line-clamp-1">{project.description}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-tight",
                                                        project.status === 'EXECUTION' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                    )}>
                                                        {project.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 mt-4">
                                                <div className="flex -space-x-2">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-[#DFE1E6] flex items-center justify-center text-[8px] font-bold text-[#42526E]">
                                                            U{i}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex-1 h-1.5 bg-[#EBECF0] rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#36B37E]" style={{ width: '65%' }} />
                                                </div>
                                                <span className="text-[10px] font-bold text-[#6B778C]">65% COMPLETE</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recent Intelligence (Wiki/Docs) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-[#DFE1E6] rounded-sm p-6">
                                <h3 className="font-bold text-[#172B4D] mb-4 flex items-center gap-2">
                                    <PieChart className="w-4 h-4 text-[#6554C0]" />
                                    Knowledge Base
                                </h3>
                                <div className="space-y-4">
                                    {space.wikiPages.length === 0 ? (
                                        <p className="text-xs text-[#6B778C]">No documentation yet.</p>
                                    ) : (
                                        space.wikiPages.map((page: any) => (
                                            <div key={page.id} className="flex items-center gap-3 group cursor-pointer">
                                                <div className="p-2 bg-[#EAE6FF] rounded-sm group-hover:bg-[#6554C0] transition-colors">
                                                    <FileText className="w-4 h-4 text-[#6554C0] group-hover:text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#172B4D] group-hover:text-[#0052CC]">{page.title}</p>
                                                    <p className="text-[10px] text-[#6B778C]">Updated {new Date(page.updatedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="bg-[#172B4D] rounded-sm p-6 text-white overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                                    <TrendingUp className="w-32 h-32" />
                                </div>
                                <h3 className="font-bold mb-4 flex items-center gap-2 relative z-10">
                                    <Activity className="w-4 h-4 text-[#00B8D9]" />
                                    Space Pulse
                                </h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="p-3 bg-white/10 rounded-sm border border-white/10">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#00B8D9]">Current Velocity</p>
                                        <p className="text-2xl font-black">12.4 <span className="text-sm font-normal text-white/60">tasks/week</span></p>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-sm border border-white/10">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFAB00]">Budget Stability</p>
                                        <p className="text-2xl font-black">Stable <span className="text-sm font-normal text-white/60">at 84% usage</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Context Panel */}
                    <div className="space-y-6">
                        <div className="bg-[#DEEBFF] rounded-sm p-6 border border-[#B3D4FF]">
                            <h3 className="font-bold text-[#0747A6] mb-2 flex items-center gap-2 text-sm uppercase">
                                <Layout className="w-4 h-4" />
                                Quick Actions
                            </h3>
                            <div className="space-y-2 mt-4">
                                <button className="w-full flex items-center gap-3 px-4 py-2 bg-white text-[#0052CC] font-bold text-xs rounded-sm hover:bg-[#F4F5F7] transition-colors shadow-sm">
                                    <Plus className="w-3.5 h-3.5" /> New Initiative
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-2 bg-white text-[#0052CC] font-bold text-xs rounded-sm hover:bg-[#F4F5F7] transition-colors shadow-sm">
                                    <Users className="w-3.5 h-3.5" /> Add Resource
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-2 bg-white text-[#0052CC] font-bold text-xs rounded-sm hover:bg-[#F4F5F7] transition-colors shadow-sm">
                                    <FileText className="w-3.5 h-3.5" /> Space Wiki
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-[#DFE1E6] rounded-sm p-6">
                            <h3 className="font-bold text-[#172B4D] mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-[#6B778C]" />
                                Allocated Personnel
                            </h3>
                            <div className="space-y-4">
                                {space.resources.filter(r => r.type === 'PERSONNEL').length === 0 ? (
                                    <p className="text-xs text-[#6B778C]">No personnel assigned yet.</p>
                                ) : (
                                    space.resources.filter(r => r.type === 'PERSONNEL').map((res: any) => (
                                        <div key={res.id} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#F4F5F7] flex items-center justify-center font-bold text-[#0052CC] text-[10px] border border-[#DFE1E6]">
                                                {res.name.charAt(0)}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold text-[#172B4D] truncate">{res.name}</p>
                                                <p className="text-[9px] text-[#6B778C] uppercase font-bold">{res.role || 'MEMBER'}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
