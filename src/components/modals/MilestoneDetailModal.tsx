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
    Briefcase as WorkIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/notion';
import type { StatusType } from '@/components/notion/StatusBadge';

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
    milestone: Milestone | null;
}

export default function MilestoneDetailModal({ isOpen, onClose, milestone }: MilestoneDetailModalProps) {
    if (!isOpen || !milestone) return null;

    const mapStatusForBadge = (status: string): StatusType => {
        switch (status) {
            case 'COMPLETED': return 'done';
            case 'IN_PROGRESS': return 'in-progress';
            case 'PENDING': return 'not-started';
            case 'DELAYED': return 'under-review';
            default: return 'not-started';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div
                className="bg-[#1D2125] w-full max-w-3xl rounded-xl border border-[rgba(255,255,255,0.1)] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.7)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between bg-gradient-to-r from-[rgba(0,0,0,0.3)] to-transparent shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0052CC] to-[#0747A6] flex items-center justify-center shadow-lg">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.25em]">Strategic Objective Analysis</h3>
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
                                "text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-[0.1em] border inline-flex items-center gap-1.5 shadow-sm",
                                milestone.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    milestone.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            )}>
                                <Shield className="w-3 h-3" />
                                Sensitivity: {milestone.priority}
                            </div>
                            {milestone.isFlagged && (
                                <div className="bg-red-500/10 text-red-500 text-[9px] font-black px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                    <Flag className="w-3 h-3 fill-current" />
                                    Active Intervention Required
                                </div>
                            )}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-tight">
                            {milestone.title}
                        </h2>
                    </div>

                    {/* Meta Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 space-y-2">
                            <span className="text-[8px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] block">Category Scope</span>
                            <div className="text-[11px] font-black text-white uppercase tracking-tight">{milestone.category}</div>
                        </div>
                        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 space-y-2">
                            <span className="text-[8px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] block">MOU Protocol</span>
                            <div className="text-[11px] font-black text-blue-400 uppercase tracking-tight">{milestone.mouType || "Standard EU-SAI"}</div>
                        </div>
                        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 gap-2 flex flex-col justify-between">
                            <span className="text-[8px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] block">Operational Progress</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-white leading-none">{milestone.progress}%</span>
                                <div className="flex-1 h-1 bg-[#141414] rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${milestone.progress}%` }} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 space-y-2">
                            <span className="text-[8px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] block">Timeline Target</span>
                            <div className="text-[11px] font-black text-emerald-400 uppercase tracking-tight flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {new Date(milestone.targetDate).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-5">
                        <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                Governance Owner
                            </span>
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded bg-[#1D2125] border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-black text-white text-[10px] shadow-inner">
                                    {milestone.ownerUser?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white leading-tight">{milestone.ownerUser?.name || "Governance"}</span>
                                    <span className="text-[9px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-tight">Mission Controller</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] flex items-center gap-2">
                                <Briefcase className="w-3 h-3" />
                                Strategic Entities
                            </span>
                            <div className="flex flex-col gap-1">
                                {milestone.project && (
                                    <div className="text-sm font-bold text-[#0052CC] flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5" />
                                        Project: {milestone.project.name}
                                    </div>
                                )}
                                {milestone.university && (
                                    <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        University: {milestone.university.name}
                                    </div>
                                )}
                                {!milestone.project && !milestone.university && (
                                    <div className="text-sm font-bold text-[rgba(255,255,255,0.3)] italic">System-wide objective</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <span className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.25em] flex items-center gap-2">
                            <Activity className="w-3 h-3 text-[#0052CC]" />
                            Strategic Scope & Description
                        </span>
                        <div className="bg-[#141414] border border-[rgba(255,255,255,0.05)] rounded-xl p-6 shadow-inner">
                            <p className="text-sm sm:text-base text-[rgba(255,255,255,0.8)] leading-relaxed whitespace-pre-wrap font-medium tracking-tight">
                                {milestone.description || "Objective telemetry not provided for this mission."}
                            </p>
                        </div>
                    </div>

                    {/* Executive Remarks (if exists) */}
                    {milestone.remarks && (
                        <div className="space-y-3">
                            <span className="text-[9px] font-black text-orange-400 uppercase tracking-[0.25em] flex items-center gap-2">
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
                            <span className="text-[9px] font-black text-[#10B981] uppercase tracking-[0.25em] flex items-center gap-2">
                                <Target className="w-3 h-3" />
                                Strategic Completion Evidence
                            </span>

                            <div className="space-y-4">
                                {milestone.comments.map((comment) => (
                                    <div key={comment.id} className="bg-[#191C1F] border border-[rgba(16,185,129,0.1)] rounded-xl overflow-hidden shadow-2xl">
                                        <div className="px-4 py-3 bg-[rgba(16,185,129,0.03)] border-b border-[rgba(16,185,129,0.05)] flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-6 h-6 rounded bg-[#10B981]/10 flex items-center justify-center text-[8px] font-black text-[#10B981] border border-[#10B981]/20">
                                                    {comment.user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-[10px] font-black text-white">{comment.user?.name}</span>
                                                <span className="text-[8px] font-bold text-[rgba(255,255,255,0.2)] bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-tighter">{comment.user?.role}</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-[rgba(255,255,255,0.15)] font-mono">
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
                                                                className="flex items-center gap-3 p-3 bg-[#1D2125] border border-[rgba(255,255,255,0.05)] rounded-lg hover:bg-[#22272B] hover:border-[rgba(16,185,129,0.2)] transition-all group shadow-lg"
                                                            >
                                                                {isImage ? (
                                                                    <div className="w-12 h-12 rounded bg-black/40 flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                                                                        <img src={url} alt="Strategic Proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded bg-black/40 flex items-center justify-center shrink-0 border border-white/5 text-[#10B981]">
                                                                        <FileText className="w-6 h-6" />
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-[10px] font-black text-white tracking-tight uppercase">Strategic Asset #{idx + 1}</span>
                                                                    <span className="text-[9px] font-bold text-[#10B981] uppercase flex items-center gap-1 mt-0.5 group-hover:underline">
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
                <div className="px-8 py-6 border-t border-[rgba(255,255,255,0.08)] bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.2)] shrink-0 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-[#2f3437] hover:bg-[#3b4045] text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-[rgba(255,255,255,0.05)] active:scale-95 shadow-lg"
                    >
                        Acknowledge
                    </button>
                </div>
            </div>
        </div>
    );
}
