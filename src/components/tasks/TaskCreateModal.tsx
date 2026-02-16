"use client";

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { useParams } from 'next/navigation';

interface TaskCreateModalProps {
    onClose: () => void;
    onSuccess: () => void;
    projectId: string;
    assignees: any[];
}

export default function TaskCreateModal({ onClose, onSuccess, projectId, assignees }: TaskCreateModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'TODO',
        priority: '1',
        deadline: new Date().toISOString().split('T')[0],
        assignedToId: '',
        category: 'CUSTOM'
    });
    const { showToast } = useToast();

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
                    priority: parseInt(formData.priority)
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-sm w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between">
                    <h2 className="font-bold text-[#172B4D]">Add to Mission Backlog</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-sm">
                        <X className="w-5 h-5 text-[#6B778C]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input
                        label="Task Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="e.g., Finalize budget approval"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full h-10 px-3 bg-white border border-[#DFE1E6] rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                                required
                            >
                                <option value="EUSAI_AGREEMENT">EUSAI Agreement</option>
                                <option value="SPORTS_LOGO">Sports Logo Agreement</option>
                                <option value="MOU">MOU</option>
                                <option value="BUSINESS_ORDER">Business Order</option>
                                <option value="CUSTOM">Custom Task</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full h-10 px-3 bg-white border border-[#DFE1E6] rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            >
                                <option value="1">Low - Routine</option>
                                <option value="2">Medium - Important</option>
                                <option value="3">High - Critical</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">Assignee</label>
                            <select
                                value={formData.assignedToId}
                                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                                className="w-full h-10 px-3 bg-white border border-[#DFE1E6] rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            >
                                <option value="">Unassigned</option>
                                {assignees.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Deadline"
                            type="date"
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-3 bg-white border border-[#DFE1E6] rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            placeholder="Briefly describe the task requirements..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>Add to Backlog</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
