"use client";

import React, { useState } from 'react';
import {
    X,
    Loader2,
    Briefcase,
    User as UserIcon,
    Calendar,
    Flag,
    Plus
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import Modal, { ModalIcon } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface TaskCreateModalProps {
    onClose: () => void;
    onSuccess: () => void;
    projectId: string;
    assignees: any[];
}

export default function TaskCreateModal({ onClose, onSuccess, projectId, assignees }: TaskCreateModalProps) {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'TODO',
        priority: '1',
        deadline: new Date().toISOString().split('T')[0],
        assignedToId: '',
        assignedToIds: [] as string[],
        category: 'CUSTOM'
    });
    const [isBulkMode, setIsBulkMode] = useState(false);

    const toggleAssignee = (id: string) => {
        setFormData(prev => {
            const newIds = prev.assignedToIds.includes(id)
                ? prev.assignedToIds.filter(uid => uid !== id)
                : [...prev.assignedToIds, id];
            return { ...prev, assignedToIds: newIds };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    projectId,
                    priority: parseInt(formData.priority),
                    assignedToIds: isBulkMode ? formData.assignedToIds : (formData.assignedToId ? [formData.assignedToId] : [])
                }),
            });

            if (response.ok) {
                showToast('Task added to backlog', 'success');
                onSuccess();
            } else {
                const data = await response.json();
                showToast(data.error || 'Failed to create task', 'error');
            }
        } catch (error) {
            showToast('Network error creating task', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="md"
            title="New task"
            description="Add a task to this project."
            icon={<ModalIcon><Briefcase /></ModalIcon>}
            onSubmit={handleSubmit}
            footer={<>
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" isLoading={isLoading} leftIcon={<Plus className="h-4 w-4" />}>Create task</Button>
            </>}
        >
                <div className="space-y-5">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Task Title
                        </label>
                        <input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="What needs to be done?"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-fg-muted focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="Add details and context"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-fg-muted focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none font-medium leading-relaxed"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Flag className="w-3 h-3 text-yellow-400" /> Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/10 transition-all appearance-none cursor-pointer text-sm font-medium"
                            >
                                <option value="EUSAI_AGREEMENT" className="bg-[#09090B]">EUSAI Agreement</option>
                                <option value="SPORTS_LOGO" className="bg-[#09090B]">Sports Logo Agreement</option>
                                <option value="MOU" className="bg-[#09090B]">MOU Integration</option>
                                <option value="BUSINESS_ORDER" className="bg-[#09090B]">Business Order</option>
                                <option value="CUSTOM" className="bg-[#09090B]">Custom Task</option>
                            </select>
                        </div>

                        {/* Assignee */}
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                    <UserIcon className="w-3 h-3 text-purple-400" /> Assignees
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsBulkMode(!isBulkMode)}
                                    className="text-[11px] font-semibold text-[#3B82F6] tracking-tighter hover:underline"
                                >
                                    {isBulkMode ? "Switch to Single" : "Bulk Assign"}
                                </button>
                            </div>

                            {isBulkMode ? (
                                <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 max-h-32 overflow-y-auto space-y-2 scrollbar-hide">
                                    {[
                                        ...(session?.user ? [{ id: (session.user as any).id, name: 'Assign to Me', role: 'Self' }] : []),
                                        ...assignees.filter(u => u.id !== (session?.user as any)?.id)
                                    ].map(u => (
                                        <label key={u.id} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.assignedToIds.includes(u.id)}
                                                onChange={() => toggleAssignee(u.id)}
                                                className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#3B82F6] focus:ring-0 focus:ring-offset-0 transition-all"
                                            />
                                            <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">{u.name}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div className="relative">
                                    <select
                                        value={formData.assignedToId}
                                        onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/10 transition-all appearance-none cursor-pointer text-sm font-medium"
                                    >
                                        <option value="" className="bg-[#09090B]">Select Member...</option>
                                        <option value={(session?.user as any)?.id} className="bg-[#09090B]">Assign to Me</option>
                                        {assignees.filter(u => u.id !== (session?.user as any)?.id).map(u => (
                                            <option key={u.id} value={u.id} className="bg-[#09090B]">{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Deadline */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-green-400" /> Due Date
                            </label>
                            <input
                                type="date"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/10 transition-all cursor-pointer text-sm font-medium [color-scheme:dark]"
                            />
                        </div>

                        {/* Priority Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Priority</label>
                            <div className="flex gap-2">
                                {[
                                    { val: '1', label: 'Low', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
                                    { val: '2', label: 'Med', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
                                    { val: '3', label: 'High', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
                                ].map(p => (
                                    <button
                                        key={p.val}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, priority: p.val })}
                                        className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-semibold  border transition-all ${formData.priority === p.val
                                            ? `${p.color} ring-2 ring-white/10 scale-105 shadow-lg`
                                            : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
        </Modal>
    );
}
