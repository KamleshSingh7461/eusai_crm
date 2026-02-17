"use client";

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Calendar,
    Briefcase,
    ChevronRight,
    Loader2,
    Trash2,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    PieChart,
    Settings,
    LayoutGrid,
    List,
    Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProjectEditModal from '@/components/projects/ProjectEditModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
    project: any;
    userRole: string;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onClick: () => void;
}

function ProjectCard({ project, userRole, onDelete, onClick }: ProjectCardProps) {
    // Calculate progress color
    const getProgressColor = (progress: number) => {
        if (progress >= 100) return 'bg-[#36B37E]'; // Notion Green
        if (progress > 50) return 'bg-[#0052CC]';   // Notion Blue
        return 'bg-[#FFAB00]';                       // Notion Yellow
    };

    return (
        <div
            className="group bg-[#2f3437] border border-[rgba(255,255,255,0.09)] hover:bg-[#3b4045] rounded-lg p-5 transition-all duration-200 cursor-pointer relative flex flex-col h-full hover:shadow-lg"
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] flex items-center justify-center text-[rgba(255,255,255,0.9)] font-bold text-lg">
                        {project.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[rgba(255,255,255,0.9)] group-hover:text-[#0052CC] transition-colors leading-tight mb-0.5">
                            {project.name}
                        </h3>
                        {project.space && (
                            <div className="flex items-center gap-1.5 text-xs text-[rgba(255,255,255,0.5)]">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: project.space.color || '#6B778C' }} />
                                <span>{project.space.name}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    {['DIRECTOR', 'MANAGER'].includes(userRole) && (
                        <button
                            className="p-1.5 hover:bg-[rgba(255,255,255,0.1)] rounded-md text-[rgba(255,255,255,0.7)] transition-colors"
                            title="Edit Project"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    )}
                    {['DIRECTOR'].includes(userRole) && (
                        <button
                            onClick={(e) => onDelete(project.id, e)}
                            className="p-1.5 hover:bg-red-500/20 rounded-md text-[rgba(255,255,255,0.7)] hover:text-red-400 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <p className="text-xs text-[rgba(255,255,255,0.7)] line-clamp-2 leading-relaxed mb-6 flex-1">
                {project.description || 'No description provided.'}
            </p>

            <div className="space-y-4 pt-4 border-t border-[rgba(255,255,255,0.09)]">
                {/* Stats Row */}
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.7)]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{project.stats?.tasks?.completed || 0}/{project.stats?.tasks?.total || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.7)]">
                        <AlertCircle className={cn("w-3.5 h-3.5", (project.stats?.tasks?.overdue || 0) > 0 ? "text-red-400" : "text-[rgba(255,255,255,0.3)]")} />
                        <span className={(project.stats?.tasks?.overdue || 0) > 0 ? "text-red-400 font-medium" : ""}>
                            {project.stats?.tasks?.overdue || 0} Overdue
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-wider">
                        <span>Progress</span>
                        <span>{project.stats?.progress || 0}%</span>
                    </div>
                    <div className="h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all duration-1000", getProgressColor(project.stats?.progress || 0))}
                            style={{ width: `${project.stats?.progress || 0}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                    <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        project.status === 'EXECUTION' ? "bg-emerald-500/20 text-emerald-400" :
                            project.status === 'PLANNING' ? "bg-blue-500/20 text-blue-400" :
                                project.status === 'MONITORING' ? "bg-orange-500/20 text-orange-400" :
                                    "bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.7)]"
                    )}>
                        {project.status === 'CLOSED' ? 'COMPLETED' : project.status}
                    </span>
                    <div className="text-[10px] font-medium text-[rgba(255,255,255,0.5)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    // Filter and View State
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [editingProject, setEditingProject] = useState<any | null>(null);
    const router = useRouter();
    const { showToast } = useToast();
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role || 'EMPLOYEE';

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/projects');
            if (response.ok) {
                const data = await response.json();
                setProjects(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            showToast('Failed to load projects', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to decommission this project?')) return;

        try {
            const response = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
            if (response.ok) {
                showToast('Project decommissioned successfully', 'success');
                fetchProjects();
            } else {
                showToast('Failed to decommission project', 'error');
            }
        } catch (error) {
            showToast('Network error during decommissioning', 'error');
        }
    };

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const activeProjectsCount = projects.filter(p => p.status !== 'CLOSED').length;
    const stats = {
        total: projects.length,
        active: activeProjectsCount,
        overdue: projects.reduce((sum, p) => sum + (p.stats?.tasks?.overdue || 0), 0),
        avgProgress: projects.length > 0
            ? Math.round(projects.reduce((sum, p) => sum + (p.stats?.progress || 0), 0) / projects.length)
            : 0
    };

    return (
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[rgba(255,255,255,0.09)] pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Briefcase className="w-8 h-8 text-[#0052CC]" />
                        <h1 className="text-3xl font-bold text-[rgba(255,255,255,0.9)] tracking-tight">Project Portfolio</h1>
                    </div>
                    <p className="text-[rgba(255,255,255,0.7)] text-base max-w-2xl">
                        Manage your initiatives, track progress, and monitor team performance across all workspaces.
                    </p>
                </div>
                {['DIRECTOR', 'MANAGER'].includes(userRole) && (
                    <Button
                        onClick={() => router.push('/projects/new')}
                        leftIcon={<Plus className="w-5 h-5" />}
                        size="md"
                        className="bg-[#0052CC] hover:bg-[#0747A6] text-white shadow-lg shadow-blue-900/20"
                    >
                        New Project
                    </Button>
                )}
            </div>

            {/* Metrics Bar */}
            {['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole) && !isLoading && projects.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard label="Total Projects" value={stats.total} icon={Briefcase} color="blue" />
                    <MetricCard label="Active" value={stats.active} icon={TrendingUp} color="emerald" />
                    <MetricCard label="Avg. Progress" value={`${stats.avgProgress}%`} icon={PieChart} color="indigo" />
                    <MetricCard label="Overdue Items" value={stats.overdue} icon={AlertCircle} color="red" />
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10 bg-[#191919]/95 backdrop-blur-sm py-4 border-b border-[rgba(255,255,255,0.05)]">
                <Input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="w-4 h-4 text-[rgba(255,255,255,0.5)]" />}
                    containerClassName="w-full md:w-96"
                    className="h-10 bg-[#2f3437] border-[rgba(255,255,255,0.09)] text-[rgba(255,255,255,0.9)] placeholder-[rgba(255,255,255,0.5)] focus:border-[#0052CC]"
                />

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 px-3 bg-[#2f3437] border border-[rgba(255,255,255,0.09)] rounded-md text-sm text-[rgba(255,255,255,0.9)] focus:outline-none focus:border-[#0052CC]"
                    >
                        <option value="ALL">All Status</option>
                        <option value="INITIATION">Initiation</option>
                        <option value="PLANNING">Planning</option>
                        <option value="EXECUTION">Execution</option>
                        <option value="MONITORING">Monitoring</option>
                        <option value="CLOSED">Closed</option>
                    </select>

                    <div className="flex bg-[#2f3437] border border-[rgba(255,255,255,0.09)] rounded-md p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-1.5 rounded-sm transition-colors",
                                viewMode === 'grid' ? "bg-[rgba(255,255,255,0.1)] text-[#0052CC]" : "text-[rgba(255,255,255,0.5)] hover:text-[rgba(255,255,255,0.9)]"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-1.5 rounded-sm transition-colors",
                                viewMode === 'list' ? "bg-[rgba(255,255,255,0.1)] text-[#0052CC]" : "text-[rgba(255,255,255,0.5)] hover:text-[rgba(255,255,255,0.9)]"
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-[#2f3437] p-6 rounded-lg border border-[rgba(255,255,255,0.09)] space-y-4">
                            <div className="flex justify-between">
                                <Skeleton className="h-10 w-10 bg-[rgba(255,255,255,0.1)] rounded-md" />
                                <Skeleton className="h-6 w-20 bg-[rgba(255,255,255,0.1)] rounded-sm" />
                            </div>
                            <Skeleton className="h-6 w-3/4 bg-[rgba(255,255,255,0.1)] rounded-sm" />
                            <Skeleton className="h-4 w-full bg-[rgba(255,255,255,0.1)] rounded-sm" />
                            <Skeleton className="h-20 w-full bg-[rgba(255,255,255,0.1)] rounded-sm" />
                        </div>
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#2f3437] border border-dashed border-[rgba(255,255,255,0.09)] rounded-lg text-center p-8">
                    <div className="w-16 h-16 bg-[rgba(255,255,255,0.05)] rounded-full flex items-center justify-center mb-4 text-[rgba(255,255,255,0.3)]">
                        <Briefcase className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-[rgba(255,255,255,0.9)] mb-2">No projects found</h3>
                    <p className="text-[rgba(255,255,255,0.5)] max-w-sm mb-6">
                        {searchQuery || statusFilter !== 'ALL'
                            ? "Try adjusting your search or filters to find what you're looking for."
                            : "Get started by creating a new project to track your team's work."}
                    </p>
                    {['DIRECTOR', 'MANAGER'].includes(userRole) && searchQuery === '' && statusFilter === 'ALL' && (
                        <Button
                            onClick={() => router.push('/projects/new')}
                            variant="primary"
                            size="sm"
                        >
                            Create First Project
                        </Button>
                    )}
                </div>
            ) : userRole === 'DIRECTOR' && viewMode === 'grid' && searchQuery === '' && statusFilter === 'ALL' ? (
                <div className="space-y-12">
                    {Array.from(new Set(filteredProjects.map(p => p.space?.name || 'Unassigned'))).map(spaceName => {
                        const spaceProjects = filteredProjects.filter(p => (p.space?.name || 'Unassigned') === spaceName);
                        // Safe access to colors
                        const spaceColor = spaceProjects[0]?.space?.color || '#6B778C';

                        if (spaceProjects.length === 0) return null;

                        return (
                            <div key={spaceName} className="space-y-4">
                                <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.09)] pb-2">
                                    <div className="w-2 h-8 rounded-r-md" style={{ backgroundColor: spaceColor }} />
                                    <h2 className="text-sm font-bold text-[rgba(255,255,255,0.9)] uppercase tracking-wider">{spaceName}</h2>
                                    <span className="text-[10px] font-bold text-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.1)] px-2 py-0.5 rounded-full">
                                        {spaceProjects.length}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {spaceProjects.map((project) => (
                                        <ProjectCard
                                            key={project.id}
                                            project={project}
                                            userRole={userRole}
                                            onDelete={handleDelete}
                                            onClick={() => router.push(`/projects/${project.id}`)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={cn(
                    "grid gap-6",
                    viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                )}>
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            userRole={userRole}
                            onDelete={handleDelete}
                            onClick={() => router.push(`/projects/${project.id}`)}
                        />
                    ))}
                </div>
            )}

            {editingProject && (
                <ProjectEditModal
                    project={editingProject}
                    onClose={() => setEditingProject(null)}
                    onSuccess={() => {
                        setEditingProject(null);
                        fetchProjects();
                    }}
                />
            )}
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
    const colorStyles: any = {
        blue: "text-blue-400 bg-blue-500/10",
        emerald: "text-emerald-400 bg-emerald-500/10",
        indigo: "text-indigo-400 bg-indigo-500/10",
        red: "text-red-400 bg-red-500/10"
    };

    return (
        <div className="bg-[#2f3437] border border-[rgba(255,255,255,0.09)] p-4 rounded-lg flex items-center gap-4">
            <div className={cn("p-3 rounded-md", colorStyles[color])}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <div className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">{value}</div>
                <div className="text-xs font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}
