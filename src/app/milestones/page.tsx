"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import CreateMilestoneModal from '@/components/modals/CreateMilestoneModal';
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
    universityName?: string;
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
                                {milestone.universityName && !milestone.university && (
                                    <div className="flex items-center gap-2 text-xs text-[#6B778C]">
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[150px]">{milestone.universityName}</span>
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
            <CreateMilestoneModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    showToast('Milestones created successfully', 'success');
                    fetchMilestones();
                }}
            />
        </div>
    );
}
