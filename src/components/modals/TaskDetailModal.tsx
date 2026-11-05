"use client";

import React from 'react';
import {
    X,
    Calendar,
    Clock,
    Target,
    Briefcase,
    User,
    AlertCircle,
    CheckSquare,
    Activity,
    FileText,
    Image as ImageIcon,
    ExternalLink,
    Trash2,
    Loader2,
    BellRing
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/notion';
import type { StatusType } from '@/components/notion/StatusBadge';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';

interface Task {
    id: string;
    title: string;
    description: string;
    deadline: string;
    status: string;
    priority: number;
    userId?: string;
    project?: { id: string; name: string };
    assignedTo?: { id: string; name: string; role: string; email: string };
    updatedAt: string;
    comments?: Array<{
        id: string;
        text: string;
        attachments: any;
        timestamp: string;
        user: { name: string; role: string };
    }>;
}

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDelete?: () => void;
    task: Task | null;
}

export default function TaskDetailModal({ isOpen, onClose, onDelete, task }: TaskDetailModalProps) {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [isDeleting, setIsDeleting] = React.useState(false);

    if (!isOpen || !task) return null;

    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;
    const canDelete = userRole === 'DIRECTOR' || userRole === 'MANAGER' || task.userId === userId;

    const mapStatusForBadge = (status: string): StatusType => {
        switch (status) {
            case 'DONE': return 'done';
            case 'IN_PROGRESS': return 'in-progress';
            case 'REVIEW': return 'under-review';
            case 'TODO': return 'not-started';
            default: return 'not-started';
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to decommission this strategic objective? This action is irreversible.')) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/tasks?id=${task.id}`, { method: 'DELETE' });
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
    const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'DONE';

    const handleSendOverdueReminder = async () => {
        try {
            const res = await fetch('/api/notifications/overdue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entityType: 'TASK', entityId: task.id })
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-[#0F131B] border border-white/[0.08] rounded-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] w-full rounded-b-none sm:rounded-b-3xl max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between bg-gradient-to-r from-[rgba(0,0,0,0.3)] to-transparent shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg">
                            <CheckSquare className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-display text-base font-bold text-white">Task details</h3>
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
                            <StatusBadge status={mapStatusForBadge(task.status)} size="sm" />
                            <div className={cn(
                                "text-[11px] font-bold px-2 py-0.5 rounded-sm border inline-flex items-center gap-1.5 shadow-sm",
                                task.priority === 3 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    task.priority === 2 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            )}>
                                <Activity className="w-3 h-3" />
                                {task.priority === 3 ? 'Priority: High' : task.priority === 2 ? 'Priority: Medium' : 'Priority: Low'}
                            </div>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tighter leading-tight">
                            {task.title}
                        </h2>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-5">
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                Deadline Protocol
                            </span>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                                {new Date(task.deadline).toLocaleDateString(undefined, {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                                {new Date(task.deadline) < new Date() && task.status !== 'DONE' && (
                                    <span className="text-[11px] bg-red-500 text-white px-2 py-0.5 rounded font-bold uppercase tracking-tighter shadow-lg shadow-red-900/20">Overdue</span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] flex items-center gap-2">
                                <User className="w-3 h-3" />
                                Mission Assignee
                            </span>
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded bg-[#0D1016] border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-bold text-white text-[11px] shadow-inner">
                                    {task.assignedTo?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white leading-tight">{task.assignedTo?.name || "Unassigned"}</span>
                                    <span className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-tight">{task.assignedTo?.role || "Personnel"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] flex items-center gap-2">
                                <Briefcase className="w-3 h-3" />
                                Strategic Project
                            </span>
                            <div className="text-sm font-bold text-[#3B82F6] flex items-center gap-2">
                                {task.project?.name || "General Operations"}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Last Intelligence Sync
                            </span>
                            <div className="text-sm font-bold text-[rgba(255,255,255,0.5)]">
                                {new Date(task.updatedAt).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <span className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] flex items-center gap-2">
                            <Target className="w-3 h-3 text-[#3B82F6]" />
                            Operational Briefing
                        </span>
                        <div className="bg-[#141414] border border-[rgba(255,255,255,0.05)] rounded-xl p-6 shadow-inner text-sm text-[rgba(255,255,255,0.85)] leading-relaxed whitespace-pre-wrap font-medium tracking-tight">
                            {task.description || "No description yet."}
                        </div>
                    </div>

                    {/* Mission Evidence ... */}
                    {task.comments && task.comments.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                            <span className="text-[11px] font-bold text-[#10B981] flex items-center gap-2">
                                <Activity className="w-3 h-3" />
                                Mission Evidence & Audit Trail
                            </span>

                            <div className="space-y-4">
                                {task.comments.map((comment) => (
                                    <div key={comment.id} className="bg-[#0D1016] border border-[rgba(16,185,129,0.1)] rounded-xl overflow-hidden shadow-xl">
                                        <div className="px-4 py-3 bg-[rgba(16,185,129,0.05)] border-b border-[rgba(16,185,129,0.05)] flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-[#07090D] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[11px] font-bold text-white">
                                                    {comment.user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-[11px] font-bold text-white">{comment.user?.name}</span>
                                                <span className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] px-1.5 py-0.5 bg-black/20 rounded">{comment.user?.role}</span>
                                            </div>
                                            <span className="text-[11px] font-bold text-[rgba(255,255,255,0.2)]">
                                                {new Date(comment.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <p className="text-sm text-[rgba(255,255,255,0.7)] leading-relaxed italic">
                                                "{comment.text}"
                                            </p>

                                            {/* Attachments Display */}
                                            {comment.attachments && Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                                                    {comment.attachments.map((url: string, idx: number) => {
                                                        const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                                                        return (
                                                            <a
                                                                key={idx}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-3 p-3 bg-black/20 border border-[rgba(255,255,255,0.05)] rounded-lg hover:bg-black/40 transition-all group"
                                                            >
                                                                {isImage ? (
                                                                    <div className="w-10 h-10 rounded bg-[#07090D] flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                                                                        <img src={url} alt="Proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded bg-[#07090D] flex items-center justify-center shrink-0 border border-white/5 text-[#10B981]">
                                                                        <FileText className="w-5 h-5" />
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-[11px] font-bold text-white truncate">Evidence Ledger #{idx + 1}</span>
                                                                    <span className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase flex items-center gap-1">
                                                                        View Documentation <ExternalLink className="w-2 h-2" />
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
                <div className="px-4 sm:px-8 py-6 border-t border-[rgba(255,255,255,0.08)] bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.2)] shrink-0 flex items-center justify-between">
                    <div className="flex gap-3">
                        {isSenior && isOverdue && (
                            <button
                                onClick={handleSendOverdueReminder}
                                className="flex items-center gap-2 px-5 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-[11px] font-bold uppercase tracking-[0.15em] transition-all border border-orange-500/30 active:scale-95 shadow-md"
                            >
                                <BellRing className="w-4 h-4 animate-pulse" />
                                Send Overdue Reminder (Email & Push)
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[11px] font-bold transition-all border border-red-500/20 active:scale-95 disabled:opacity-50"
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
                        className="px-4 sm:px-8 py-2.5 bg-[#131720] hover:bg-[#1A1F2A] text-white rounded-lg text-[11px] font-bold transition-all border border-[rgba(255,255,255,0.05)] active:scale-95 shadow-lg"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}
