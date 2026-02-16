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
            <div className="flex h-screen items-center justify-center bg-[#F4F5F7]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-[#0052CC]" />
                    <p className="text-[#6B778C] font-bold text-sm uppercase tracking-widest">Accessing Initiative Intelligence...</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#F4F5F7]">
                <div className="text-center p-12 bg-white border border-[#DFE1E6] rounded-sm shadow-sm max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-[#172B4D] mb-2">Project Not Found</h2>
                    <p className="text-[#6B778C] text-sm mb-8">The initiative you are trying to access doesn't exist or has been decommissioned.</p>
                    <Button onClick={() => router.push('/projects')} variant="primary" className="w-full">
                        Back to Portfolio
                    </Button>
                </div>
            </div>
        );
    }

    const { stats, space, manager } = project;

    return (
        <div className="min-h-screen bg-[#F4F5F7] pb-12">
            {/* Header Banner */}
            <div className="bg-white border-b border-[#DFE1E6] p-8 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => router.push('/projects')}
                            className="p-2 hover:bg-[#F4F5F7] rounded-full transition-colors group"
                        >
                            <ChevronLeft className="w-5 h-5 text-[#6B778C] group-hover:text-[#0052CC]" />
                        </button>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#6B778C] uppercase tracking-widest">
                            <Link href="/projects" className="hover:text-[#0052CC]">Portfolio</Link>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-[#0052CC]">{space?.name || 'Unassigned Space'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-5">
                            <div className="w-16 h-16 rounded-sm bg-[#0052CC] flex items-center justify-center text-white text-3xl font-black shadow-lg transform -rotate-1">
                                {project.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-[#172B4D] tracking-tight mb-2 font-display">{project.name}</h1>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-[#6B778C] font-medium">
                                        <Briefcase className="w-4 h-4" />
                                        <span>PM: {manager?.name || 'Unassigned'}</span>
                                    </div>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#DFE1E6]" />
                                    <div className="flex items-center gap-2 text-sm text-[#6B778C] font-medium">
                                        <Calendar className="w-4 h-4" />
                                        <span>Ends {new Date(project.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <span className={cn(
                                        "ml-2 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider",
                                        project.status === 'EXECUTION' ? 'bg-emerald-100 text-emerald-700' :
                                            project.status === 'PLANNING' ? 'bg-blue-100 text-blue-700' :
                                                'bg-[#F4F5F7] text-[#42526E]'
                                    )}>
                                        {project.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {['DIRECTOR', 'MANAGER'].includes(userRole) && (
                                <>
                                    <Button
                                        onClick={handleGenerateReport}
                                        variant="secondary"
                                        className="bg-white border-[#DFE1E6]"
                                    >
                                        Generate Report
                                    </Button>
                                    <Button
                                        onClick={() => setShowEditModal(true)}
                                        className="bg-[#0052CC] hover:bg-[#0747A6]"
                                    >
                                        Edit Details
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-50 rounded-sm">
                                <Activity className="w-5 h-5 text-[#0052CC]" />
                            </div>
                            <span className="text-2xl font-black text-[#172B4D]">{stats.progress}%</span>
                        </div>
                        <p className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest">Mission Progress</p>
                        <div className="h-1.5 w-full bg-[#F4F5F7] rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-[#0052CC]" style={{ width: `${stats.progress}%` }} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-emerald-50 rounded-sm">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-2xl font-black text-[#172B4D]">₹{Math.round(stats.financial.spent / 1000)}k</span>
                        </div>
                        <p className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest">Total Investment</p>
                        <p className="text-xs text-emerald-600 mt-2 font-bold">Of ₹{Math.round(stats.financial.budget / 1000)}k Cap</p>
                    </div>

                    <div className="bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-orange-50 rounded-sm">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                            </div>
                            <span className="text-2xl font-black text-orange-600">{stats.tasks.overdue}</span>
                        </div>
                        <p className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest">Critical Delays</p>
                        <p className="text-xs text-[#6B778C] mt-2 italic font-medium">Overdue milestones & tasks</p>
                    </div>

                    <div className="bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-purple-50 rounded-sm">
                                <Target className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="text-2xl font-black text-[#172B4D]">{project._count.tasks}</span>
                        </div>
                        <p className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest">Total Scope</p>
                        <p className="text-xs text-[#6B778C] mt-2 font-bold">{stats.tasks.completed}/{project._count.tasks} Completed</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left & Middle Column: Tasks and Milestones */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Initiative Roadmap (Milestones) */}
                        <section className="bg-white border border-[#DFE1E6] rounded-sm overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                                <h3 className="font-bold text-[#172B4D] flex items-center gap-2 uppercase tracking-tight text-sm">
                                    <TrendingUp className="w-4 h-4 text-[#0052CC]" />
                                    Initiative Roadmap
                                </h3>
                                <Button
                                    onClick={() => setShowMilestoneModal(true)}
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 text-[10px] font-black tracking-widest uppercase"
                                >
                                    Add Milestone
                                </Button>
                            </div>
                            <div className="p-6">
                                {project.milestones.length === 0 ? (
                                    <div className="py-12 text-center text-[#6B778C] border-2 border-dashed border-[#EBECF0] rounded-sm">
                                        No milestones mapped for this initiative.
                                    </div>
                                ) : (
                                    <div className="relative space-y-8 before:absolute before:inset-0 before:left-3 before:h-full before:w-0.5 before:bg-[#EBECF0]">
                                        {project.milestones.map((milestone: any, idx: number) => (
                                            <div key={milestone.id} className="relative pl-10 group">
                                                <div className={cn(
                                                    "absolute left-0 top-1 w-6.5 h-6.5 rounded-full border-4 border-white z-10 shadow-sm transition-all group-hover:scale-110",
                                                    milestone.status === 'COMPLETED' ? 'bg-emerald-500' :
                                                        milestone.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-[#EBECF0]'
                                                )} />
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div>
                                                        <h4 className="font-bold text-[#172B4D] group-hover:text-[#0052CC] transition-colors">{milestone.title}</h4>
                                                        <p className="text-xs text-[#6B778C] mt-1">{milestone.description || "Critical project phase objective."}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-[#6B778C] bg-[#F4F5F7] px-2 py-0.5 rounded-full uppercase tracking-widest border border-[#DFE1E6]">
                                                            {new Date(milestone.targetDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                        <div className="w-32 h-1.5 bg-[#EBECF0] rounded-full overflow-hidden hidden md:block">
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
                        <section className="bg-white border border-[#DFE1E6] rounded-sm overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                                <h3 className="font-bold text-[#172B4D] flex items-center gap-2 uppercase tracking-tight text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    Mission Backlog
                                </h3>
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" className="h-8 text-[10px] font-black tracking-widest uppercase">
                                        Filter
                                    </Button>
                                    <Button
                                        onClick={() => setShowTaskModal(true)}
                                        size="sm"
                                        className="h-8 text-[10px] font-black tracking-widest uppercase bg-[#0052CC]"
                                    >
                                        New Task
                                    </Button>
                                </div>
                            </div>
                            <div className="divide-y divide-[#EBECF0]">
                                {project.tasks.length === 0 ? (
                                    <div className="p-12 text-center text-[#6B778C]">
                                        No active tasks found in the backlog.
                                    </div>
                                ) : (
                                    project.tasks.map((task: any) => (
                                        <div key={task.id} className="p-4 hover:bg-[#FAFBFC] transition-colors group flex items-start gap-4">
                                            <div className={cn(
                                                "mt-1 w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-all cursor-pointer",
                                                task.status === 'DONE' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[#EBECF0] group-hover:border-[#0052CC]'
                                            )}>
                                                {task.status === 'DONE' && <CheckCircle2 className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className={cn("text-sm font-bold transition-all", task.status === 'DONE' ? 'text-[#6B778C] line-through' : 'text-[#172B4D] group-hover:text-[#0052CC]')}>
                                                    </h4>
                                                    <div className="flex gap-2">
                                                        {task.category && (
                                                            <span className={cn(
                                                                "text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border",
                                                                task.category === 'EUSAI_AGREEMENT' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                    task.category === 'SPORTS_LOGO' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                        task.category === 'MOU' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                                            task.category === 'BUSINESS_ORDER' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                                                                                'bg-gray-50 text-gray-600 border-gray-100'
                                                            )}>
                                                                {task.category.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                        <span className={cn(
                                                            "text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest",
                                                            task.priority === 3 ? 'bg-red-50 text-red-600 border border-red-100' :
                                                                task.priority === 2 ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                                    'bg-gray-50 text-gray-600 border border-gray-100'
                                                        )}>
                                                            {task.priority === 3 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] text-[#6B778C] font-bold uppercase tracking-widest">
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
                        {/* Financial Audit */}
                        <section className="bg-[#172B4D] rounded-sm p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                                <DollarSign className="w-32 h-32" />
                            </div>
                            <h3 className="font-bold mb-6 flex items-center gap-2 uppercase tracking-tighter text-sm relative z-10">
                                <Activity className="w-4 h-4 text-[#00B8D9]" />
                                Financial Audit
                            </h3>
                            <div className="space-y-6 relative z-10">
                                <div className="p-4 bg-white/10 rounded-sm border border-white/10">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Actual Burn</p>
                                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <p className="text-2xl font-black">₹{Math.round(stats.financial.spent / 1000)}k <span className="text-xs font-normal text-white/40">Realized</span></p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
                                        <span>Budget Utilization</span>
                                        <span>{Math.round((stats.financial.spent / stats.financial.budget) * 100)}%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className={cn("h-full transition-all duration-1000 shadow-lg", (stats.financial.spent / stats.financial.budget) > 0.9 ? 'bg-[#FF5630]' : 'bg-[#00B8D9]')}
                                            style={{ width: `${Math.min(100, (stats.financial.spent / stats.financial.budget) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFAB00] mb-3">Recent Vouchers</p>
                                    <div className="space-y-3">
                                        {project.expenses.length === 0 ? (
                                            <p className="text-xs text-white/40">No approved expenses flagged.</p>
                                        ) : (
                                            project.expenses.slice(0, 3).map((expense: any) => (
                                                <div key={expense.id} className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-bold text-white truncate max-w-[120px]">{expense.description || "Vendor Payment"}</p>
                                                        <p className="text-[9px] text-white/40 uppercase">{expense.category}</p>
                                                    </div>
                                                    <p className="text-xs font-black text-white">₹{Math.round(expense.amount)}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Governance & Context */}
                        <section className="bg-white border border-[#DFE1E6] rounded-sm p-6 shadow-sm">
                            <h3 className="font-bold text-[#172B4D] mb-6 flex items-center gap-2 uppercase tracking-tighter text-xs">
                                <Layout className="w-4 h-4 text-[#6B778C]" />
                                Governance Context
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-[#6B778C] uppercase tracking-widest">Ownership</span>
                                    <div className="flex items-center gap-3 p-3 bg-[#F4F5F7] rounded-sm border border-[#EBECF0]">
                                        <div className="w-10 h-10 rounded-full bg-white border border-[#DFE1E6] flex items-center justify-center font-black text-[#0052CC] shadow-sm">
                                            {manager?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-black text-[#172B4D] truncate">{manager?.name || 'Unassigned Executive'}</p>
                                            <p className="text-[9px] text-[#6B778C] font-black uppercase tracking-wider">Initiative Lead</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-[#6B778C] uppercase tracking-widest">Metadata Hash</span>
                                    <div className="p-3 bg-[#F4F5F7] rounded-sm border border-[#EBECF0] font-mono text-[9px] break-all text-[#6B778C]">
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
