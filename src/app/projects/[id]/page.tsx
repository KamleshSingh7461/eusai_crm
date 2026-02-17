"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Briefcase,
    Calendar,
    DollarSign,
    Target,
    Activity,
    Users,
    AlertCircle,
    CheckCircle2,
    Clock,
    ArrowLeft,
    TrendingUp,
    MoreVertical,
    Plus,
    FileText,
    Loader2,
    Layout,
    ChevronRight,
    Search,
    ChevronLeft
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import CreateMilestoneModal from '@/components/modals/CreateMilestoneModal';
import TaskCreateModal from '@/components/tasks/TaskCreateModal';
import ProjectEditModal from '@/components/projects/ProjectEditModal';

export default function ProjectDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const { data: session } = useSession();
    const [project, setProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showMilestoneModal, setShowMilestoneModal] = useState(false);

    const userRole = (session?.user as any)?.role || 'EMPLOYEE';
    const userId = (session?.user as any)?.id;

    useEffect(() => {
        if (id) fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${id}`);
            if (res.ok) {
                setProject(await res.json());
            } else {
                showToast('Failed to load project details', 'error');
            }
        } catch (error) {
            showToast('Network error loading project', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateReport = () => {
        showToast('Generating executive report... This feature is coming soon.', 'info');
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#191919]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-[#0052CC]" />
                    <p className="text-[rgba(255,255,255,0.7)] font-bold text-sm uppercase tracking-widest">Accessing Initiative Intelligence...</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#191919]">
                <div className="text-center p-12 bg-[#2f3437] border border-[rgba(255,255,255,0.09)] rounded-lg shadow-lg max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-[rgba(255,255,255,0.9)] mb-2">Project Not Found</h2>
                    <p className="text-[rgba(255,255,255,0.7)] text-sm mb-8">The initiative you are trying to access doesn't exist or has been decommissioned.</p>
                    <Button onClick={() => router.push('/projects')} variant="primary" className="w-full bg-[#0052CC] hover:bg-[#0747A6]">
                        Back to Portfolio
                    </Button>
                </div>
            </div>
        );
    }

    const { stats, space, manager } = project;

    return (
        <div className="min-h-screen bg-[#191919] pb-12">
            {/* Header Banner */}
            <div className="bg-[#1D2125] border-b border-[rgba(255,255,255,0.09)] p-8 shadow-lg sticky top-0 z-50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => router.push('/projects')}
                            className="p-2 hover:bg-[rgba(255,255,255,0.1)] rounded-full transition-colors group"
                        >
                            <ChevronLeft className="w-5 h-5 text-[rgba(255,255,255,0.7)] group-hover:text-[#0052CC]" />
                        </button>
                        <div className="flex items-center gap-2 text-xs font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-widest">
                            <Link href="/projects" className="hover:text-[#0052CC] transition-colors">Portfolio</Link>
                            <ChevronRight className="w-3 h-3" />
                            {space && (
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: space.color || '#6B778C' }} />
                                    <span className="text-[#0052CC]">{space.name}</span>
                                </div>
                            )}
                            {!space && <span className="text-[rgba(255,255,255,0.5)]">Unassigned Space</span>}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-5">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#0052CC] to-[#0747A6] flex items-center justify-center text-white text-3xl font-black shadow-xl">
                                {project.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-[rgba(255,255,255,0.9)] tracking-tight mb-2">{project.name}</h1>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.7)] font-medium">
                                        <Briefcase className="w-4 h-4" />
                                        <span>PM: {manager?.name || 'Unassigned'}</span>
                                    </div>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.3)]" />
                                    <div className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.7)] font-medium">
                                        <Calendar className="w-4 h-4" />
                                        <span>Ends {new Date(project.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                                        project.status === 'EXECUTION' ? 'bg-emerald-500/20 text-emerald-400' :
                                            project.status === 'PLANNING' ? 'bg-blue-500/20 text-blue-400' :
                                                project.status === 'MONITORING' ? 'bg-orange-500/20 text-orange-400' :
                                                    'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.7)]'
                                    )}>
                                        {project.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                            {(userRole === 'DIRECTOR' || (userRole === 'MANAGER' && project.manager?.id === userId)) && (
                                <>
                                    <Button
                                        onClick={handleGenerateReport}
                                        variant="secondary"
                                        className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.09)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)]"
                                    >
                                        Generate Report
                                    </Button>
                                    <Button
                                        onClick={() => setShowEditModal(true)}
                                        className="bg-[#0052CC] hover:bg-[#0747A6] text-white"
                                    >
                                        Edit Details
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                                                try {
                                                    const res = await fetch(`/api/projects?id=${project.id}`, { method: 'DELETE' });
                                                    if (res.ok) {
                                                        showToast('Project deleted successfully', 'success');
                                                        router.push('/projects');
                                                    } else {
                                                        const data = await res.json();
                                                        showToast(data.error || 'Failed to delete project', 'error');
                                                    }
                                                } catch (err) {
                                                    showToast('Error deleting project', 'error');
                                                }
                                            }
                                        }}
                                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20"
                                        variant="secondary"
                                    >
                                        Delete
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#2f3437] p-6 rounded-lg border border-[rgba(255,255,255,0.09)] shadow-lg hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Activity className="w-5 h-5 text-[#0052CC]" />
                            </div>
                            <span className="text-2xl font-black text-[rgba(255,255,255,0.9)]">{stats.progress}%</span>
                        </div>
                        <p className="text-[10px] font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-widest">Mission Progress</p>
                        <div className="h-2 w-full bg-[rgba(255,255,255,0.1)] rounded-full mt-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#0052CC] to-[#2684FF] transition-all duration-1000"
                                style={{ width: `${stats.progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-[#2f3437] p-6 rounded-lg border border-[rgba(255,255,255,0.09)] shadow-lg hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-orange-400" />
                            </div>
                            <span className={cn(
                                "text-2xl font-black",
                                stats.tasks.overdue > 0 ? "text-orange-400" : "text-[rgba(255,255,255,0.9)]"
                            )}>{stats.tasks.overdue}</span>
                        </div>
                        <p className="text-[10px] font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-widest">Critical Delays</p>
                        <p className="text-xs text-[rgba(255,255,255,0.7)] mt-2 font-medium">Overdue milestones & tasks</p>
                    </div>

                    <div className="bg-[#2f3437] p-6 rounded-lg border border-[rgba(255,255,255,0.09)] shadow-lg hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Target className="w-5 h-5 text-emerald-400" />
                            </div>
                            <span className="text-2xl font-black text-[rgba(255,255,255,0.9)]">{project._count.tasks}</span>
                        </div>
                        <p className="text-[10px] font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-widest">Total Scope</p>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-1000"
                                    style={{ width: `${project._count.tasks > 0 ? (stats.tasks.completed / project._count.tasks) * 100 : 0}%` }}
                                />
                            </div>
                            <span className="text-xs text-[rgba(255,255,255,0.7)] font-bold whitespace-nowrap">{stats.tasks.completed}/{project._count.tasks}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left & Middle Column: Tasks and Milestones */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Initiative Roadmap (Milestones) */}
                        <section className="bg-[#2f3437] border border-[rgba(255,255,255,0.09)] rounded-lg overflow-hidden shadow-lg">
                            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.09)] flex items-center justify-between bg-[rgba(0,0,0,0.2)]">
                                <h3 className="font-bold text-[rgba(255,255,255,0.9)] flex items-center gap-2 uppercase tracking-tight text-sm">
                                    <TrendingUp className="w-4 h-4 text-[#0052CC]" />
                                    Initiative Roadmap
                                </h3>
                                {['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole) && (
                                    <Button
                                        onClick={() => setShowMilestoneModal(true)}
                                        variant="secondary"
                                        size="sm"
                                        className="h-8 text-[10px] font-black tracking-widest uppercase bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.09)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)]"
                                    >
                                        Add Milestone
                                    </Button>
                                )}
                            </div>
                            <div className="p-6">
                                {project.milestones.length === 0 ? (
                                    <div className="py-12 text-center text-[rgba(255,255,255,0.5)] border-2 border-dashed border-[rgba(255,255,255,0.09)] rounded-lg">
                                        No milestones mapped for this initiative.
                                    </div>
                                ) : (
                                    <div className="relative space-y-8 before:absolute before:inset-0 before:left-3 before:h-full before:w-0.5 before:bg-[rgba(255,255,255,0.09)]">
                                        {project.milestones.map((milestone: any, idx: number) => (
                                            <div key={milestone.id} className="relative pl-10 group">
                                                <div className={cn(
                                                    "absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-[#2f3437] z-10 shadow-lg transition-all group-hover:scale-110",
                                                    milestone.status === 'COMPLETED' ? 'bg-emerald-500' :
                                                        milestone.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-[rgba(255,255,255,0.2)]'
                                                )} />
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[rgba(255,255,255,0.03)] p-4 rounded-lg border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] transition-all">
                                                    <div>
                                                        <h4 className="font-bold text-[rgba(255,255,255,0.9)] group-hover:text-[#0052CC] transition-colors">{milestone.title}</h4>
                                                        <p className="text-xs text-[rgba(255,255,255,0.6)] mt-1">{milestone.description || "Critical project phase objective."}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.05)] px-2 py-1 rounded-md uppercase tracking-widest border border-[rgba(255,255,255,0.09)]">
                                                            {new Date(milestone.targetDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                        <div className="w-32 h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden hidden md:block">
                                                            <div
                                                                className={cn("h-full transition-all duration-1000", milestone.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500')}
                                                                style={{ width: `${milestone.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Task Backlog */}
                        <section className="bg-[#2f3437] border border-[rgba(255,255,255,0.09)] rounded-lg overflow-hidden shadow-lg">
                            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.09)] flex items-center justify-between bg-[rgba(0,0,0,0.2)]">
                                <h3 className="font-bold text-[rgba(255,255,255,0.9)] flex items-center gap-2 uppercase tracking-tight text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    Mission Backlog
                                </h3>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setShowTaskModal(true)}
                                        size="sm"
                                        className="h-8 text-[10px] font-black tracking-widest uppercase bg-[#0052CC] hover:bg-[#0747A6] text-white"
                                    >
                                        New Task
                                    </Button>
                                </div>
                            </div>
                            <div className="divide-y divide-[rgba(255,255,255,0.05)]">
                                {project.tasks.length === 0 ? (
                                    <div className="p-12 text-center text-[rgba(255,255,255,0.5)]">
                                        No active tasks found in the backlog.
                                    </div>
                                ) : (
                                    project.tasks.map((task: any) => (
                                        <div key={task.id} className="p-4 hover:bg-[rgba(255,255,255,0.03)] transition-colors group flex items-start gap-4">
                                            <div className={cn(
                                                "mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer",
                                                task.status === 'DONE' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[rgba(255,255,255,0.2)] group-hover:border-[#0052CC]'
                                            )}>
                                                {task.status === 'DONE' && <CheckCircle2 className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1 gap-4">
                                                    <h4 className={cn("text-sm font-bold transition-all flex-1", task.status === 'DONE' ? 'text-[rgba(255,255,255,0.5)] line-through' : 'text-[rgba(255,255,255,0.9)] group-hover:text-[#0052CC]')}>
                                                        {task.title}
                                                    </h4>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {task.category && (
                                                            <span className={cn(
                                                                "text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border",
                                                                task.category === 'EUSAI_AGREEMENT' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                                    task.category === 'SPORTS_LOGO' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                                                                        task.category === 'MOU' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                                                            task.category === 'BUSINESS_ORDER' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' :
                                                                                'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] border-[rgba(255,255,255,0.15)]'
                                                            )}>
                                                                {task.category.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                        <span className={cn(
                                                            "text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border",
                                                            task.priority === 3 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                                task.priority === 2 ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                                    'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] border-[rgba(255,255,255,0.15)]'
                                                        )}>
                                                            {task.priority === 3 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] text-[rgba(255,255,255,0.6)] font-bold uppercase tracking-widest">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(task.deadline).toLocaleDateString()}
                                                    </span>
                                                    {task.assignedTo && (
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {task.assignedTo.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Context, Managers, Financials */}
                    <div className="space-y-8">


                        {/* Governance & Context */}
                        <section className="bg-[#2f3437] border border-[rgba(255,255,255,0.09)] rounded-lg p-6 shadow-lg">
                            <h3 className="font-bold text-[rgba(255,255,255,0.9)] mb-6 flex items-center gap-2 uppercase tracking-tighter text-xs">
                                <Layout className="w-4 h-4 text-[rgba(255,255,255,0.7)]" />
                                Governance Context
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-[rgba(255,255,255,0.5)] uppercase tracking-widest">Ownership</span>
                                    <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.09)]">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0052CC] to-[#0747A6] flex items-center justify-center font-black text-white shadow-lg">
                                            {manager?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-black text-[rgba(255,255,255,0.9)] truncate">{manager?.name || 'Unassigned Executive'}</p>
                                            <p className="text-[9px] text-[rgba(255,255,255,0.6)] font-black uppercase tracking-wider">Initiative Lead</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-[rgba(255,255,255,0.5)] uppercase tracking-widest">Metadata Hash</span>
                                    <div className="p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.09)] font-mono text-[9px] break-all text-[rgba(255,255,255,0.6)]">
                                        ID: {project.id}<br />
                                        HASH: {Buffer.from(project.id).toString('hex').substring(0, 16).toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {showEditModal && (
                <ProjectEditModal
                    project={project}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        setShowEditModal(false);
                        fetchProjectDetails();
                    }}
                />
            )}

            {showTaskModal && (
                <TaskCreateModal
                    projectId={project.id}
                    assignees={project.team || []}
                    onClose={() => setShowTaskModal(false)}
                    onSuccess={() => {
                        setShowTaskModal(false);
                        fetchProjectDetails();
                    }}
                />
            )}

            <CreateMilestoneModal
                isOpen={showMilestoneModal}
                defaultProjectId={project.id}
                onClose={() => setShowMilestoneModal(false)}
                onSuccess={() => {
                    setShowMilestoneModal(false);
                    fetchProjectDetails();
                }}
            />
        </div>
    );
}
