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
import Modal, { ModalIcon } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

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

    if (!task) return null;

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
        if (!confirm("Delete this task? This can't be undone.")) return;

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

    const overdueNow = new Date(task.deadline) < new Date() && task.status !== 'DONE';
    const PRIORITY = task.priority === 3 ? { label: 'High priority', tone: 'rose' as const } : task.priority === 2 ? { label: 'Medium priority', tone: 'amber' as const } : { label: 'Low priority', tone: 'slate' as const };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            size="lg"
            title={task.title}
            description={<span className="inline-flex flex-wrap items-center gap-2"><StatusBadge status={mapStatusForBadge(task.status)} size="sm" /><Badge tone={PRIORITY.tone}>{PRIORITY.label}</Badge>{overdueNow && <Badge tone="rose">Overdue</Badge>}</span>}
            icon={<ModalIcon><CheckSquare /></ModalIcon>}
            footer={<>
                {canDelete && (
                    <Button variant="ghost" className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 sm:mr-auto" isLoading={isDeleting} leftIcon={<Trash2 className="h-4 w-4" />} onClick={handleDelete}>Delete task</Button>
                )}
                {isSenior && isOverdue && (
                    <Button variant="secondary" leftIcon={<BellRing className="h-4 w-4 text-amber-400" />} onClick={handleSendOverdueReminder}>Send reminder</Button>
                )}
                <Button variant="secondary" onClick={onClose}>Close</Button>
            </>}
        >
            <div className="space-y-6">
                <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[#232327] bg-[#232327] sm:grid-cols-2">
                    <div className="bg-[#111113] px-4 py-3">
                        <dt className="flex items-center gap-1.5 text-xs text-zinc-500"><Calendar className="h-3.5 w-3.5" />Due</dt>
                        <dd className={cn('mt-1 text-sm font-medium', overdueNow ? 'text-rose-400' : 'text-zinc-100')}>
                            {new Date(task.deadline).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        </dd>
                    </div>
                    <div className="bg-[#111113] px-4 py-3">
                        <dt className="flex items-center gap-1.5 text-xs text-zinc-500"><User className="h-3.5 w-3.5" />Assigned to</dt>
                        <dd className="mt-1 flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-200">{task.assignedTo?.name?.charAt(0) || '?'}</span>
                            <span className="text-sm font-medium text-zinc-100">{task.assignedTo?.name || 'Unassigned'}</span>
                            {task.assignedTo?.role && <span className="text-xs text-zinc-500">{task.assignedTo.role.replace(/_/g, ' ').toLowerCase()}</span>}
                        </dd>
                    </div>
                    <div className="bg-[#111113] px-4 py-3">
                        <dt className="flex items-center gap-1.5 text-xs text-zinc-500"><Briefcase className="h-3.5 w-3.5" />Project</dt>
                        <dd className="mt-1 text-sm font-medium text-zinc-100">{task.project?.name || 'No project'}</dd>
                    </div>
                    <div className="bg-[#111113] px-4 py-3">
                        <dt className="flex items-center gap-1.5 text-xs text-zinc-500"><Clock className="h-3.5 w-3.5" />Last updated</dt>
                        <dd className="mt-1 text-sm text-zinc-300">{new Date(task.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</dd>
                    </div>
                </dl>

                <section>
                    <h3 className="mb-2 text-xs font-medium text-zinc-500">Description</h3>
                    <p className="whitespace-pre-wrap rounded-lg border border-[#232327] bg-[#18181B] px-4 py-3 text-sm leading-relaxed text-zinc-200">
                        {task.description || <span className="text-zinc-500">No description added.</span>}
                    </p>
                </section>

                {task.comments && task.comments.length > 0 && (
                    <section>
                        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><Activity className="h-3.5 w-3.5" />Completion notes and evidence</h3>
                        <ul className="space-y-3">
                            {task.comments.map(comment => (
                                <li key={comment.id} className="rounded-lg border border-[#232327] bg-[#18181B]">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#232327] px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-200">{comment.user?.name?.charAt(0) || '?'}</span>
                                            <span className="text-sm font-medium text-zinc-100">{comment.user?.name}</span>
                                            {comment.user?.role && <span className="text-xs text-zinc-500">{comment.user.role.replace(/_/g, ' ').toLowerCase()}</span>}
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
