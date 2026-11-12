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
    Activity,
    BellRing
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import CreateMilestoneModal from '@/components/modals/CreateMilestoneModal';
import { StatusBadge, NotionButton } from '@/components/notion';
import type { StatusType } from '@/components/notion/StatusBadge';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import MilestoneDetailModal from '@/components/modals/MilestoneDetailModal';
import CompletionModal from '@/components/modals/CompletionModal';
import Modal, { ModalIcon } from '@/components/ui/Modal';

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

    // /milestones?new=1 (from the Create menu) opens the new-milestone dialog.
    useEffect(() => {
        if (canCreate && new URLSearchParams(window.location.search).get('new') === '1') {
            setIsCreateModalOpen(true);
            window.history.replaceState(null, '', '/milestones');
        }
    }, [canCreate]);

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
                // ?milestoneId=<id> (from the dashboards) opens that milestone
                const wanted = new URLSearchParams(window.location.search).get('milestoneId');
                const match = wanted && Array.isArray(data) ? data.find((m: any) => m.id === wanted) : null;
                if (match) {
                    setSelectedMilestoneForDetail(match);
                    // open once: drop the parameter so later refreshes don't reopen it
                    const url = new URL(window.location.href);
                    url.searchParams.delete('milestoneId');
                    window.history.replaceState(null, '', url.pathname + url.search);
                }
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
            showToast('Something went wrong. Try again.', 'error');
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

    const handleSendOverdueReminder = async (milestoneId: string) => {
        try {
            const res = await fetch('/api/notifications/overdue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entityType: 'MILESTONE', entityId: milestoneId })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message || 'Overdue reminder sent successfully', 'success');
            } else {
                showToast(data.error || 'Failed to send overdue reminder', 'error');
            }
        } catch (error) {
            showToast('Something went wrong. Try again.', 'error');
        }
    };

    const handleQuickFilter = (type: string, payload?: any) => {
        switch (type) {
            case 'ALL':
                setFilters({ category: 'ALL', employeeId: '', universityId: '', overdueOnly: false, flaggedOnly: false, assignedUser: 'all' });
                break;
            case 'OVERDUE':
                setFilters({ ...filters, overdueOnly: true, flaggedOnly: false, assignedUser: 'all' });
                showToast('Showing overdue items', 'success');
                break;
            case 'FLAGGED':
                setFilters({ ...filters, flaggedOnly: true, overdueOnly: false, assignedUser: 'all' });
                showToast('Retrieving flagged strategic concerns...', 'success');
                break;
            case 'PERSONNEL':
                setFilters({ category: 'ALL', employeeId: '', universityId: '', overdueOnly: false, flaggedOnly: false, assignedUser: payload === 'all' ? 'all' : payload });
                if (payload !== 'all') {
                    showToast(`Showing one person`, 'success');
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
        <div className="space-y-6">
            <PageHeader
                eyebrow="Work"
                title="Milestones"
                description={isManagement ? 'MOUs, sports logos and business orders across your teams.' : 'Your MOUs, sports logos and business orders.'}
                actions={canCreate && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateModalOpen(true)}>New milestone</Button>}
            />

            <div className="space-y-8">
                {/* Metrics Dashboard */}
                {isManagement && !isLoading && milestones.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                        <MetricSummaryCard
                            label="Completion rate"
                            value={`${Math.round((stats.completed / stats.total) * 100) || 0}%`}
                            subtext={`${stats.completed} of ${stats.total} goals met`}
                            icon={TrendingUp}
                            color="blue"
                            onClick={() => handleQuickFilter('ALL')}
                        />
                        <MetricSummaryCard
                            label="Overdue"
                            value={stats.overdue}
                            subtext="Past the deadline"
                            icon={Clock}
                            color="emerald"
                            onClick={() => handleQuickFilter('OVERDUE')}
                        />
                        <MetricSummaryCard
                            label="People"
                            value={new Set(milestones.map(m => m.owner)).size}
                            subtext="Active owners"
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

                {/* Team Assessment (Directors Only) */}
                {isDirector && teamPerformance.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-1">
                            <Activity className="w-4 h-4 text-[#3B82F6]" />
                            <h2 className="text-[11px] font-semibold text-white">Team output</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {teamPerformance.map((member: any) => (
                                <div
                                    key={member.id}
                                    onClick={() => handleQuickFilter('PERSONNEL', member.id)}
                                    className="bg-[#18181B] border border-[rgba(255,255,255,0.08)] p-5 rounded-lg hover:border-[rgba(255,255,255,0.2)] transition-all group cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-[#111113] border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-semibold text-[#3B82F6] text-sm shadow-inner group-hover:scale-110 transition-transform">
                                                {member.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-white tracking-tight">{member.name}</h4>
                                                <p className="text-[11px] font-semibold text-[rgba(255,255,255,0.3)] mt-0.5">Milestone owner</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[11px] font-semibold text-white">{Math.round((member.completed / member.total) * 100) || 0}%</span>
                                            <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.2)]">Yield</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-[11px] font-semibold tracking-tighter">
                                            <span className="text-[rgba(255,255,255,0.4)]">Objectives</span>
                                            <span className="text-white">{member.completed}/{member.total}</span>
                                        </div>
                                        <div className="h-1 w-full bg-[#111113] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#3B82F6] transition-all duration-1000"
                                                style={{ width: `${(member.completed / member.total) * 100 || 0}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className={cn("w-3 h-3", member.overdue > 0 ? "text-red-500" : "text-[rgba(255,255,255,0.1)]")} />
                                                <span className={cn("text-[11px] font-semibold", member.overdue > 0 ? "text-red-400" : "text-[rgba(255,255,255,0.2)]")}>{member.overdue} Delayed</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Flag className={cn("w-3 h-3", member.flagged > 0 ? "text-orange-500" : "text-[rgba(255,255,255,0.1)]")} />
                                                <span className={cn("text-[11px] font-semibold", member.flagged > 0 ? "text-orange-400" : "text-[rgba(255,255,255,0.2)]")}>{member.flagged} Flagged</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters & Control Deck */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-[#18181B] p-4 lg:p-3 rounded-lg border border-[rgba(255,255,255,0.08)] shadow-lg sticky top-0 z-30 bg-opacity-95">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.3)] group-focus-within:text-[#3B82F6] transition-colors" />
                        <input
                            placeholder="Search by name, project or ID"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none text-sm pl-12 focus:ring-0 placeholder-[rgba(255,255,255,0.3)] text-[rgba(255,255,255,0.8)] font-semibold tracking-tight py-2 sm:py-1"
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:items-center gap-3 lg:gap-4 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-3">
                            <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.3)] lg:tracking-wider">Category:</span>
                            <select
                                value={filters.category}
                                onChange={e => setFilters({ ...filters, category: e.target.value })}
                                className="bg-[#09090B] border border-[rgba(255,255,255,0.1)] text-[11px] font-semibold text-[rgba(255,255,255,0.7)] focus:ring-1 focus:ring-[#3B82F6] cursor-pointer hover:bg-[#1F1F23] rounded-md px-2 py-1.5 transition-all outline-none h-8 lg:h-9 w-full lg:w-36"
                            >
                                <option value="ALL">All Categories</option>
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>

                        {isManagement && (
                            <div className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-3">
                                <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.3)] lg:tracking-wider">Assignee:</span>
                                <input
                                    placeholder="ID..."
                                    value={filters.employeeId}
                                    onChange={e => setFilters({ ...filters, employeeId: e.target.value })}
                                    className="bg-[#09090B] border border-[rgba(255,255,255,0.1)] text-[11px] font-semibold text-[rgba(255,255,255,0.8)] py-1.5 px-3 focus:ring-1 focus:ring-[#3B82F6] w-full lg:w-32 rounded-md outline-none h-8 lg:h-9 shadow-inner"
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
                                <div className="w-16 h-16 rounded-full border-4 border-t-[#3B82F6] border-[rgba(255,255,255,0.05)] animate-spin" />
                                <Target className="absolute inset-0 m-auto w-6 h-6 text-[#3B82F6] animate-pulse" />
                            </div>
                            <p className="text-[rgba(255,255,255,0.4)] text-[11px] font-semibold animate-pulse">Loading…</p>
                        </div>
                    ) : filteredMilestones.length === 0 ? (
                        <div className="bg-[#18181B] border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-xl py-32 flex flex-col items-center justify-center text-center px-4 sm:px-8">
                            <SearchX className="w-16 h-16 text-[rgba(255,255,255,0.1)] mb-6" />
                            <h3 className="text-xl font-semibold text-[rgba(255,255,255,0.9)] tracking-tight">Zero Objectives Found</h3>
                            <p className="text-[rgba(255,255,255,0.4)] text-sm mt-3 max-w-sm font-medium">No results match your current scope or filters. Reset parameters to re-scan the registry.</p>
                            <NotionButton
                                variant="default"
                                className="mt-8 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.08)] text-[11px] font-semibold"
                                onClick={() => handleQuickFilter('ALL')}
                            >
                                Reset Registry
                            </NotionButton>
                        </div>
                    ) : (
                        <div className="bg-[#18181B] border border-[rgba(255,255,255,0.09)] rounded-lg overflow-hidden shadow-2xl">
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[rgba(0,0,0,0.2)] border-b border-[rgba(255,255,255,0.08)]">
                                            <th className="px-5 py-4 text-[11px] font-semibold text-[rgba(255,255,255,0.3)] w-12 hidden sm:table-cell">REF</th>
                                            <th className="px-5 py-4 text-[11px] font-semibold text-[rgba(255,255,255,0.3)] min-w-[200px] sm:min-w-[300px]">Project</th>
                                            <th className="px-5 py-4 text-[11px] font-semibold text-[rgba(255,255,255,0.3)]">Status</th>
                                            <th className="px-5 py-4 text-[11px] font-semibold text-[rgba(255,255,255,0.3)] hidden md:table-cell">Priority</th>
                                            <th className="px-5 py-4 text-[11px] font-semibold text-[rgba(255,255,255,0.3)]">Deadline</th>
                                            <th className="px-5 py-4 text-[11px] font-semibold text-[rgba(255,255,255,0.3)] hidden lg:table-cell">Core Entity</th>
                                            {isManagement && <th className="px-5 py-4 text-[11px] font-semibold text-[rgba(255,255,255,0.3)] hidden md:table-cell">Owner</th>}
                                            <th className="px-5 py-4 text-[11px] font-semibold text-[rgba(255,255,255,0.3)] text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
                                        {filteredMilestones.map((m, idx) => (
                                            <tr key={m.id} className="hover:bg-[rgba(255,255,255,0.04)] transition-all duration-300 group relative">
                                                <td className="px-5 py-5 text-[11px] font-semibold font-mono text-[rgba(255,255,255,0.15)] group-hover:text-[#3B82F6] transition-colors hidden sm:table-cell">
                                                    {String(idx + 1).padStart(3, '0')}
                                                </td>
                                                <td className="px-5 py-5 cursor-pointer" onClick={() => setSelectedMilestoneForDetail(m)}>
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            {m.isFlagged && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                                                            <span className="text-[13px] font-semibold tracking-tight text-[rgba(255,255,255,0.9)] group-hover:text-[#3B82F6] transition-colors">{m.title}</span>
                                                        </div>
                                                        <span className="text-[11px] text-[rgba(255,255,255,0.4)] font-semibold line-clamp-1 max-w-[150px] sm:max-w-sm">{m.description || "Track every milestone and its progress."}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5">
                                                    <StatusBadge status={mapStatusForBadge(m.status)} size="sm" />
                                                </td>
                                                <td className="px-5 py-5 hidden md:table-cell">
                                                    <div className={cn(
                                                        "text-[11px] font-semibold px-2 py-0.5 rounded-sm   border inline-flex items-center gap-1.5 shadow-sm",
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
                                                        <div className="flex items-center gap-1.5 text-xs text-[rgba(255,255,255,0.7)] font-semibold tracking-tight">
                                                            <Clock className="w-3.5 h-3.5 text-[rgba(255,255,255,0.2)]" />
                                                            {new Date(m.targetDate).toLocaleDateString()}
                                                        </div>
                                                        {new Date(m.targetDate) < new Date() && m.status !== 'COMPLETED' && (
                                                            <span className="text-[11px] font-semibold text-red-500/80 tracking-tighter">Overdue</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5 hidden lg:table-cell">
                                                    {m.project ? (
                                                        <div className="flex items-center gap-2 group/link cursor-pointer">
                                                            <div className="p-1.5 bg-blue-500/10 rounded-md border border-blue-500/20 group-hover/link:bg-blue-500/20 transition-all">
                                                                <Briefcase className="w-3 h-3 text-[#3B82F6]" />
                                                            </div>
                                                            <span className="text-xs font-semibold text-[#3B82F6] tracking-tight group-hover/link:underline">{m.project.name}</span>
                                                        </div>
                                                    ) : m.university ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                                                                <GraduationCap className="w-3 h-3 text-emerald-400" />
                                                            </div>
                                                            <span className="text-xs font-semibold text-emerald-400 tracking-tight">{m.university.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[rgba(255,255,255,0.1)] text-[11px] font-semibold">SYSTEM</span>
                                                    )}
                                                </td>
                                                {isManagement && (
                                                    <td className="px-5 py-5 hidden md:table-cell">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded bg-[#111113] border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-semibold text-white text-[11px] shadow-inner">
                                                                {m.ownerUser?.name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-semibold text-[rgba(255,255,255,0.9)] tracking-tight truncate max-w-[120px]">{m.ownerUser?.name || "Staff"}</span>
                                                                <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.25)] tracking-tighter">Assigned Owner</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-5 py-5 text-right">
                                                    <div className="flex flex-wrap items-center justify-end gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 sm:translate-x-2 sm:group-hover:translate-x-0">
                                                        {(m.owner === userId || isManagement) && m.status !== 'COMPLETED' && (
                                                            <button
                                                                onClick={() => setMilestoneToComplete(m)}
                                                                className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-md border border-transparent hover:border-emerald-500/30 transition-all active:scale-90"
                                                                title="Complete Objective"
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {isManagement && m.status !== 'COMPLETED' && new Date(m.targetDate) < new Date() && (
                                                            <button
                                                                onClick={() => handleSendOverdueReminder(m.id)}
                                                                className="p-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-md border border-orange-500/30 transition-all active:scale-90"
                                                                title="Send Overdue Email & Push Reminder to Owner"
                                                            >
                                                                <BellRing className="w-4 h-4 animate-bounce" />
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
                                                                title="Flag for attention"
                                                            >
                                                                <Flag className={cn("w-4 h-4", m.isFlagged && "fill-current")} />
                                                            </button>
                                                        )}
                                                        <button onClick={() => setSelectedMilestoneForDetail(m)} title="Details" aria-label="Details" className="p-2 hover:bg-[rgba(255,255,255,0.05)] border border-transparent hover:border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.3)] hover:text-white rounded-md transition-all">
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
                                                    <span className="text-[13px] font-semibold text-white leading-tight">{m.title}</span>
                                                </div>
                                                <span className="text-[11px] text-[rgba(255,255,255,0.4)] font-semibold truncate">{m.description || "Milestone"}</span>
                                            </div>
                                            <StatusBadge status={mapStatusForBadge(m.status)} size="sm" />
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className={cn(
                                                "text-[11px] font-semibold px-1.5 py-0.5 rounded-sm  tracking-tighter border",
                                                m.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    m.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            )}>
                                                {m.priority}
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] font-semibold text-[rgba(255,255,255,0.5)]">
                                                <Clock className="w-3 h-3 opacity-30" />
                                                {new Date(m.targetDate).toLocaleDateString()}
                                            </div>
                                            {m.project && (
                                                <div className="text-[11px] font-semibold text-[#3B82F6] truncate max-w-[100px]">
                                                    {m.project.name}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center font-semibold text-[11px]">
                                                    {m.ownerUser?.name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.4)]">{m.ownerUser?.name || "Governance"}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {(m.owner === userId || isManagement) && m.status !== 'COMPLETED' && (
                                                    <button
                                                        onClick={() => setMilestoneToComplete(m)}
                                                        className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold rounded border border-emerald-500/20 active:scale-95 transition-all"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                                <button onClick={() => setSelectedMilestoneForDetail(m)} title="Details" aria-label="Details" className="p-1.5 text-[rgba(255,255,255,0.2)]">
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
                    onDelete={fetchMilestones}
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
                    <Modal
                        open
                        onClose={() => setSelectedMilestone(null)}
                        size="md"
                        title="Leadership remarks"
                        description={<>{selectedMilestone.title}{selectedMilestone.project ? <span className="text-zinc-500"> · {selectedMilestone.project.name}</span> : null}</>}
                        icon={<ModalIcon tone="amber"><Activity /></ModalIcon>}
                        onSubmit={handleAddRemark}
                        footer={<>
                            <Button type="button" variant="ghost" onClick={() => setSelectedMilestone(null)}>Cancel</Button>
                            <Button type="submit" isLoading={isRemarking}>Save remarks</Button>
                        </>}
                    >
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="remark-text" className="mb-1.5 block text-[13px] font-medium text-zinc-300">Remarks for the owner<span className="ml-0.5 text-rose-400">*</span></label>
                                <textarea
                                    id="remark-text"
                                    required
                                    value={remarkText}
                                    onChange={e => setRemarkText(e.target.value)}
                                    rows={6}
                                    className="w-full resize-y rounded-lg border border-[#2F2F35] bg-[#18181B] px-3 py-2.5 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500/70 focus:outline-none focus:ring-[3px] focus:ring-blue-500/15"
                                    placeholder="Instructions, context or concerns for the milestone owner"
                                />
                                <p className="mt-1.5 text-xs text-zinc-500">Shown on the milestone; the owner is notified.</p>
                            </div>
                            <label htmlFor="modal-flag-toggle" className={cn("flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors", isFlaggedChecked ? "border-rose-500/40 bg-rose-500/[0.07]" : "border-[#2F2F35] bg-[#18181B] hover:border-[#3A3A41]")}>
                                <input type="checkbox" id="modal-flag-toggle" checked={isFlaggedChecked} onChange={e => setIsFlaggedChecked(e.target.checked)} className="mt-0.5 h-4 w-4 cursor-pointer rounded accent-rose-600" />
                                <span>
                                    <span className="block text-sm font-medium text-zinc-100">Flag this milestone</span>
                                    <span className="block text-xs text-zinc-500">Marks it as needing attention on dashboards until the flag is removed.</span>
                                </span>
                            </label>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
}

function MetricSummaryCard({ label, value, subtext, icon, color, onClick }: any) {
    const tone = ({ blue: 'blue', red: 'rose', orange: 'amber', emerald: 'emerald', green: 'emerald', purple: 'violet' } as const)[color as 'blue'] || 'blue';
    return <StatCard label={label} value={value} note={subtext} icon={icon} tone={tone} onClick={onClick} />;
}
