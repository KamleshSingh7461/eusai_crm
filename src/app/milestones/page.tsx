"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Target,
    Filter,
    Plus,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    Briefcase,
    Loader2,
    X,
    Search,
    GraduationCap
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface Milestone {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    progress: number;
    targetDate: string;
    owner: string;
    project?: { name: string };
    university?: { name: string };
    mouType?: string;
}

interface University {
    id: string;
    name: string;
}

export default function MilestonesPage() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [universities, setUniversities] = useState<University[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ category: 'ALL', employeeId: '', universityId: '' });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        category: 'EUSAI_LOGO',
        priority: 'MEDIUM',
        targetDate: '',
        description: '',
        assignedTo: '',
        projectId: '',
        universityId: '',
        mouType: ''
    });

    const userRole = (session?.user as any)?.role || 'EMPLOYEE';
    const canCreate = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);

    useEffect(() => {
        fetchMilestones();
        fetchUniversities();
        if (isCreateModalOpen) {
            fetchFormOptions();
        }
    }, [filters, isCreateModalOpen]);

    const fetchFormOptions = async () => {
        try {
            // 1. Fetch Projects
            const projRes = await fetch('/api/projects');
            if (projRes.ok) setProjects(await projRes.json());

            // 2. Fetch Team Members
            if (userRole === 'TEAM_LEADER') {
                const res = await fetch('/api/dashboard/team-leader');
                if (res.ok) {
                    const data = await res.json();
                    setTeamMembers(data.team || []);
                }
            } else if (['DIRECTOR', 'MANAGER'].includes(userRole)) {
                const res = await fetch('/api/team');
                if (res.ok) {
                    const data = await res.json();
                    setTeamMembers(data.users || (Array.isArray(data) ? data : []));
                }
            }
        } catch (error) {
            console.error("Failed to fetch modal options", error);
        }
    };

    const fetchUniversities = async () => {
        try {
            const res = await fetch('/api/universities?status=ALL');
            if (res.ok) {
                const data = await res.json();
                setUniversities(data.universities || (Array.isArray(data) ? data : []));
            }
        } catch (error) {
            console.error("Failed to fetch universities", error);
        }
    };

    const fetchMilestones = async () => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams();
            if (filters.category !== 'ALL') query.append('category', filters.category);
            if (filters.employeeId) query.append('employeeId', filters.employeeId);
            if (filters.universityId) query.append('universityId', filters.universityId);

            const res = await fetch(`/api/milestones?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setMilestones(data);
            } else {
                showToast('Failed to load milestones', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Ensure targetDate is valid
            if (!formData.targetDate) {
                showToast('Please select a target date', 'error');
                return;
            }

            const res = await fetch('/api/milestones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showToast('Milestone created successfully', 'success');
                setIsCreateModalOpen(false);
                fetchMilestones();
                setFormData({
                    title: '', category: 'EUSAI_LOGO', priority: 'MEDIUM',
                    targetDate: '', description: '', assignedTo: '', projectId: '',
                    universityId: '', mouType: ''
                });
            } else {
                const err = await res.json();
                showToast(err.error || 'Failed to create milestone', 'error');
            }
        } catch (error) {
            showToast('Error creating milestone', 'error');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DELAYED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getPriorityIcon = (priority: string) => {
        if (priority === 'CRITICAL') return <AlertCircle className="w-3 h-3 text-red-600" />;
        if (priority === 'HIGH') return <Target className="w-3 h-3 text-orange-500" />;
        return <Clock className="w-3 h-3 text-slate-500" />;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#172B4D] mb-2">Milestones</h1>
                    <p className="text-[#6B778C]">Track key deliverables, MOUs, and team goals.</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn-eusai-create flex items-center gap-2 px-6 py-3 h-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Create Milestone
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="card-jira p-4 flex flex-col md:flex-row gap-4 items-end md:items-center bg-white border border-[#DFE1E6] rounded-sm shadow-sm">
                <div className="w-full md:w-auto flex-1">
                    <label className="text-xs font-bold text-[#6B778C] uppercase mb-1 block">Category</label>
                    <select
                        value={filters.category}
                        onChange={e => setFilters({ ...filters, category: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm text-sm focus:border-[#0052CC] outline-none"
                    >
                        <option value="ALL">All Categories</option>
                        <option value="EUSAI_LOGO">EUSAI Logo</option>
                        <option value="MOU">MOU</option>
                        <option value="BUSINESS_ORDER">Business/Order</option>
                        <option value="CUSTOM">Custom</option>
                    </select>
                </div>
                <div className="w-full md:w-auto flex-1">
                    <label className="text-xs font-bold text-[#6B778C] uppercase mb-1 block">Filter by University</label>
                    <select
                        value={filters.universityId}
                        onChange={e => setFilters({ ...filters, universityId: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm text-sm focus:border-[#0052CC] outline-none"
                    >
                        <option value="">All Universities</option>
                        {universities.map(uni => (
                            <option key={uni.id} value={uni.id}>{uni.name}</option>
                        ))}
                    </select>
                </div>
                {(userRole === 'DIRECTOR' || userRole === 'MANAGER' || userRole === 'TEAM_LEADER') && (
                    <div className="w-full md:w-auto flex-1">
                        <label className="text-xs font-bold text-[#6B778C] uppercase mb-1 block">Filter by Employee ID</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B778C]" />
                            <input
                                placeholder="Enter User ID..."
                                value={filters.employeeId}
                                onChange={e => setFilters({ ...filters, employeeId: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm text-sm focus:border-[#0052CC] outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Milestones Grid */}
            {isLoading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3 text-[#6B778C]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
                    <p className="text-sm">Loading milestones...</p>
                </div>
            ) : milestones.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-[#DFE1E6] rounded-sm text-[#6B778C]">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <h3 className="text-lg font-bold mb-1">No Milestones Found</h3>
                    <p className="text-sm max-w-sm mx-auto">There are no milestones matching your filters. {canCreate && 'Create one to get started!'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {milestones.map((milestone) => (
                        <div key={milestone.id} className="card-jira p-5 bg-white border border-[#DFE1E6] rounded-sm shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                            {/* Status Stripe */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${milestone.status === 'COMPLETED' ? 'bg-green-500' :
                                milestone.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                                    'bg-slate-300'
                                }`} />

                            <div className="flex justify-between items-start mb-3 pl-2">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 roundedElement text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(milestone.status)}`}>
                                        {milestone.status.replace('_', ' ')}
                                    </span>
                                    {milestone.category === 'MOU' && <span className="text-xs">💼</span>}
                                    {milestone.category === 'EUSAI_LOGO' && <span className="text-xs">🏆</span>}
                                </div>
                                <div className="flex items-center gap-1" title={`Priority: ${milestone.priority}`}>
                                    {getPriorityIcon(milestone.priority)}
                                </div>
                            </div>

                            <h3 className="text-base font-bold text-[#172B4D] mb-1 pl-2 truncate" title={milestone.title}>
                                {milestone.title}
                            </h3>
                            <p className="text-sm text-[#5E6C84] mb-4 pl-2 line-clamp-2 h-10">
                                {milestone.description || 'No description provided.'}
                            </p>

                            <div className="pl-2 space-y-3">
                                <div className="flex items-center gap-2 text-xs text-[#6B778C]">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Due: {new Date(milestone.targetDate).toLocaleDateString()}</span>
                                </div>
                                {milestone.project && (
                                    <div className="flex items-center gap-2 text-xs text-[#6B778C]">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[150px]">{milestone.project.name}</span>
                                    </div>
                                )}
                                {milestone.university && (
                                    <div className="flex items-center gap-2 text-xs text-[#6B778C]">
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[150px]">{milestone.university.name}</span>
                                    </div>
                                )}
                                <div className="w-full bg-[#EBECF0] h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-[#0052CC] h-full transition-all duration-500"
                                        style={{ width: `${milestone.progress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-[#6B778C] font-mono">
                                    <span>Progress</span>
                                    <span>{milestone.progress}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="card-eusai w-full max-w-lg bg-white rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC] shrink-0">
                            <h3 className="text-lg font-bold text-[#172B4D]">Create New Milestone</h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1 hover:bg-[#EBECF0] rounded-sm text-[#6B778C]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="create-milestone-form" onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#6B778C] uppercase">Title</label>
                                    <input
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm text-sm focus:border-[#0052CC] outline-none"
                                        placeholder="e.g. Sign MOU with University X"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#6B778C] uppercase">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm text-sm focus:border-[#0052CC] outline-none"
                                        >
                                            <option value="EUSAI_LOGO">EUSAI Logo</option>
                                            <option value="MOU">MOU</option>
                                            <option value="BUSINESS_ORDER">Business/Order</option>
                                            <option value="CUSTOM">Custom</option>
                                        </select>
                                    </div>

                                    {formData.category === 'MOU' && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#6B778C] uppercase">MOU Type</label>
                                            <select
                                                value={formData.mouType}
                                                onChange={e => setFormData({ ...formData, mouType: e.target.value })}
                                                className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm text-sm focus:border-[#0052CC] outline-none"
                                            >
                                                <option value="">Select Type...</option>
                                                <option value="Merchandise Store MOU">Merchandise Store MOU</option>
                                                <option value="School Spirit Agreement">School Spirit Agreement</option>
                                                <option value="FGSN Studio Agreement">FGSN Studio Agreement</option>
                                                <option value="Outgoing Program MOU">Outgoing Program MOU</option>
                                                <option value="Alumni Establishment MOU">Alumni Establishment MOU</option>
                                                <option value="Scholarship Transfer Letter">Scholarship Transfer Letter</option>
                                                <option value="Scholarship Valuation Letter">Scholarship Valuation Letter</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#6B778C] uppercase">University</label>
                                        <select
                                            value={formData.universityId}
                                            onChange={e => setFormData({ ...formData, universityId: e.target.value })}
                                            className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm text-sm focus:border-[#0052CC] outline-none"
                                        >
                                            <option value="">No University</option>
                                            {universities.map(uni => (
                                                <option key={uni.id} value={uni.id}>{uni.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#6B778C] uppercase">Priority</label>
                                        <select
                                            value={formData.priority}
                                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                            className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm text-sm focus:border-[#0052CC] outline-none"
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="CRITICAL">Critical</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#6B778C] uppercase">Target Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.targetDate}
                                        onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm text-sm focus:border-[#0052CC] outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#6B778C] uppercase">Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm text-sm focus:border-[#0052CC] outline-none resize-none"
                                        placeholder="Add details about deliverables..."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#6B778C] uppercase flex items-center gap-1">
                                        <User className="w-3 h-3" /> Assign To
                                    </label>
                                    <select
                                        value={formData.assignedTo}
                                        onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm text-sm focus:border-[#0052CC] outline-none"
                                    >
                                        <option value="">Me (Self)</option>
                                        {teamMembers.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-[#6B778C]">Select the employee responsible for this deliverable.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#6B778C] uppercase flex items-center gap-1">
                                        <Briefcase className="w-3 h-3" /> Link Project (Optional)
                                    </label>
                                    <select
                                        value={formData.projectId}
                                        onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm text-sm focus:border-[#0052CC] outline-none"
                                    >
                                        <option value="">No Project</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 border-t border-[#DFE1E6] bg-[#FAFBFC] flex justify-end gap-2 shrink-0">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 hover:bg-[#EBECF0] rounded-sm text-[#42526E] font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="create-milestone-form"
                                className="btn-eusai-create flex items-center gap-2 px-4 py-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Create Milestone
                            </button>
                        </div>
                    </div >
                </div >
            )
            }
        </div >
    );
}
