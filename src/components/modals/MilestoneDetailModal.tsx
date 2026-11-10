"use client";

import React from 'react';
import {
    X,
    Calendar,
    Clock,
    Target,
    Briefcase,
    User,
    Flag,
    GraduationCap,
    Activity,
    Shield,
    FileText,
    ExternalLink,
    Briefcase as WorkIcon,
    Trash2,
    Loader2,
    BellRing
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/notion';
import type { StatusType } from '@/components/notion/StatusBadge';
import { useSession } from 'next-auth/react';
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
    ownerUser?: { name: string };
    project?: { id: string; name: string };
    university?: { id: string; name: string };
    mouType?: string;
    isFlagged: boolean;
    remarks?: string;
    updatedAt: string;
    comments?: Array<{
        id: string;
        text: string;
        attachments: any;
        timestamp: string;
        user: { name: string; role: string };
    }>;
}

interface MilestoneDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDelete?: () => void;
    milestone: Milestone | null;
}

export default function MilestoneDetailModal({ isOpen, onClose, onDelete, milestone }: MilestoneDetailModalProps) {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [isDeleting, setIsDeleting] = React.useState(false);

    if (!isOpen || !milestone) return null;

    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;
    const canDelete = userRole === 'DIRECTOR' || userRole === 'MANAGER' || milestone.owner === userId;

    const mapStatusForBadge = (status: string): StatusType => {
        switch (status) {
            case 'COMPLETED': return 'done';
            case 'IN_PROGRESS': return 'in-progress';
            case 'PENDING': return 'not-started';
            case 'DELAYED': return 'under-review';
            default: return 'not-started';
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to decommission this strategic objective? This action is irreversible.')) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/milestones?id=${milestone.id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Deleted', 'success');
                if (onDelete) onDelete();
                onClose();
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to delete objective', 'error');
            }
        } catch (error) {
            showToast('Network error during deletion', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const isSenior = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);
    const isOverdue = new Date(milestone.targetDate) < new Date() && milestone.status !== 'COMPLETED';

    const handleSendOverdueReminder = async () => {
        try {
            const res = await fetch('/api/notifications/overdue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entityType: 'MILESTONE', entityId: milestone.id })
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

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 bg-black/70 animate-in fade-in duration-200">
            <div
                className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full rounded-b-none sm:rounded-b-3xl max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center shadow-lg">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-display text-base font-semibold text-white">Milestone analysis</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[rgba(255,255,255,0.3)] hover:text-white transition-colors p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
                    {/* Title and Status */}
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <StatusBadge status={mapStatusForBadge(milestone.status)} size="sm" />
                            <div className={cn(
                                "text-[11px] font-semibold px-2 py-0.5 rounded-sm border inline-flex items-center gap-1.5 shadow-sm",
                                milestone.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    milestone.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            )}>
                                <Shield className="w-3 h-3" />
                                Sensitivity: {milestone.priority}
                            </div>
                            {milestone.isFlagged && (
                                <div className="bg-red-500/10 text-red-500 text-[11px] font-semibold px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1.5 animate-pulse">
                                    <Flag className="w-3 h-3 fill-current" />
                                    Active Intervention Required
                                </div>
                            )}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tighter leading-tight">
                            {milestone.title}
                        </h2>
                    </div>

                    {/* Meta Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 space-y-2">
                            <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.3)] block">Category Scope</span>
                            <div className="text-[11px] font-semibold text-white tracking-tight">{milestone.category}</div>
                        </div>
                        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 space-y-2">
                            <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.3)] block">MOU</span>
                            <div className="text-[11px] font-semibold text-blue-400 tracking-tight">{milestone.mouType || "Standard EU-SAI"}</div>
                        </div>
                        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 gap-2 flex flex-col justify-between">
                            <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.3)] block">Progress</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-semibold text-white leading-none">{milestone.progress}%</span>
                                <div className="flex-1 h-1 bg-[#18181B] rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${milestone.progress}%` }} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 space-y-2">
                            <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.3)] block">Timeline Target</span>
                            <div className="text-[11px] font-semibold text-emerald-400 tracking-tight flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {new Date(milestone.targetDate).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-5">
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.3)] flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                Governance Owner
                            </span>
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded bg-[#111113] border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-semibold text-white text-[11px] shadow-inner">
                                    {milestone.ownerUser?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-white leading-tight">{milestone.ownerUser?.name || "Unassigned"}</span>
                                    <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.3)] tracking-tight">Owner</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.3)] flex items-center gap-2">
                                <Briefcase className="w-3 h-3" />
                                Strategic Entities
                            </span>
                            <div className="flex flex-col gap-1">
                                {milestone.project && (
                                    <div className="text-sm font-semibold text-[#3B82F6] flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5" />
                                        Project: {milestone.project.name}
                                    </div>
                                )}
                                {milestone.university && (
                                    <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        University: {milestone.university.name}
                                    </div>
                                )}
                                {!milestone.project && !milestone.university && (
                                    <div className="text-sm font-semibold text-[rgba(255,255,255,0.3)] italic">System-wide objective</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.3)] flex items-center gap-2">
                            <Activity className="w-3 h-3 text-[#3B82F6]" />
                            Strategic Scope & Description
                        </span>
                        <div className="bg-[#18181B] border border-[rgba(255,255,255,0.05)] rounded-xl p-6 shadow-inner">
                            <p className="text-sm sm:text-base text-[rgba(255,255,255,0.8)] leading-relaxed whitespace-pre-wrap font-medium tracking-tight">
                                {milestone.description || "Objective telemetry not provided for this mission."}
                            </p>
                        </div>
                    </div>

                    {/* Executive Remarks (if exists) */}
                    {milestone.remarks && (
                        <div className="space-y-3">
                            <span className="text-[11px] font-semibold text-orange-400 flex items-center gap-2">
                                <Flag className="w-3 h-3" />
                                Executive Management Remarks
                            </span>
                            <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-6 shadow-inner">
                                <p className="text-sm italic text-orange-200/80 leading-relaxed font-medium tracking-tight">
                                    "{milestone.remarks}"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Mission Evidence & Strategic Ledger (Comments) */}
                    {milestone.comments && milestone.comments.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                            <span className="text-[11px] font-semibold text-[#10B981] flex items-center gap-2">
                                <Target className="w-3 h-3" />
                                Strategic Completion Evidence
                            </span>

                            <div className="space-y-4">
                                {milestone.comments.map((comment) => (
                                    <div key={comment.id} className="bg-[#1F1F23] border border-[rgba(16,185,129,0.1)] rounded-xl overflow-hidden shadow-2xl">
                                        <div className="px-4 py-3 bg-[rgba(16,185,129,0.03)] border-b border-[rgba(16,185,129,0.05)] flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-6 h-6 rounded bg-[#111113] flex items-center justify-center text-[11px] font-semibold text-[#10B981] border border-[#10B981]/20">
                                                    {comment.user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-[11px] font-semibold text-white">{comment.user?.name}</span>
                                                <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.2)] bg-white/5 px-1.5 py-0.5 rounded tracking-tighter">{comment.user?.role}</span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.15)] font-mono">
                                                {new Date(comment.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            <p className="text-sm text-[rgba(255,255,255,0.75)] leading-relaxed italic border-l-2 border-[#10B981]/20 pl-4 py-1 bg-white/[0.01]">
                                                "{comment.text}"
                                            </p>

                                            {/* Attachments Display */}
                                            {comment.attachments && Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                                    {comment.attachments.map((url: string, idx: number) => {
                                                        const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                                                        return (
                                                            <a
                                                                key={idx}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-3 p-3 bg-[#111113] border border-[rgba(255,255,255,0.05)] rounded-lg hover:bg-[#1F1F23] hover:border-[rgba(16,185,129,0.2)] transition-all group shadow-lg"
                                                            >
                                                                {isImage ? (
                                                                    <div className="w-12 h-12 rounded bg-black/40 flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                                                                        <img src={url} alt="Proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded bg-black/40 flex items-center justify-center shrink-0 border border-white/5 text-[#10B981]">
                                                                        <FileText className="w-6 h-6" />
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-[11px] font-semibold text-white tracking-tight">Resource #{idx + 1}</span>
                                                                    <span className="text-[11px] font-semibold text-[#10B981] flex items-center gap-1 mt-0.5 group-hover:underline">
                                                                        Inspect Payload <ExternalLink className="w-2 h-2" />
                                                                    </span>
                                                                </div>
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-8 py-6 border-t border-[rgba(255,255,255,0.08)] bg-transparent shrink-0 flex items-center justify-between">
                    <div className="flex gap-3">
                        {isSenior && isOverdue && (
                            <button
                                onClick={handleSendOverdueReminder}
                                className="flex items-center gap-2 px-5 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-[11px] font-semibold transition-all border border-orange-500/30 active:scale-95 shadow-md"
                            >
                                <BellRing className="w-4 h-4 animate-pulse" />
                                Send Overdue Reminder (Email & Push)
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[11px] font-semibold transition-all border border-red-500/20 active:scale-95 disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                )}
                                Decommission
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 sm:px-8 py-2.5 bg-[#18181B] hover:bg-[#1F1F23] text-white rounded-lg text-[11px] font-semibold transition-all border border-[rgba(255,255,255,0.05)] active:scale-95 shadow-lg"
                    >
                        Acknowledge
                    </button>
                </div>
            </div>
        </div>
    );
}
