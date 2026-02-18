"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
    GraduationCap,
    Flag,
    MessageSquare,
    Check,
    MoreHorizontal,
    TrendingUp,
    ExternalLink,
    PieChart,
    ChevronRight,
    SearchX,
    Activity
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import CreateMilestoneModal from '@/components/modals/CreateMilestoneModal';
import { StatusBadge, NotionButton } from '@/components/notion';
import type { StatusType } from '@/components/notion/StatusBadge';
import { cn } from '@/lib/utils';
import MilestoneDetailModal from '@/components/modals/MilestoneDetailModal';
import CompletionModal from '@/components/modals/CompletionModal';

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
    ownerUser?: { name: string };
    project?: { id: string; name: string };
    university?: { id: string; name: string };
    mouType?: string;
    isFlagged: boolean;
    remarks?: string;
    updatedAt: string;
}

const CATEGORIES = [
    { value: 'EUSAI_AGREEMENT', label: 'EUSAI Agreement' },
    { value: 'SPORTS_LOGO', label: 'Sports Logo Agreement' },
    { value: 'MOU', label: "MOU's" },
    { value: 'BUSINESS_ORDER', label: 'Business Order' },
    { value: 'CUSTOM', label: 'Custom' }
];

export default function MilestonesPage() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<any>({
        category: 'ALL',
        employeeId: '',
        universityId: '',
        overdueOnly: false,
        flaggedOnly: false,
        assignedUser: 'all'
    });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
    const [remarkText, setRemarkText] = useState('');
    const [isFlaggedChecked, setIsFlaggedChecked] = useState(false);
    const [isRemarking, setIsRemarking] = useState(false);

    const [selectedMilestoneForDetail, setSelectedMilestoneForDetail] = useState<Milestone | null>(null);
    const [milestoneToComplete, setMilestoneToComplete] = useState<Milestone | null>(null);

    const userRole = (session?.user as any)?.role || 'EMPLOYEE';
    const userId = (session?.user as any)?.id;
    const canCreate = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);
    const isManagement = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);
    const isDirector = userRole === 'DIRECTOR';

    const [searchQuery, setSearchQuery] = useState('');

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

    useEffect(() => {
        if (session) {
            fetchMilestones();
        }
    }, [session, filters.category, filters.employeeId, filters.universityId]);

    const filteredMilestones = useMemo(() => {
        const now = new Date();
        return milestones.filter(m => {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                m.title.toLowerCase().includes(query) ||
                m.description?.toLowerCase().includes(query) ||
                m.project?.name?.toLowerCase().includes(query) ||
                m.university?.name?.toLowerCase().includes(query) ||
                m.ownerUser?.name?.toLowerCase().includes(query);

            const isOverdue = m.targetDate && new Date(m.targetDate) < now && m.status !== 'COMPLETED';
            const matchesOverdue = !filters.overdueOnly || isOverdue;
            const matchesFlagged = !filters.flaggedOnly || m.isFlagged;
            const matchesUser = filters.assignedUser === 'all' || m.owner === filters.assignedUser;

            return matchesSearch && matchesOverdue && matchesFlagged && matchesUser;
        });
    }, [milestones, searchQuery, filters]);

    const teamPerformance = useMemo(() => {
        if (!isDirector) return [];
        const performanceMap: any = {};

        milestones.forEach(m => {
            const ownerId = m.owner;
            const ownerName = m.ownerUser?.name || 'Unknown Personnel';

            if (!performanceMap[ownerId]) {
                performanceMap[ownerId] = {
                    id: ownerId,
                    name: ownerName,
                    total: 0,
                    completed: 0,
                    overdue: 0,
                    flagged: 0
                };
            }

            const now = new Date();
            const isOverdue = m.targetDate && new Date(m.targetDate) < now && m.status !== 'COMPLETED';

            performanceMap[ownerId].total++;
            if (m.status === 'COMPLETED') performanceMap[ownerId].completed++;
            if (isOverdue) performanceMap[ownerId].overdue++;
            if (m.isFlagged) performanceMap[ownerId].flagged++;
        });

        return Object.values(performanceMap);
    }, [milestones, isDirector]);

    const handleUpdateStatus = async (milestoneId: string, status: string, progress: number) => {
        try {
            const res = await fetch(`/api/milestones/${milestoneId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, progress })
            });

            if (res.ok) {
                showToast(`Objective marked as ${status === 'COMPLETED' ? 'COMPLETED' : status.toLowerCase()}`, 'success');
                fetchMilestones();
            }
        } catch (error) {
            showToast('Failed to update objective', 'error');
        }
    };

    const handleCompleteMilestone = async (remarks: string, proofUrl?: string) => {
        if (!milestoneToComplete) return;

        try {
            const res = await fetch(`/api/milestones/${milestoneToComplete.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'COMPLETED',
                    progress: 100,
                    completionRemark: remarks,
                    completionProof: proofUrl
                })
            });

            if (res.ok) {
                showToast('Objective completion validated and logged', 'success');
                fetchMilestones();
                setMilestoneToComplete(null);
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to validate objective completion', 'error');
            }
        } catch (error) {
            showToast('Strategic synchronization failure', 'error');
        }
    };

    const handleAddRemark = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMilestone || !remarkText.trim()) return;

        setIsRemarking(true);
        try {
            const res = await fetch(`/api/milestones/${selectedMilestone.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ remarks: remarkText, isFlagged: isFlaggedChecked })
            });

            if (res.ok) {
                showToast('Policy updated successfully', 'success');
                setRemarkText('');
                setSelectedMilestone(null);
                fetchMilestones();
            }
        } catch (error) {
            showToast('Failed to update assessment', 'error');
        } finally {
            setIsRemarking(false);
        }
    };

    const handleQuickFilter = (type: string, payload?: any) => {
        switch (type) {
            case 'ALL':
                setFilters({ category: 'ALL', employeeId: '', universityId: '', overdueOnly: false, flaggedOnly: false, assignedUser: 'all' });
                break;
            case 'OVERDUE':
                setFilters({ ...filters, overdueOnly: true, flaggedOnly: false, assignedUser: 'all' });
                showToast('Interrogating overdue objectives...', 'success');
                break;
            case 'FLAGGED':
                setFilters({ ...filters, flaggedOnly: true, overdueOnly: false, assignedUser: 'all' });
                showToast('Retrieving flagged strategic concerns...', 'success');
                break;
            case 'PERSONNEL':
                setFilters({ category: 'ALL', employeeId: '', universityId: '', overdueOnly: false, flaggedOnly: false, assignedUser: payload === 'all' ? 'all' : payload });
                if (payload !== 'all') {
                    showToast(`Personnel isolation protocol active`, 'success');
                }
                break;
        }

        // Auto-scroll to registry on mobile/tablet for better UX
        if (window.innerWidth < 1024) {
            document.getElementById('milestone-registry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const mapStatusForBadge = (status: string): StatusType => {
        switch (status) {
            case 'COMPLETED': return 'done';
            case 'IN_PROGRESS': return 'in-progress';
            case 'PENDING': return 'not-started';
            case 'DELAYED': return 'under-review';
            default: return 'not-started';
        }
    };

    const stats = {
        total: milestones.length,
        completed: milestones.filter(m => m.status === 'COMPLETED').length,
        active: milestones.filter(m => m.status === 'IN_PROGRESS' || m.status === 'PENDING').length,
        flagged: milestones.filter(m => m.isFlagged).length,
        overdue: milestones.filter(m => {
            const now = new Date();
            return m.targetDate && new Date(m.targetDate) < now && m.status !== 'COMPLETED';
        }).length
    };

    return (
        <div className="min-h-screen bg-[#191919] text-[rgba(255,255,255,0.9)] pb-20">
            {/* Header / Command Center */}
            <div className="bg-[#1D2125] border-b border-[rgba(255,255,255,0.08)] shadow-xl relative z-20">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0052CC] to-[#0747A6] flex items-center justify-center shadow-lg shadow-blue-900/40">
                                <Target className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-[rgba(255,255,255,0.4)] text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                                    <Activity className="w-3 h-3 text-[#0052CC]" />
                                    Strategic Intelligence
                                </div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-[rgba(255,255,255,0.95)]">Objectives Registry</h1>
                                <p className="text-[rgba(255,255,255,0.5)] text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mt-1">
                                    {isManagement ? 'Governance oversight for all active missions' : 'Operational ledger for assigned deliverables'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {canCreate && (
                                <NotionButton
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="bg-[#0052CC] hover:bg-[#0747A6] text-white shadow-xl shadow-blue-900/20 px-6 font-black uppercase tracking-[0.15em] text-[10px] h-11"
                                    leftIcon={Plus}
                                >
                                    Initiate Milestone
                                </NotionButton>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-2 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Metrics Dashboard */}
                {isManagement && !isLoading && milestones.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <MetricSummaryCard
                            label="Operational yield"
                            value={`${Math.round((stats.completed / stats.total) * 100) || 0}%`}
                            subtext={`${stats.completed} of ${stats.total} goals met`}
                            icon={TrendingUp}
                            color="blue"
                            onClick={() => handleQuickFilter('ALL')}
                        />
                        <MetricSummaryCard
                            label="Overdue Missions"
                            value={stats.overdue}
                            subtext="Strategic timeline breach"
                            icon={Clock}
                            color="emerald"
                            onClick={() => handleQuickFilter('OVERDUE')}
                        />
                        <MetricSummaryCard
                            label="Personnel Units"
                            value={new Set(milestones.map(m => m.owner)).size}
                            subtext="Active mission owners"
                            icon={User}
                            color="indigo"
                            onClick={() => handleQuickFilter('PERSONNEL', 'all')}
                        />
                        <MetricSummaryCard
                            label="Critical Flags"
                            value={stats.flagged}
                            subtext="Mandatory review required"
                            icon={AlertCircle}
                            color="red"
                            onClick={() => handleQuickFilter('FLAGGED')}
                        />
                    </div>
                )}

                {/* Strategic Personnel Assessment (Directors Only) */}
                {isDirector && teamPerformance.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-1">
                            <Activity className="w-4 h-4 text-[#0052CC]" />
                            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Personnel Operational Yield</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {teamPerformance.map((member: any) => (
                                <div
                                    key={member.id}
                                    onClick={() => handleQuickFilter('PERSONNEL', member.id)}
                                    className="bg-[#2f3437] border border-[rgba(255,255,255,0.08)] p-5 rounded-lg hover:border-[rgba(255,255,255,0.2)] transition-all group cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-[#1D2125] border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-black text-[#0052CC] text-sm shadow-inner group-hover:scale-110 transition-transform">
                                                {member.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white tracking-tight">{member.name}</h4>
                                                <p className="text-[8px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] mt-0.5">Mission Controller</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-white">{Math.round((member.completed / member.total) * 100) || 0}%</span>
                                            <span className="text-[8px] font-black text-[rgba(255,255,255,0.2)] uppercase">Yield</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-tighter">
                                            <span className="text-[rgba(255,255,255,0.4)]">Objectives</span>
                                            <span className="text-white">{member.completed}/{member.total}</span>
                                        </div>
                                        <div className="h-1 w-full bg-[#1D2125] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#0052CC] transition-all duration-1000"
                                                style={{ width: `${(member.completed / member.total) * 100 || 0}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className={cn("w-3 h-3", member.overdue > 0 ? "text-red-500" : "text-[rgba(255,255,255,0.1)]")} />
                                                <span className={cn("text-[9px] font-black", member.overdue > 0 ? "text-red-400" : "text-[rgba(255,255,255,0.2)]")}>{member.overdue} Delayed</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Flag className={cn("w-3 h-3", member.flagged > 0 ? "text-orange-500" : "text-[rgba(255,255,255,0.1)]")} />
                                                <span className={cn("text-[9px] font-black", member.flagged > 0 ? "text-orange-400" : "text-[rgba(255,255,255,0.2)]")}>{member.flagged} Flagged</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters & Control Deck */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-[#2f3437] p-4 lg:p-3 rounded-lg border border-[rgba(255,255,255,0.08)] shadow-lg sticky top-0 z-30 backdrop-blur-md bg-opacity-95">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.3)] group-focus-within:text-[#0052CC] transition-colors" />
                        <input
                            placeholder="Interrogate data... (Name, Project, ID)"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none text-sm pl-12 focus:ring-0 placeholder-[rgba(255,255,255,0.3)] text-[rgba(255,255,255,0.8)] font-bold tracking-tight py-2 sm:py-1"
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:items-center gap-3 lg:gap-4 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-3">
                            <span className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.15em] lg:tracking-widest">Category:</span>
                            <select
                                value={filters.category}
                                onChange={e => setFilters({ ...filters, category: e.target.value })}
                                className="bg-[#191919] border border-[rgba(255,255,255,0.1)] text-[10px] font-black uppercase tracking-wider text-[rgba(255,255,255,0.7)] focus:ring-1 focus:ring-[#0052CC] cursor-pointer hover:bg-[#3b4045] rounded-md px-2 py-1.5 transition-all outline-none h-8 lg:h-9 w-full lg:w-36"
                            >
                                <option value="ALL">All Categories</option>
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>

                        {isManagement && (
                            <div className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-3">
                                <span className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.15em] lg:tracking-widest">Assignee:</span>
                                <input
                                    placeholder="ID..."
                                    value={filters.employeeId}
                                    onChange={e => setFilters({ ...filters, employeeId: e.target.value })}
                                    className="bg-[#191919] border border-[rgba(255,255,255,0.1)] text-[10px] font-bold text-[rgba(255,255,255,0.8)] py-1.5 px-3 focus:ring-1 focus:ring-[#0052CC] w-full lg:w-32 rounded-md outline-none h-8 lg:h-9 shadow-inner"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Central Registry (Database View) */}
                <div id="milestone-registry" className="scroll-mt-32">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-6">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-t-[#0052CC] border-[rgba(255,255,255,0.05)] animate-spin" />
                                <Target className="absolute inset-0 m-auto w-6 h-6 text-[#0052CC] animate-pulse" />
                            </div>
                            <p className="text-[rgba(255,255,255,0.4)] text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Establishing Secure Uplink...</p>
                        </div>
                    ) : filteredMilestones.length === 0 ? (
                        <div className="bg-[#2f3437] border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-xl py-32 flex flex-col items-center justify-center text-center px-8">
                            <SearchX className="w-16 h-16 text-[rgba(255,255,255,0.1)] mb-6" />
                            <h3 className="text-xl font-black text-[rgba(255,255,255,0.9)] tracking-tight">Zero Objectives Found</h3>
                            <p className="text-[rgba(255,255,255,0.4)] text-sm mt-3 max-w-sm font-medium">No results match your current scope or filters. Reset parameters to re-scan the registry.</p>
                            <NotionButton
                                variant="default"
                                className="mt-8 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.08)] text-[10px] font-black uppercase tracking-widest"
                                onClick={() => handleQuickFilter('ALL')}
                            >
                                Reset Registry
                            </NotionButton>
                        </div>
                    ) : (
                        <div className="bg-[#2f3437] border border-[rgba(255,255,255,0.09)] rounded-lg overflow-hidden shadow-2xl">
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[rgba(0,0,0,0.2)] border-b border-[rgba(255,255,255,0.08)]">
                                            <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] w-12 hidden sm:table-cell">REF</th>
                                            <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] min-w-[200px] sm:min-w-[300px]">Strategic Initiative</th>
                                            <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em]">Status</th>
                                            <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] hidden md:table-cell">Priority</th>
                                            <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em]">Deadline</th>
                                            <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] hidden lg:table-cell">Core Entity</th>
                                            {isManagement && <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] hidden md:table-cell">Owner</th>}
                                            <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
                                        {filteredMilestones.map((m, idx) => (
                                            <tr key={m.id} className="hover:bg-[rgba(255,255,255,0.04)] transition-all duration-300 group relative">
                                                <td className="px-5 py-5 text-[10px] font-black font-mono text-[rgba(255,255,255,0.15)] group-hover:text-[#0052CC] transition-colors hidden sm:table-cell">
                                                    {String(idx + 1).padStart(3, '0')}
                                                </td>
                                                <td className="px-5 py-5 cursor-pointer" onClick={() => setSelectedMilestoneForDetail(m)}>
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            {m.isFlagged && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
                                                            <span className="text-[13px] font-black tracking-tight text-[rgba(255,255,255,0.9)] group-hover:text-[#0052CC] transition-colors">{m.title}</span>
                                                        </div>
                                                        <span className="text-[10px] text-[rgba(255,255,255,0.4)] font-bold uppercase tracking-wider line-clamp-1 max-w-[150px] sm:max-w-sm">{m.description || "Mission-critical objective tracking."}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5">
                                                    <StatusBadge status={mapStatusForBadge(m.status)} size="sm" />
                                                </td>
                                                <td className="px-5 py-5 hidden md:table-cell">
                                                    <div className={cn(
                                                        "text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-[0.1em] border inline-flex items-center gap-1.5 shadow-sm",
                                                        m.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            m.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    )}>
                                                        <div className={cn("w-1 h-1 rounded-full",
                                                            m.priority === 'CRITICAL' ? 'bg-red-400' :
                                                                m.priority === 'HIGH' ? 'bg-orange-400' :
                                                                    'bg-blue-400'
                                                        )} />
                                                        {m.priority}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-1.5 text-xs text-[rgba(255,255,255,0.7)] font-black tracking-tight">
                                                            <Clock className="w-3.5 h-3.5 text-[rgba(255,255,255,0.2)]" />
                                                            {new Date(m.targetDate).toLocaleDateString()}
                                                        </div>
                                                        {new Date(m.targetDate) < new Date() && m.status !== 'COMPLETED' && (
                                                            <span className="text-[9px] font-black text-red-500/80 uppercase tracking-tighter">Overdue</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5 hidden lg:table-cell">
                                                    {m.project ? (
                                                        <div className="flex items-center gap-2 group/link cursor-pointer">
                                                            <div className="p-1.5 bg-blue-500/10 rounded-md border border-blue-500/20 group-hover/link:bg-blue-500/20 transition-all">
                                                                <Briefcase className="w-3 h-3 text-[#0052CC]" />
                                                            </div>
                                                            <span className="text-xs font-black text-[#0052CC] tracking-tight group-hover/link:underline">{m.project.name}</span>
                                                        </div>
                                                    ) : m.university ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                                                                <GraduationCap className="w-3 h-3 text-emerald-400" />
                                                            </div>
                                                            <span className="text-xs font-black text-emerald-400 tracking-tight">{m.university.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[rgba(255,255,255,0.1)] text-[9px] font-black tracking-[0.2em] uppercase">SYSTEM</span>
                                                    )}
                                                </td>
                                                {isManagement && (
                                                    <td className="px-5 py-5 hidden md:table-cell">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded bg-[#1D2125] border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-black text-white text-[10px] shadow-inner">
                                                                {m.ownerUser?.name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-[rgba(255,255,255,0.9)] tracking-tight truncate max-w-[120px]">{m.ownerUser?.name || "Staff"}</span>
                                                                <span className="text-[9px] font-black text-[rgba(255,255,255,0.25)] uppercase tracking-tighter">Assigned Owner</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-5 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 sm:translate-x-2 sm:group-hover:translate-x-0">
                                                        {(m.owner === userId || isManagement) && m.status !== 'COMPLETED' && (
                                                            <button
                                                                onClick={() => setMilestoneToComplete(m)}
                                                                className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-md border border-transparent hover:border-emerald-500/30 transition-all active:scale-90"
                                                                title="Complete Objective"
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {isManagement && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedMilestone(m);
                                                                    setRemarkText(m.remarks || '');
                                                                    setIsFlaggedChecked(m.isFlagged);
                                                                }}
                                                                className={cn(
                                                                    "p-2 rounded-md border transition-all active:scale-90",
                                                                    m.isFlagged
                                                                        ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
                                                                        : "hover:bg-[rgba(255,255,255,0.05)] border-transparent hover:border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)] hover:text-white"
                                                                )}
                                                                title="Strategic Intervention"
                                                            >
                                                                <Flag className={cn("w-4 h-4", m.isFlagged && "fill-current")} />
                                                            </button>
                                                        )}
                                                        <button className="p-2 hover:bg-[rgba(255,255,255,0.05)] border border-transparent hover:border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.3)] hover:text-white rounded-md transition-all">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card List */}
                            <div className="md:hidden divide-y divide-[rgba(255,255,255,0.05)]">
                                {filteredMilestones.map((m) => (
                                    <div key={m.id} className="p-4 active:bg-[rgba(255,255,255,0.02)] transition-colors">
                                        <div className="flex items-start justify-between gap-3 mb-2.5">
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {m.isFlagged && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />}
                                                    <span className="text-[13px] font-black text-white leading-tight">{m.title}</span>
                                                </div>
                                                <span className="text-[10px] text-[rgba(255,255,255,0.4)] font-bold uppercase tracking-wider truncate">{m.description || "Mission-critical objective."}</span>
                                            </div>
                                            <StatusBadge status={mapStatusForBadge(m.status)} size="sm" />
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className={cn(
                                                "text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter border",
                                                m.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    m.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            )}>
                                                {m.priority}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-[rgba(255,255,255,0.5)]">
                                                <Clock className="w-3 h-3 opacity-30" />
                                                {new Date(m.targetDate).toLocaleDateString()}
                                            </div>
                                            {m.project && (
                                                <div className="text-[9px] font-black text-[#0052CC] uppercase tracking-widest truncate max-w-[100px]">
                                                    {m.project.name}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center font-black text-[8px]">
                                                    {m.ownerUser?.name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-[10px] font-bold text-[rgba(255,255,255,0.4)]">{m.ownerUser?.name || "Governance"}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {(m.owner === userId || isManagement) && m.status !== 'COMPLETED' && (
                                                    <button
                                                        onClick={() => setMilestoneToComplete(m)}
                                                        className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded border border-emerald-500/20 active:scale-95 transition-all"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                                <button className="p-1.5 text-[rgba(255,255,255,0.2)]">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Modal Entrypoint */}
                <CreateMilestoneModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={fetchMilestones}
                />

                <MilestoneDetailModal
                    isOpen={!!selectedMilestoneForDetail}
                    onClose={() => setSelectedMilestoneForDetail(null)}
                    milestone={selectedMilestoneForDetail}
                />

                <CompletionModal
                    isOpen={!!milestoneToComplete}
                    onClose={() => setMilestoneToComplete(null)}
                    onComplete={handleCompleteMilestone}
                    title={milestoneToComplete?.title || ''}
                    type="MILESTONE"
                />

                {/* Governance Intervention Layer (Modal) */}
                {selectedMilestone && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                        <div className="bg-[#1D2125] w-full max-w-lg rounded-xl border border-[rgba(255,255,255,0.1)] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.7)] overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="px-8 py-6 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between bg-gradient-to-r from-[rgba(0,0,0,0.3)] to-transparent">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-[#0052CC]" />
                                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.25em]">Strategic Assessment</h3>
                                </div>
                                <button onClick={() => setSelectedMilestone(null)} className="text-[rgba(255,255,255,0.3)] hover:text-white transition-colors p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAddRemark} className="p-8 space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] block">Active Initiative</label>
                                    <div className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                        {selectedMilestone.title}
                                        {selectedMilestone.project && <span className="text-[9px] font-black text-[#0052CC] bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10 uppercase tracking-widest">{selectedMilestone.project.name}</span>}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] block">Operational Assessment</label>
                                    <textarea
                                        required
                                        autoFocus
                                        value={remarkText}
                                        onChange={e => setRemarkText(e.target.value)}
                                        className="w-full bg-[#141414] border border-[rgba(255,255,255,0.1)] rounded-lg p-4 text-sm font-bold tracking-tight focus:ring-1 focus:ring-[#0052CC] transition-all min-h-[160px] text-white resize-none shadow-inner placeholder-[rgba(255,255,255,0.2)]"
                                        placeholder="Provide detailed strategic instructions..."
                                    />
                                </div>

                                <div className="flex items-center gap-4 p-5 bg-red-500/5 rounded-lg border border-red-500/20 shadow-inner">
                                    <input
                                        type="checkbox"
                                        id="modal-flag-toggle"
                                        checked={isFlaggedChecked}
                                        onChange={e => setIsFlaggedChecked(e.target.checked)}
                                        className="w-5 h-5 rounded border-[rgba(255,255,255,0.2)] bg-[#191919] text-red-600 focus:ring-red-600 cursor-pointer"
                                    />
                                    <div className="flex flex-col">
                                        <label htmlFor="modal-flag-toggle" className="text-[10px] font-black text-red-400 cursor-pointer uppercase tracking-[0.15em] flex items-center gap-2">
                                            Elevate Strategic Concern
                                        </label>
                                        <span className="text-[10px] text-red-400/50 font-bold tracking-tight mt-0.5">Mandatory executive review triggered</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 justify-end pt-8 border-t border-[rgba(255,255,255,0.08)]">
                                    <NotionButton
                                        type="button"
                                        variant="default"
                                        onClick={() => setSelectedMilestone(null)}
                                        className="bg-transparent border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] px-6 font-black uppercase tracking-[0.2em] text-[9px]"
                                    >
                                        Abort
                                    </NotionButton>
                                    <NotionButton
                                        type="submit"
                                        disabled={isRemarking}
                                        className="bg-[#0052CC] hover:bg-[#0747A6] text-white px-8 shadow-xl shadow-blue-900/40 font-black uppercase tracking-[0.2em] text-[9px] h-10"
                                    >
                                        {isRemarking ? 'Syncing...' : 'Sync Policy'}
                                    </NotionButton>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function MetricSummaryCard({ label, value, subtext, icon: Icon, color, onClick }: any) {
    const colorStyles: any = {
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/10",
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/10",
        indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/10",
        red: "text-red-400 bg-red-500/10 border-red-500/10"
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-[#2f3437] border border-[rgba(255,255,255,0.08)] p-5 sm:p-6 rounded-lg flex items-center gap-4 sm:gap-6 shadow-xl relative overflow-hidden group transition-all duration-300",
                onClick && "cursor-pointer hover:bg-[#32393d] hover:border-[rgba(255,255,255,0.2)] active:scale-[0.98]"
            )}
        >
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700">
                <Icon className="w-16 h-16 sm:w-20 sm:h-20 transform translate-x-4 translate-y-2 rotate-12" />
            </div>
            <div className={cn("p-3 sm:p-4 rounded-xl border transition-all duration-700 group-hover:scale-110", colorStyles[color])}>
                <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-black text-[rgba(255,255,255,0.95)] tracking-tighter leading-none mb-1.5">{value}</div>
                <div className="text-[9px] font-black text-[rgba(255,255,255,0.25)] uppercase tracking-[0.25em]">{label}</div>
                {subtext && (
                    <div className="text-[9px] font-bold text-[rgba(255,255,255,0.15)] mt-1 truncate">{subtext}</div>
                )}
            </div>
        </div>
    );
}
