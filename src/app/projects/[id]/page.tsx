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
import TaskDetailModal from '@/components/modals/TaskDetailModal';
import MilestoneDetailModal from '@/components/modals/MilestoneDetailModal';

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

    // Detailed views
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showTaskDetail, setShowTaskDetail] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
    const [showMilestoneDetail, setShowMilestoneDetail] = useState(false);

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

    const handleGenerateReport = async () => {
        try {
            // jsPDF is large; load it only when someone asks for a report
            const { PDFService } = await import('@/services/PDFService');
            PDFService.generateProjectExecutiveSummary(project);
            showToast('Project summary downloaded', 'success');
        } catch {
            showToast('Could not generate the report', 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#09090B]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-[#3B82F6]" />
                    <p className="text-[rgba(255,255,255,0.7)] font-semibold text-sm">Loading project…</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#09090B]">
                <div className="text-center p-6 sm:p-12 bg-[#18181B] border border-[rgba(255,255,255,0.09)] rounded-lg shadow-lg max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
                    <h2 className="text-2xl font-semibold text-[rgba(255,255,255,0.9)] mb-2">Project Not Found</h2>
                    <p className="text-[rgba(255,255,255,0.7)] text-sm mb-8">This project doesn't exist or has been deleted.</p>
                    <Button onClick={() => router.push('/projects')} variant="primary" className="w-full bg-[#3B82F6] hover:bg-[#2563EB]">
                        Back to Portfolio
                    </Button>
                </div>
            </div>
        );
    }

    const { stats, space, managers = [] } = project;

    return (
        <div className="min-h-screen bg-[#09090B] pb-12">
            {/* Header Banner */}
            <div className="bg-[#111113] border-b border-[rgba(255,255,255,0.09)] p-5 sm:p-8 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => router.push('/projects')}
                            className="p-2 hover:bg-[rgba(255,255,255,0.1)] rounded-full transition-colors group"
                        >
                            <ChevronLeft className="w-5 h-5 text-[rgba(255,255,255,0.7)] group-hover:text-[#3B82F6]" />
                        </button>
                        <div className="flex items-center gap-2 text-xs font-semibold text-[rgba(255,255,255,0.5)]">
                            <Link href="/projects" className="hover:text-[#3B82F6] transition-colors">Projects</Link>
                            <ChevronRight className="w-3 h-3" />
                            {space && (
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: space.color || '#8B94A5' }} />
                                    <span className="text-[#3B82F6]">{space.name}</span>
                                </div>
                            )}
                            {!space && <span className="text-[rgba(255,255,255,0.5)]">Unassigned Space</span>}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-5">
                            <div className="w-16 h-16 rounded-lg bg-[#3B82F6] flex items-center justify-center text-white text-3xl font-semibold shadow-xl">
                                {project.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-semibold text-[rgba(255,255,255,0.9)] tracking-tight mb-2">{project.name}</h1>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.7)] font-medium">
                                        <Briefcase className="w-4 h-4" />
                                        <span>Leads: {managers.length > 0 ? managers.map((m: any) => m.name).join(', ') : 'Unassigned'}</span>
                                    </div>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.3)]" />
                                    <div className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.7)] font-medium">
                                        <Calendar className="w-4 h-4" />
                                        <span>Ends {new Date(project.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-md text-[11px] font-semibold  ",
                                        project.status === 'EXECUTION' ? 'bg-emerald-500/20 text-emerald-400' :
                                            project.status === 'PLANNING' ? 'bg-blue-500/20 text-blue-400' :
                                                project.status === 'MONITORING' ? 'bg-orange-500/20 text-orange-400' :
                                                    'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.7)]'
                                    )}>
                                        {project.status === 'CLOSED' ? 'COMPLETED' : project.status}
                                    </span>
                                    {project.isRestricted && (
                                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/20 text-amber-400 flex items-center gap-1.5 shadow-sm border border-amber-500/20">
                                            <AlertCircle className="w-3 h-3" />
                                            Restricted View
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                            {(userRole === 'DIRECTOR' || managers.some((m: any) => m.id === userId)) && (
                                <>
                                    {project.status !== 'CLOSED' && (
                                        <Button
                                            onClick={async () => {
                                                if (confirm('Mark this milestone as completed?')) {
                                                    try {
                                                        const res = await fetch(`/api/projects/${project.id}`, {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                ...project,
                                                                status: 'CLOSED',
                                                                startDate: project.startDate,
                                                                endDate: project.endDate
                                                            })
                                                        });
                                                        if (res.ok) {
                                                            showToast('Milestone completed', 'success');
                                                            fetchProjectDetails();
                                                        } else {
                                                            showToast('Failed to update status', 'error');
                                                        }
                                                    } catch (err) {
                                                        showToast('Network error', 'error');
                                                    }
                                                }
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"
                                            leftIcon={<CheckCircle2 className="w-4 h-4" />}
                                        >
                                            Mark complete
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleGenerateReport}
                                        variant="secondary"
                                        className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.09)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)]"
                                    >
                                        Generate Report
                                    </Button>
                                    <Button
                                        onClick={() => setShowEditModal(true)}
                                        className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
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

            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-[#18181B] p-6 rounded-lg border border-[rgba(255,255,255,0.09)] shadow-lg hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Activity className="w-5 h-5 text-[#3B82F6]" />
                            </div>
                            <span className="text-2xl font-semibold text-[rgba(255,255,255,0.9)]">{stats.progress}%</span>
                        </div>
                        <p className="text-[11px] font-semibold text-[rgba(255,255,255,0.5)]">Overall progress</p>
                        <div className="h-2 w-full bg-[rgba(255,255,255,0.1)] rounded-full mt-3 overflow-hidden">
                            <div
                                className="h-full bg-[#3B82F6] transition-all duration-1000"
                                style={{ width: `${stats.progress}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-[rgba(255,255,255,0.4)] mt-2 font-semibold">Weighted: Tasks + Milestones</p>
                    </div>

                    <div className="bg-[#18181B] p-6 rounded-lg border border-[rgba(255,255,255,0.09)] shadow-lg hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Target className="w-5 h-5 text-emerald-400" />
                            </div>
                            <span className="text-2xl font-semibold text-[rgba(255,255,255,0.9)]">{stats.milestones.total}</span>
                        </div>
                        <p className="text-[11px] font-semibold text-[rgba(255,255,255,0.5)]">Your milestones</p>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-1000"
                                    style={{ width: `${stats.milestones.total > 0 ? (stats.milestones.completed / stats.milestones.total) * 100 : 0}%` }}
                                />
                            </div>
                            <span className="text-xs text-[rgba(255,255,255,0.7)] font-semibold whitespace-nowrap">{stats.milestones.completed}/{stats.milestones.total}</span>
                        </div>
                    </div>

                    <div className="bg-[#18181B] p-6 rounded-lg border border-[rgba(255,255,255,0.09)] shadow-lg hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-[#3B82F6]/10 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-[#3B82F6]" />
                            </div>
                            <span className="text-2xl font-semibold text-[rgba(255,255,255,0.9)]">{stats.tasks.total}</span>
                        </div>
                        <p className="text-[11px] font-semibold text-[rgba(255,255,255,0.5)]">Your Task Scope</p>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#3B82F6] transition-all duration-1000"
                                    style={{ width: `${stats.tasks.total > 0 ? (stats.tasks.completed / stats.tasks.total) * 100 : 0}%` }}
                                />
                            </div>
                            <span className="text-xs text-[rgba(255,255,255,0.7)] font-semibold whitespace-nowrap">{stats.tasks.completed}/{stats.tasks.total}</span>
                        </div>
                    </div>

                    <div className="bg-[#18181B] p-6 rounded-lg border border-[rgba(255,255,255,0.09)] shadow-lg hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-orange-400" />
                            </div>
                            <span className={cn(
                                "text-2xl font-semibold",
                                (stats.tasks.overdue > 0 || stats.milestones.overdue > 0) ? "text-orange-400" : "text-[rgba(255,255,255,0.9)]"
                            )}>{stats.tasks.overdue + stats.milestones.overdue}</span>
                        </div>
                        <p className="text-[11px] font-semibold text-[rgba(255,255,255,0.5)]">Overdue items</p>
                        <p className="text-xs text-[rgba(255,255,255,0.7)] mt-2 font-medium">Need attention</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left & Middle Column: Tasks and Milestones */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Milestones */}
                        <section className="bg-[#18181B] border border-[rgba(255,255,255,0.09)] rounded-lg overflow-hidden shadow-lg">
                            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.09)] flex items-center justify-between bg-[rgba(0,0,0,0.2)]">
                                <h3 className="font-semibold text-[rgba(255,255,255,0.9)] flex items-center gap-2 tracking-tight text-sm">
                                    <TrendingUp className="w-4 h-4 text-[#3B82F6]" />
                                    {project.isRestricted ? 'Your milestones' : 'Milestones'}
                                </h3>
                                {['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole) && (
                                    <Button
                                        onClick={() => setShowMilestoneModal(true)}
                                        variant="secondary"
                                        size="sm"
                                        className="h-8 text-[11px] font-semibold bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.09)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.1)]"
                                    >
                                        Add Milestone
                                    </Button>
                                )}
                            </div>
                            <div className="p-6">
                                {project.milestones.length === 0 ? (
                                    <div className="py-8 sm:py-12 text-center text-[rgba(255,255,255,0.5)] border-2 border-dashed border-[rgba(255,255,255,0.09)] rounded-lg">
                                        {project.isRestricted
                                            ? "You have no assignments mapped for this project."
                                            : "No milestones mapped for this initiative."}
                                    </div>
                                ) : (
                                    <div className="relative space-y-8 before:absolute before:inset-0 before:left-3 before:h-full before:w-0.5 before:bg-[rgba(255,255,255,0.09)]">
                                        {project.milestones.map((milestone: any, idx: number) => (
                                            <div key={milestone.id} className="relative pl-10 group">
                                                <div className={cn(
                                                    "absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-[#131720] z-10 shadow-lg transition-all group-hover:scale-110",
                                                    milestone.status === 'COMPLETED' ? 'bg-emerald-500' :
                                                        milestone.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-[rgba(255,255,255,0.2)]'
                                                )} />
                                                <div
                                                    onClick={() => {
                                                        setSelectedMilestone(milestone);
                                                        setShowMilestoneDetail(true);
                                                    }}
                                                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[rgba(255,255,255,0.03)] p-4 rounded-lg border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer"
                                                >
                                                    <div>
                                                        <h4 className="font-semibold text-[rgba(255,255,255,0.9)] group-hover:text-[#3B82F6] transition-colors">{milestone.title}</h4>
                                                        <p className="text-xs text-[rgba(255,255,255,0.6)] mt-1">{milestone.description || "Critical project phase objective."}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.05)] px-2 py-1 rounded-md border border-[rgba(255,255,255,0.09)]">
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
                        <section className="bg-[#18181B] border border-[rgba(255,255,255,0.09)] rounded-lg overflow-hidden shadow-lg">
                            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.09)] flex items-center justify-between bg-[rgba(0,0,0,0.2)]">
                                <h3 className="font-semibold text-[rgba(255,255,255,0.9)] flex items-center gap-2 tracking-tight text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    {project.isRestricted ? 'Your Assigned Tasks' : 'Tasks'}
                                </h3>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setShowTaskModal(true)}
                                        size="sm"
                                        className="h-8 text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white"
                                    >
                                        New Task
                                    </Button>
                                </div>
                            </div>
                            <div className="divide-y divide-[rgba(255,255,255,0.05)]">
                                {project.tasks.length === 0 ? (
                                    <div className="p-6 sm:p-12 text-center text-[rgba(255,255,255,0.5)]">
                                        {project.isRestricted
                                            ? "Clear skies! No tasks currently assigned to you."
                                            : "No active tasks found in the backlog."}
                                    </div>
                                ) : (
                                    project.tasks.map((task: any) => (
                                        <div
                                            key={task.id}
                                            onClick={() => {
                                                setSelectedTask(task);
                                                setShowTaskDetail(true);
                                            }}
                                            className="p-4 hover:bg-[rgba(255,255,255,0.03)] transition-colors group flex items-start gap-4 cursor-pointer"
                                        >
                                            <div className={cn(
                                                "mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                                task.status === 'DONE' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[rgba(255,255,255,0.2)] group-hover:border-[#3B82F6]'
                                            )}>
                                                {task.status === 'DONE' && <CheckCircle2 className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1 gap-4">
                                                    <h4 className={cn("text-sm font-semibold transition-all flex-1", task.status === 'DONE' ? 'text-[rgba(255,255,255,0.5)] line-through' : 'text-[rgba(255,255,255,0.9)] group-hover:text-[#3B82F6]')}>
                                                        {task.title}
                                                    </h4>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {task.category && (
                                                            <span className={cn(
                                                                "text-[11px] font-semibold px-1.5 py-0.5 rounded-full   border",
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
                                                            "text-[11px] font-semibold px-1.5 py-0.5 rounded-full   border",
                                                            task.priority === 3 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                                task.priority === 2 ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                                    'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] border-[rgba(255,255,255,0.15)]'
                                                        )}>
                                                            {task.priority === 3 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-[11px] text-[rgba(255,255,255,0.6)] font-semibold">
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
                        <section className="bg-[#18181B] border border-[rgba(255,255,255,0.09)] rounded-lg p-6 shadow-lg">
                            <h3 className="font-semibold text-[rgba(255,255,255,0.9)] mb-6 flex items-center gap-2 tracking-tighter text-xs">
                                <Layout className="w-4 h-4 text-[rgba(255,255,255,0.7)]" />
                                Project details
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.5)]">Managers</span>
                                    <div className="space-y-2">
                                        {managers.length > 0 ? managers.map((m: any) => (
                                            <div key={m.id} className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.09)]">
                                                <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center font-semibold text-white shadow-lg">
                                                    {m.name?.charAt(0) || 'L'}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-semibold text-[rgba(255,255,255,0.9)] truncate">{m.name}</p>
                                                    <p className="text-[11px] text-[rgba(255,255,255,0.6)] font-semibold">Manager</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.09)] italic text-[rgba(255,255,255,0.4)] text-[11px]">
                                                No mission leads assigned.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.5)]">Project ID</span>
                                    <div className="p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.09)] font-mono text-[11px] break-all text-[rgba(255,255,255,0.6)]">
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

            <TaskDetailModal
                isOpen={showTaskDetail}
                onClose={() => setShowTaskDetail(false)}
                onDelete={fetchProjectDetails}
                task={selectedTask}
            />

            <MilestoneDetailModal
                isOpen={showMilestoneDetail}
                onClose={() => setShowMilestoneDetail(false)}
                onDelete={fetchProjectDetails}
                milestone={selectedMilestone}
            />
        </div>
    );
}
