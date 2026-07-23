"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Briefcase,
    Users,
    Target,
    Layout,
    ArrowLeft,
    Plus,
    Activity,
    Clock,
    CheckCircle2,
    FileText,
    Loader2,
    AlertTriangle,
    ChevronRight,
    UserPlus,
    Calendar,
    ChevronDown,
    Flag,
    CheckSquare,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Modals
import ManageSpaceMembersModal from '@/components/modals/ManageSpaceMembersModal';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import CreateMilestoneModal from '@/components/modals/CreateMilestoneModal';
import NewTaskModal from '@/components/modals/NewTaskModal';
import MilestoneDetailModal from '@/components/modals/MilestoneDetailModal';
import TaskDetailModal from '@/components/modals/TaskDetailModal';

interface Milestone {
    id: string;
    title: string;
    description: string | null;
    category: string;
    priority?: string;
    status: string;
    progress: number;
    targetDate: string;
    owner?: string;
    isFlagged?: boolean;
    remarks?: string;
    updatedAt?: string;
    ownerUser?: {
        id: string;
        name: string | null;
        email: string;
        role: string;
        image: string | null;
    } | null;
}

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: number;
    deadline: string;
    updatedAt?: string;
    assignedTo?: {
        id: string;
        name: string | null;
        email: string;
        role: string;
        image: string | null;
    } | null;
}

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    budget: number;
    milestones: Milestone[];
    tasks: Task[];
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
    managerId?: string | null;
    projects: Project[];
    resources: any[];
    members: {
        id: string;
        name: string | null;
        email: string;
        role: string;
        image: string | null;
        isOnline: boolean;
    }[];
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
    const { data: session } = useSession();

    const [space, setSpace] = useState<Space | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [showManageMembersModal, setShowManageMembersModal] = useState(false);
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
    const [showCreateMilestoneModal, setShowCreateMilestoneModal] = useState(false);
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);
    const [selectedProjectIdForCreation, setSelectedProjectIdForCreation] = useState<string | undefined>(undefined);

    // Detail Modal States
    const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null);
    const [showMilestoneDetail, setShowMilestoneDetail] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [showTaskDetail, setShowTaskDetail] = useState(false);

    const currentUser = session?.user as any;
    const userRole = currentUser?.role;

    // RBAC: Director or Manager of this specific space
    const canManageSpace = userRole === 'DIRECTOR' || (userRole === 'MANAGER' && space?.managerId === currentUser?.id);
    const canCreateTasks = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);
    const canCreateMilestones = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);

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
                    <p className="text-[var(--notion-text-secondary)] mb-6 text-sm">The space you are looking for doesn't exist or has been decommissioned.</p>
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

    const totalTasks = space.projects.reduce((sum, p) => sum + (p.tasks?.length || p._count.tasks), 0);
    const totalMilestones = space.projects.reduce((sum, p) => sum + (p.milestones?.length || p._count.milestones), 0);

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

                    <div className="flex flex-col md:flex-row md:items-end gap-6 w-full justify-between">
                        <div className="flex items-end gap-6">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-sm bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] flex items-center justify-center shadow-lg -mb-2 md:-mb-4 transform rotate-1 transition-transform group-hover:rotate-0">
                                <span className="text-4xl" style={{ color: space.color }}>
                                    {space.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="mb-2">
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

                        {/* Top Action Bar */}
                        <div className="flex items-center gap-2 mb-2">
                            {canManageSpace && (
                                <button
                                    onClick={() => setShowCreateProjectModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2383e2] hover:bg-[#1a6fcc] text-white rounded-sm font-bold text-xs shadow-sm transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> New Operation
                                </button>
                            )}
                            {canCreateMilestones && space.projects.length > 0 && (
                                <button
                                    onClick={() => {
                                        setSelectedProjectIdForCreation(undefined);
                                        setShowCreateMilestoneModal(true);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--notion-bg-secondary)] hover:bg-[var(--notion-bg-tertiary)] text-[var(--notion-text-primary)] border border-[var(--notion-border-default)] rounded-sm font-bold text-xs transition-colors"
                                >
                                    <Target className="w-3.5 h-3.5 text-[#36B37E]" /> + Milestone
                                </button>
                            )}
                            {canCreateTasks && space.projects.length > 0 && (
                                <button
                                    onClick={() => {
                                        setSelectedProjectIdForCreation(undefined);
                                        setShowNewTaskModal(true);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--notion-bg-secondary)] hover:bg-[var(--notion-bg-tertiary)] text-[var(--notion-text-primary)] border border-[var(--notion-border-default)] rounded-sm font-bold text-xs transition-colors"
                                >
                                    <CheckSquare className="w-3.5 h-3.5 text-[#FFAB00]" /> + Task
                                </button>
                            )}
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
                        <p className="text-2xl font-bold text-[var(--notion-text-primary)]">{space.projects.length}</p>
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
                            <span className="text-xs font-bold uppercase">Space Personnel</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--notion-text-primary)]">{space.members?.length || 0}</p>
                    </div>
                    <div className="p-4 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm">
                        <div className="flex items-center gap-2 mb-2 text-[var(--notion-text-tertiary)]">
                            <Target className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Milestones</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--notion-text-primary)]">{totalMilestones}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Feed - Left 2 Columns */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Operations & Hierarchy Tree */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-[var(--notion-text-tertiary)] uppercase tracking-widest flex items-center gap-2">
                                    <Layout className="w-4 h-4" /> Operations & Detailed Briefs
                                </h3>
                                {canManageSpace && (
                                    <button
                                        onClick={() => setShowCreateProjectModal(true)}
                                        className="text-xs font-bold text-[#2383e2] hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add Operation
                                    </button>
                                )}
                            </div>

                            {space.projects.length === 0 ? (
                                <div className="p-10 text-center bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm">
                                    <Briefcase className="w-10 h-10 text-[var(--notion-text-tertiary)] mx-auto mb-3 opacity-60" />
                                    <p className="text-sm font-bold text-[var(--notion-text-primary)]">No operations initialized in this space.</p>
                                    <p className="text-xs text-[var(--notion-text-tertiary)] mt-1 mb-4">Create a new operation to start managing milestones and tasks.</p>
                                    {canManageSpace && (
                                        <button
                                            onClick={() => setShowCreateProjectModal(true)}
                                            className="px-4 py-2 bg-[#2383e2] text-white rounded-sm font-bold text-xs hover:bg-[#1a6fcc] transition-colors"
                                        >
                                            Initialize First Operation
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {space.projects.map(project => (
                                        <div key={project.id} className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm overflow-hidden shadow-sm">
                                            
                                            {/* Project Card Header */}
                                            <div className="p-4 border-b border-[var(--notion-border-default)] bg-[var(--notion-bg-tertiary)]/40 flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h4
                                                            onClick={() => router.push(`/projects/${project.id}`)}
                                                            className="text-base font-bold text-[var(--notion-text-primary)] hover:text-[#2383e2] transition-colors cursor-pointer"
                                                        >
                                                            {project.name}
                                                        </h4>
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider",
                                                            project.status === 'EXECUTION' ? "bg-[#36B37E]/20 text-[#36B37E]" :
                                                                project.status === 'PLANNING' ? "bg-[#2383e2]/20 text-[#2383e2]" :
                                                                    "bg-[var(--notion-bg-tertiary)] text-[var(--notion-text-tertiary)]"
                                                        )}>
                                                            {project.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-[var(--notion-text-secondary)] mt-1 font-medium">
                                                        <span className="font-bold text-[var(--notion-text-primary)]">Project Brief: </span>
                                                        {project.description || "No mission brief provided."}
                                                    </p>
                                                </div>

                                                {/* Action Buttons for Project */}
                                                <div className="flex items-center gap-2">
                                                    {canCreateMilestones && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedProjectIdForCreation(project.id);
                                                                setShowCreateMilestoneModal(true);
                                                            }}
                                                            className="px-2.5 py-1 text-[11px] font-bold text-[#36B37E] bg-[#36B37E]/10 hover:bg-[#36B37E]/20 rounded-sm border border-[#36B37E]/30 transition-colors flex items-center gap-1"
                                                        >
                                                            <Plus className="w-3 h-3" /> Milestone
                                                        </button>
                                                    )}
                                                    {canCreateTasks && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedProjectIdForCreation(project.id);
                                                                setShowNewTaskModal(true);
                                                            }}
                                                            className="px-2.5 py-1 text-[11px] font-bold text-[#FFAB00] bg-[#FFAB00]/10 hover:bg-[#FFAB00]/20 rounded-sm border border-[#FFAB00]/30 transition-colors flex items-center gap-1"
                                                        >
                                                            <Plus className="w-3 h-3" /> Task
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Hierarchy Tree: Milestones & Tasks with Briefs */}
                                            <div className="p-4 space-y-5">
                                                
                                                {/* Milestones Subsection */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--notion-text-tertiary)] flex items-center gap-1.5">
                                                            <Target className="w-3.5 h-3.5 text-[#36B37E]" /> Milestones ({project.milestones?.length || 0})
                                                        </span>
                                                    </div>

                                                    {!project.milestones || project.milestones.length === 0 ? (
                                                        <p className="text-xs text-[var(--notion-text-tertiary)] italic pl-5 py-1">No milestones created under this operation yet.</p>
                                                    ) : (
                                                        <div className="space-y-2 pl-3 border-l-2 border-[#36B37E]/30">
                                                            {project.milestones.map(ms => (
                                                                <div
                                                                    key={ms.id}
                                                                    onClick={() => {
                                                                        setSelectedMilestone({
                                                                            ...ms,
                                                                            owner: ms.owner || ms.ownerUser?.id || '',
                                                                            project: { id: project.id, name: project.name }
                                                                        });
                                                                        setShowMilestoneDetail(true);
                                                                    }}
                                                                    className="p-3 rounded-sm bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] hover:border-[#36B37E]/60 transition-all cursor-pointer space-y-1.5 group"
                                                                >
                                                                    <div className="flex items-center justify-between text-xs">
                                                                        <div className="flex items-center gap-2">
                                                                            <Target className="w-3.5 h-3.5 text-[#36B37E] shrink-0" />
                                                                            <span className="font-bold text-[var(--notion-text-primary)] group-hover:text-[#36B37E] transition-colors">{ms.title}</span>
                                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--notion-bg-tertiary)] text-[var(--notion-text-tertiary)] font-mono">{ms.category}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 text-[11px]">
                                                                            {ms.ownerUser && (
                                                                                <span className="text-[var(--notion-text-secondary)] font-semibold flex items-center gap-1">
                                                                                    <span className="w-4 h-4 rounded-full bg-[#36B37E]/20 text-[#36B37E] flex items-center justify-center text-[9px] font-bold">
                                                                                        {ms.ownerUser.name?.charAt(0) || 'U'}
                                                                                    </span>
                                                                                    {ms.ownerUser.name || ms.ownerUser.email}
                                                                                </span>
                                                                            )}
                                                                            <span className="text-[var(--notion-text-tertiary)]">
                                                                                Target: {new Date(ms.targetDate).toLocaleDateString()}
                                                                            </span>
                                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#36B37E]/10 text-[#36B37E]">
                                                                                {ms.status}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Milestone Brief / Description */}
                                                                    <div className="pl-5 text-xs text-[var(--notion-text-secondary)] bg-[var(--notion-bg-tertiary)]/30 p-2 rounded-sm border border-[var(--notion-border-default)]/40">
                                                                        <span className="font-semibold text-[var(--notion-text-tertiary)] uppercase text-[9px] tracking-wider">Milestone Brief: </span>
                                                                        <span>{ms.description || "No detailed brief provided for this milestone."}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tasks Subsection */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--notion-text-tertiary)] flex items-center gap-1.5">
                                                            <CheckSquare className="w-3.5 h-3.5 text-[#FFAB00]" /> Tasks ({project.tasks?.length || 0})
                                                        </span>
                                                    </div>

                                                    {!project.tasks || project.tasks.length === 0 ? (
                                                        <p className="text-xs text-[var(--notion-text-tertiary)] italic pl-5 py-1">No tasks created under this operation yet.</p>
                                                    ) : (
                                                        <div className="space-y-2 pl-3 border-l-2 border-[#FFAB00]/30">
                                                            {project.tasks.map(task => (
                                                                <div
                                                                    key={task.id}
                                                                    onClick={() => {
                                                                        setSelectedTask({
                                                                            ...task,
                                                                            project: { id: project.id, name: project.name }
                                                                        });
                                                                        setShowTaskDetail(true);
                                                                    }}
                                                                    className="p-3 rounded-sm bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] hover:border-[#FFAB00]/60 transition-all cursor-pointer space-y-1.5 group"
                                                                >
                                                                    <div className="flex items-center justify-between text-xs">
                                                                        <div className="flex items-center gap-2">
                                                                            <CheckCircle2 className={cn(
                                                                                "w-3.5 h-3.5 shrink-0",
                                                                                task.status === 'DONE' ? "text-[#36B37E]" : "text-[var(--notion-text-tertiary)]"
                                                                            )} />
                                                                            <span className={cn(
                                                                                "font-bold transition-colors",
                                                                                task.status === 'DONE' ? "line-through text-[var(--notion-text-tertiary)]" : "text-[var(--notion-text-primary)] group-hover:text-[#FFAB00]"
                                                                            )}>{task.title}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 text-[11px]">
                                                                            {task.assignedTo && (
                                                                                <span className="text-[var(--notion-text-secondary)] font-semibold flex items-center gap-1">
                                                                                    <span className="w-4 h-4 rounded-full bg-[#FFAB00]/20 text-[#FFAB00] flex items-center justify-center text-[9px] font-bold">
                                                                                        {task.assignedTo.name?.charAt(0) || 'U'}
                                                                                    </span>
                                                                                    {task.assignedTo.name || task.assignedTo.email}
                                                                                </span>
                                                                            )}
                                                                            <span className="text-[var(--notion-text-tertiary)]">
                                                                                Deadline: {new Date(task.deadline).toLocaleDateString()}
                                                                            </span>
                                                                            <span className={cn(
                                                                                "px-1.5 py-0.5 rounded text-[10px] font-bold",
                                                                                task.status === 'DONE' ? "bg-[#36B37E]/20 text-[#36B37E]" : "bg-[#2383e2]/20 text-[#2383e2]"
                                                                            )}>
                                                                                {task.status}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Task Brief / Description */}
                                                                    <div className="pl-5 text-xs text-[var(--notion-text-secondary)] bg-[var(--notion-bg-tertiary)]/30 p-2 rounded-sm border border-[var(--notion-border-default)]/40">
                                                                        <span className="font-semibold text-[var(--notion-text-tertiary)] uppercase text-[9px] tracking-wider">Task Brief: </span>
                                                                        <span>{task.description || "No detailed brief provided for this task."}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Recent Space Activity */}
                        <section>
                            <h3 className="text-sm font-bold text-[var(--notion-text-tertiary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Activity Log
                            </h3>
                            <div className="space-y-3">
                                {space.recentActivities.length === 0 ? (
                                    <p className="text-sm text-[var(--notion-text-tertiary)] italic">No recent activity recorded.</p>
                                ) : (
                                    space.recentActivities.map((activity: any) => (
                                        <div key={activity.id} className="flex gap-3 items-start p-3 rounded-sm hover:bg-[var(--notion-bg-secondary)] border border-transparent hover:border-[var(--notion-border-default)] transition-colors">
                                            <div className="mt-0.5 w-6 h-6 rounded-full bg-[var(--notion-bg-tertiary)] flex items-center justify-center text-[10px] font-bold text-[var(--notion-text-secondary)] border border-[var(--notion-border-default)] shrink-0">
                                                {activity.user?.name?.[0] || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-[var(--notion-text-primary)]">
                                                    <span className="font-bold">{activity.user?.name || 'User'}</span>
                                                    <span className="text-[var(--notion-text-secondary)]"> {activity.action.replace(/_/g, ' ').toLowerCase()} </span>
                                                    <span className="text-[var(--notion-text-tertiary)]">in</span>
                                                    <span className="font-bold text-[#2383e2]"> {activity.project?.name || 'Project'}</span>
                                                </p>
                                                <p className="text-[10px] text-[var(--notion-text-tertiary)] mt-1 flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-8">
                        
                        {/* Space Personnel Section */}
                        <section className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] p-4 rounded-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-[var(--notion-text-tertiary)] uppercase tracking-widest flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5 text-[#0052CC]" /> Space Personnel ({space.members?.length || 0})
                                </h3>
                                {canManageSpace && (
                                    <button
                                        onClick={() => setShowManageMembersModal(true)}
                                        className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1"
                                    >
                                        <UserPlus className="w-3.5 h-3.5" /> Manage
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {space.members?.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-2 hover:bg-[var(--notion-bg-tertiary)] rounded-sm transition-colors border border-transparent hover:border-[var(--notion-border-default)]">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                <div className="w-7 h-7 rounded-full bg-[#0052CC]/20 flex items-center justify-center font-bold text-[#0052CC] text-xs border border-white/10 overflow-hidden shadow-sm">
                                                    {member.image ? (
                                                        <img src={member.image} alt={member.name || ''} className="w-full h-full object-cover" />
                                                    ) : (
                                                        (member.name?.charAt(0) || member.email.charAt(0)).toUpperCase()
                                                    )}
                                                </div>
                                                {member.isOnline && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[var(--notion-bg-primary)] shadow-sm" title="Online" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-[var(--notion-text-primary)] truncate">{member.name || member.email.split('@')[0]}</p>
                                                <p className="text-[9px] text-[var(--notion-text-tertiary)] uppercase font-bold tracking-wider">{member.role.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {(!space.members || space.members.length === 0) && (
                                    <div className="text-center py-4">
                                        <p className="text-xs text-[var(--notion-text-tertiary)] italic">No personnel assigned to this space.</p>
                                        {canManageSpace && (
                                            <button
                                                onClick={() => setShowManageMembersModal(true)}
                                                className="mt-2 text-xs font-bold text-[#0052CC] hover:underline"
                                            >
                                                + Assign Employees
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Space Wiki / Knowledge Section */}
                        <section className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] p-4 rounded-sm">
                            <h3 className="text-xs font-bold text-[var(--notion-text-tertiary)] uppercase tracking-widest mb-3 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" /> Documentation
                            </h3>
                            <div className="space-y-1">
                                {space.wikiPages.length === 0 ? (
                                    <p className="text-xs text-[var(--notion-text-tertiary)]">No documentation created.</p>
                                ) : (
                                    space.wikiPages.map((page: any) => (
                                        <Link
                                            key={page.id}
                                            href={`/wiki/${page.id}`}
                                            className="block p-2 text-xs text-[var(--notion-text-secondary)] hover:bg-[var(--notion-bg-tertiary)] rounded-sm transition-colors truncate hover:text-[#2383e2]"
                                        >
                                            {page.title}
                                        </Link>
                                    ))
                                )}
                            </div>
                        </section>

                    </div>
                </div>
            </div>

            {/* Modals */}
            <ManageSpaceMembersModal
                isOpen={showManageMembersModal}
                onClose={() => setShowManageMembersModal(false)}
                spaceId={space.id}
                spaceName={space.name}
                currentMembers={space.members || []}
                onSuccess={fetchSpaceDetails}
            />

            <CreateProjectModal
                isOpen={showCreateProjectModal}
                onClose={() => setShowCreateProjectModal(false)}
                spaceId={space.id}
                spaceName={space.name}
                onSuccess={fetchSpaceDetails}
            />

            <CreateMilestoneModal
                isOpen={showCreateMilestoneModal}
                onClose={() => setShowCreateMilestoneModal(false)}
                onSuccess={fetchSpaceDetails}
                defaultSpaceId={space.id}
                defaultProjectId={selectedProjectIdForCreation}
            />

            <NewTaskModal
                isOpen={showNewTaskModal}
                onClose={() => setShowNewTaskModal(false)}
                onTaskCreated={fetchSpaceDetails}
                defaultSpaceId={space.id}
                defaultProjectId={selectedProjectIdForCreation}
            />

            <MilestoneDetailModal
                isOpen={showMilestoneDetail}
                onClose={() => {
                    setShowMilestoneDetail(false);
                    setSelectedMilestone(null);
                }}
                onDelete={fetchSpaceDetails}
                milestone={selectedMilestone}
            />

            <TaskDetailModal
                isOpen={showTaskDetail}
                onClose={() => {
                    setShowTaskDetail(false);
                    setSelectedTask(null);
                }}
                onDelete={fetchSpaceDetails}
                task={selectedTask}
            />

        </div>
    );
}
