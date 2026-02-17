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
    GraduationCap,
    Flag,
    MessageSquare,
    Check
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import CreateMilestoneModal from '@/components/modals/CreateMilestoneModal';

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
    isFlagged: boolean;
    remarks?: string;
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
    const [filters, setFilters] = useState({ category: 'ALL', employeeId: '', universityId: '' });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
    const [remarkText, setRemarkText] = useState('');
    const [isFlaggedChecked, setIsFlaggedChecked] = useState(false);
    const [isRemarking, setIsRemarking] = useState(false);

    const userRole = (session?.user as any)?.role || 'EMPLOYEE';
    const userId = (session?.user as any)?.id;
    const canCreate = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);

    useEffect(() => {
        fetchMilestones();
    }, [filters]);

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

    const handleUpdateStatus = async (milestoneId: string, status: string, progress: number) => {
        try {
            const res = await fetch(`/api/milestones/${milestoneId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, progress })
            });

            if (res.ok) {
                showToast(`Milestone marked as ${status.toLowerCase()}`, 'success');
                fetchMilestones();
            }
        } catch (error) {
            showToast('Failed to update milestone', 'error');
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
                showToast('Remark/Flag added successfully', 'success');
                setRemarkText('');
                setSelectedMilestone(null);
                fetchMilestones();
            }
        } catch (error) {
            showToast('Failed to add remark', 'error');
        } finally {
            setIsRemarking(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
            case 'IN_PROGRESS': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'DELAYED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getPriorityIcon = (priority: string) => {
        if (priority === 'CRITICAL') return <AlertCircle className="w-3.5 h-3.5 text-red-600" />;
        if (priority === 'HIGH') return <Target className="w-3.5 h-3.5 text-orange-500" />;
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    };

    return (
        <div className="space-y-8 p-4 md:p-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#172B4D] mb-2 flex items-center gap-3">
                        <Target className="w-8 h-8 text-[#0052CC]" />
                        Milestones
                    </h1>
                    <p className="text-[#6B778C]">Hierarchy-based tracking for MOUs, Agreements, and Business Orders.</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-[#0052CC] hover:bg-[#0747A6] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Create Milestone
                    </button>
                )}
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 border border-[#DFE1E6] rounded-xl shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-1 block">Category</label>
                    <select
                        value={filters.category}
                        onChange={e => setFilters({ ...filters, category: e.target.value })}
                        className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0052CC]/20 outline-none"
                    >
                        <option value="ALL">All Categories</option>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
                {canCreate && (
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-1 block">Assigned To (User ID)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B778C]" />
                            <input
                                placeholder="Filter by employee..."
                                value={filters.employeeId}
                                onChange={e => setFilters({ ...filters, employeeId: e.target.value })}
                                className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#0052CC]/20 outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Milestones Grid */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#0052CC]" />
                    <p className="text-[#6B778C] font-medium">Crunching milestone data...</p>
                </div>
            ) : milestones.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-[#DFE1E6] rounded-2xl py-20 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-[#172B4D]">No Milestones Found</h3>
                    <p className="text-[#6B778C] mt-2 max-w-xs mx-auto">Try adjusting your filters or create a new target for the team.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {milestones.map((m) => (
                        <div key={m.id} className={`group relative bg-white border ${m.isFlagged ? 'border-red-200 shadow-red-100' : 'border-[#DFE1E6]'} rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col`}>
                            {/* Flag Indicator */}
                            {m.isFlagged && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg flex items-center gap-1 z-10 animate-pulse">
                                    <Flag className="w-3 h-3 fill-white" /> FLAGGED
                                </div>
                            )}

                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(m.status)}`}>
                                        {m.status.replace('_', ' ')}
                                    </span>
                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                                        {getPriorityIcon(m.priority)}
                                        <span className="text-[10px] font-bold text-[#6B778C]">{m.priority}</span>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-[#172B4D] mb-1 line-clamp-1" title={m.title}>{m.title}</h3>
                                <p className="text-sm text-[#5E6C84] line-clamp-2 h-10 mb-4">{m.description || 'Deliverables and next steps...'}</p>

                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 text-xs font-medium text-[#6B778C]">
                                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                                            <Calendar className="w-3 h-3" />
                                        </div>
                                        Target: {new Date(m.targetDate).toLocaleDateString()}
                                    </div>
                                    {m.category === 'MOU' && m.mouType && (
                                        <div className="flex items-center gap-2 text-xs font-medium text-[#0052CC] bg-blue-500/10 px-2 py-1 rounded-lg">
                                            <GraduationCap className="w-3.5 h-3.5" />
                                            {m.mouType}
                                        </div>
                                    )}
                                    {m.project && (
                                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                                            <Briefcase className="w-3.5 h-3.5" />
                                            {m.project.name}
                                        </div>
                                    )}
                                </div>

                                {m.remarks && (
                                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100 italic text-[11px] text-amber-900 flex gap-2">
                                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                                        "{m.remarks}"
                                    </div>
                                )}
                            </div>

                            {/* Progress Footer */}
                            <div className="px-5 pb-5 shrink-0">
                                <div className="w-full bg-[#EBECF0] h-1.5 rounded-full overflow-hidden mb-2">
                                    <div
                                        className={`h-full transition-all duration-700 ${m.status === 'COMPLETED' ? 'bg-green-500' : 'bg-[#0052CC]'}`}
                                        style={{ width: `${m.progress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider">Progress</span>
                                    <span className="text-xs font-bold text-[#172B4D]">{m.progress}%</span>
                                </div>

                                {/* Actions */}
                                <div className="mt-4 flex gap-2">
                                    {m.owner === userId && m.status !== 'COMPLETED' && (
                                        <button
                                            onClick={() => handleUpdateStatus(m.id, 'COMPLETED', 100)}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-green-600/20"
                                        >
                                            <Check className="w-3.5 h-3.5" /> Mark Completed
                                        </button>
                                    )}
                                    {canCreate && (
                                        <button
                                            onClick={() => {
                                                setSelectedMilestone(m);
                                                setRemarkText(m.remarks || '');
                                                setIsFlaggedChecked(m.isFlagged);
                                            }}
                                            className="px-3 bg-slate-100 hover:bg-slate-200 text-[#172B4D] text-xs font-bold py-2 rounded-lg transition-all"
                                            title="Add Remark/Flag"
                                        >
                                            <Flag className={`w-3.5 h-3.5 ${m.isFlagged ? 'fill-red-500 text-red-500' : ''}`} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal Component */}
            <CreateMilestoneModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchMilestones}
            />

            {/* Remark/Flag Modal */}
            {selectedMilestone && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-[#DFE1E6] flex items-center justify-between bg-red-50">
                            <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                                <Flag className="w-5 h-5 fill-red-600 text-red-600" />
                                Add Remark / Flag
                            </h3>
                            <button onClick={() => setSelectedMilestone(null)} className="text-red-900/60 hover:text-red-900 h-8 w-8 flex items-center justify-center hover:bg-red-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddRemark} className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">Enter a remark or reason for flagging the milestone: <span className="font-bold text-slate-900">"{selectedMilestone.title}"</span></p>
                            <textarea
                                required
                                autoFocus
                                value={remarkText}
                                onChange={e => setRemarkText(e.target.value)}
                                className="w-full bg-slate-50 border border-[#DFE1E6] rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-200 outline-none min-h-[120px]"
                                placeholder="e.g. Missing deliverables, needs urgent review..."
                            />

                            <div className="flex items-center gap-3 p-3 bg-red-50/50 rounded-lg border border-red-100">
                                <input
                                    type="checkbox"
                                    id="modal-flag-toggle"
                                    checked={isFlaggedChecked}
                                    onChange={e => setIsFlaggedChecked(e.target.checked)}
                                    className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                />
                                <label htmlFor="modal-flag-toggle" className="text-sm font-bold text-red-900 cursor-pointer flex items-center gap-2">
                                    <Flag className="w-4 h-4 fill-red-600" />
                                    Flag for Attention
                                </label>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setSelectedMilestone(null)}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRemarking}
                                    className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                                >
                                    {isRemarking ? 'Adding...' : 'Post Flag/Remark'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
