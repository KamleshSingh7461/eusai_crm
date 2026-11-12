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
import Modal, { ModalIcon } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

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

    if (!milestone) return null;

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
        if (!confirm("Delete this milestone? This can't be undone.")) return;

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

    const PRIORITY_TONE: Record<string, 'rose' | 'amber' | 'blue' | 'slate'> = { CRITICAL: 'rose', HIGH: 'amber', MEDIUM: 'blue', LOW: 'slate' };
    const humanText = (v?: string) => (v || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            size="lg"
            title={milestone.title}
            description={<span className="inline-flex flex-wrap items-center gap-2">
                <StatusBadge status={mapStatusForBadge(milestone.status)} size="sm" />
                <Badge tone={PRIORITY_TONE[milestone.priority] || 'slate'}>{humanText(milestone.priority)} priority</Badge>
                {isOverdue && <Badge tone="rose">Overdue</Badge>}
                {milestone.isFlagged && <Badge tone="rose" icon={<Flag />}>Flagged</Badge>}
            </span>}
            icon={<ModalIcon tone="violet"><Target /></ModalIcon>}
            footer={<>
                {canDelete && (
                    <Button variant="ghost" className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 sm:mr-auto" isLoading={isDeleting} leftIcon={<Trash2 className="h-4 w-4" />} onClick={handleDelete}>Delete milestone</Button>
                )}
                {isSenior && isOverdue && (
                    <Button variant="secondary" leftIcon={<BellRing className="h-4 w-4 text-amber-400" />} onClick={handleSendOverdueReminder}>Send reminder</Button>
                )}
                <Button variant="secondary" onClick={onClose}>Close</Button>
            </>}
        >
            <div className="space-y-6">
                <div className="rounded-lg border border-[#232327] bg-[#18181B] px-4 py-3">
                    <div className="flex items-center justify-between text-xs text-zinc-500"><span>Progress</span><span className="text-sm font-semibold tabular-nums text-white">{milestone.progress}%</span></div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-blue-500" style={{ width: `${milestone.progress}%` }} /></div>
                </div>

                <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[#232327] bg-[#232327] sm:grid-cols-2">
                    <div className="bg-[#111113] px-4 py-3">
                        <dt className="flex items-center gap-1.5 text-xs text-zinc-500"><Calendar className="h-3.5 w-3.5" />Target date</dt>
                        <dd className={cn('mt-1 text-sm font-medium', isOverdue ? 'text-rose-400' : 'text-zinc-100')}>{new Date(milestone.targetDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</dd>
                    </div>
                    <div className="bg-[#111113] px-4 py-3">
                        <dt className="flex items-center gap-1.5 text-xs text-zinc-500"><Shield className="h-3.5 w-3.5" />Owner</dt>
                        <dd className="mt-1 flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-200">{milestone.ownerUser?.name?.charAt(0) || '?'}</span>
                            <span className="text-sm font-medium text-zinc-100">{milestone.ownerUser?.name || 'Unassigned'}</span>
                        </dd>
                    </div>
                    <div className="bg-[#111113] px-4 py-3">
                        <dt className="flex items-center gap-1.5 text-xs text-zinc-500"><Activity className="h-3.5 w-3.5" />Category</dt>
                        <dd className="mt-1 text-sm font-medium text-zinc-100">{humanText(milestone.category)}{milestone.mouType ? ` · ${milestone.mouType}` : ''}</dd>
                    </div>
                    <div className="bg-[#111113] px-4 py-3">
                        <dt className="flex items-center gap-1.5 text-xs text-zinc-500"><Briefcase className="h-3.5 w-3.5" />Linked to</dt>
                        <dd className="mt-1 space-y-0.5 text-sm font-medium text-zinc-100">
                            {milestone.project && <p className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-zinc-500" />{milestone.project.name}</p>}
                            {milestone.university && <p className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5 text-zinc-500" />{milestone.university.name}</p>}
                            {!milestone.project && !milestone.university && <p className="text-zinc-500">Not linked to a project or university</p>}
                        </dd>
                    </div>
                </dl>

                <section>
                    <h3 className="mb-2 text-xs font-medium text-zinc-500">Description</h3>
                    <p className="whitespace-pre-wrap rounded-lg border border-[#232327] bg-[#18181B] px-4 py-3 text-sm leading-relaxed text-zinc-200">
                        {milestone.description || <span className="text-zinc-500">No description added.</span>}
                    </p>
                </section>

                {milestone.remarks && (
                    <section>
                        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-400"><Flag className="h-3.5 w-3.5" />Leadership remarks</h3>
                        <p className="whitespace-pre-wrap rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm leading-relaxed text-amber-100/90">{milestone.remarks}</p>
                    </section>
                )}

                {milestone.comments && milestone.comments.length > 0 && (
                    <section>
                        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><Target className="h-3.5 w-3.5" />Completion notes and evidence</h3>
                        <ul className="space-y-3">
                            {milestone.comments.map(comment => (
                                <li key={comment.id} className="rounded-lg border border-[#232327] bg-[#18181B]">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#232327] px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-200">{comment.user?.name?.charAt(0) || '?'}</span>
                                            <span className="text-sm font-medium text-zinc-100">{comment.user?.name}</span>
                                            {comment.user?.role && <span className="text-xs text-zinc-500">{humanText(comment.user.role)}</span>}
                                        </div>
                                        <span className="text-xs text-zinc-500">{new Date(comment.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="space-y-3 px-4 py-3">
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{comment.text}</p>
                                        {Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                {comment.attachments.map((url: string, idx: number) => {
                                                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                                    return (
                                                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-3 rounded-lg border border-[#2F2F35] bg-[#111113] p-2.5 transition-colors hover:bg-[#1F1F23]">
                                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-800 text-zinc-300">
                                                                {isImage ? <img src={url} alt="" className="h-full w-full object-cover" /> : <FileText className="h-4 w-4" />}
                                                            </span>
                                                            <span className="min-w-0">
                                                                <span className="block truncate text-sm text-zinc-100">Attachment {idx + 1}</span>
                                                                <span className="flex items-center gap-1 text-xs text-zinc-500">Open <ExternalLink className="h-3 w-3" /></span>
                                                            </span>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </Modal>
    );
}
