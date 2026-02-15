"use client";

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';

interface MilestoneCreateModalProps {
    onClose: () => void;
    onSuccess: () => void;
    projectId: string;
}

export default function MilestoneCreateModal({ onClose, onSuccess, projectId }: MilestoneCreateModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        targetDate: '',
        status: 'PENDING'
    });
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/milestones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    projectId
                }),
            });

            if (response.ok) {
                showToast('Milestone added to roadmap', 'success');
                onSuccess();
            } else {
                showToast('Failed to create milestone', 'error');
            }
        } catch (error) {
            showToast('Network error creating milestone', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-sm w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between">
                    <h2 className="font-bold text-[#172B4D]">Add Strategic Milestone</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-sm">
                        <X className="w-5 h-5 text-[#6B778C]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input
                        label="Milestone Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="e.g., Phase 1 Completion"
                    />

                    <Input
                        label="Target Date"
                        type="date"
                        value={formData.targetDate}
                        onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                        required
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-3 bg-white border border-[#DFE1E6] rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            placeholder="Describe the deliverables for this milestone..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>Add to Roadmap</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
