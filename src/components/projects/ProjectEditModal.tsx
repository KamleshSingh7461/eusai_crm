"use client";

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';

interface ProjectEditModalProps {
    project: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ProjectEditModal({ project, onClose, onSuccess }: ProjectEditModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: project.name,
        description: project.description || '',
        status: project.status,
        managerIds: project.managers?.map((m: any) => m.id) || [],
        startDate: project.startDate.split('T')[0],
        endDate: project.endDate.split('T')[0],
    });
    const [managers, setManagers] = useState<any[]>([]);
    const [isLoadingManagers, setIsLoadingManagers] = useState(true);

    React.useEffect(() => {
        const fetchManagers = async () => {
            try {
                const response = await fetch('/api/users/managers');
                if (response.ok) {
                    const data = await response.json();
                    setManagers(data);
                }
            } catch (error) {
                console.error("Failed to load managers", error);
            } finally {
                setIsLoadingManagers(false);
            }
        };
        fetchManagers();
    }, []);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/api/projects/${project.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,

                }),
            });

            if (response.ok) {
                showToast('Project updated successfully', 'success');
                onSuccess();
            } else {
                showToast('Failed to update project', 'error');
            }
        } catch (error) {
            showToast('Network error during update', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] w-full max-w-2xl rounded-sm shadow-xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-[var(--notion-border-default)]">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--notion-text-primary)]">Edit Mission Details</h2>
                        <p className="text-xs text-[var(--notion-text-tertiary)] mt-1">Update core parameters for {project.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--notion-bg-tertiary)] rounded-sm text-[var(--notion-text-tertiary)] hover:text-[var(--notion-text-primary)] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <Input
                        label="Mission Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-[var(--notion-bg-tertiary)] border-[var(--notion-border-default)] text-[var(--notion-text-primary)]"
                    />

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider">Mission Status</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['PLANNING', 'EXECUTION', 'MONITORING', 'CLOSED'].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: s })}
                                    className={`px-3 py-2 text-xs font-bold rounded-sm border transition-all ${formData.status === s
                                        ? 'bg-[#2383e2]/20 border-[#2383e2] text-[#2383e2]'
                                        : 'bg-[var(--notion-bg-tertiary)] border-[var(--notion-border-default)] text-[var(--notion-text-tertiary)] hover:text-[var(--notion-text-primary)]'
                                        }`}
                                >
                                    {s === 'CLOSED' ? 'COMPLETED' : s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider">Strategic Objectives</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] rounded-sm py-2 px-3 min-h-[100px] text-sm focus:outline-none focus:ring-1 focus:ring-[#2383e2] transition-colors text-[var(--notion-text-primary)] placeholder-[var(--notion-text-disabled)] resize-none"
                            placeholder="Enter mission description..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            required
                            className="bg-[var(--notion-bg-tertiary)] border-[var(--notion-border-default)] text-[var(--notion-text-primary)]"
                        />
                        <Input
                            label="Target Date"
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            required
                            className="bg-[var(--notion-bg-tertiary)] border-[var(--notion-border-default)] text-[var(--notion-text-primary)]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider">Mission Leads</label>
                        <div className="p-3 bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] rounded-sm max-h-40 overflow-y-auto space-y-2">
                            {isLoadingManagers ? (
                                <div className="flex items-center gap-2 text-[10px] text-body italic">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Loading available leads...
                                </div>
                            ) : (
                                managers.map((manager) => (
                                    <label key={manager.id} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--notion-bg-hover)] p-1 rounded-sm transition-colors group">
                                        <input
                                            type="checkbox"
                                            checked={formData.managerIds.includes(manager.id)}
                                            onChange={(e) => {
                                                const id = manager.id;
                                                const newIds = e.target.checked
                                                    ? [...formData.managerIds, id]
                                                    : formData.managerIds.filter(mid => mid !== id);
                                                setFormData({ ...formData, managerIds: newIds });
                                            }}
                                            className="rounded-sm border-[var(--notion-border-default)] text-[#2383e2] focus:ring-[#2383e2]"
                                        />
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-[var(--notion-bg-secondary)] flex items-center justify-center text-[8px] font-bold border border-[var(--notion-border-default)]">
                                                {manager.name?.charAt(0) || 'M'}
                                            </div>
                                            <span className="text-xs text-[var(--notion-text-primary)] font-medium">{manager.name}</span>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--notion-border-default)]">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="bg-[var(--notion-bg-tertiary)] text-[var(--notion-text-primary)] hover:bg-[var(--notion-bg-hover)] border-0"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={isLoading}
                            className="bg-[#2383e2] hover:bg-[#1a6fcc] text-white shadow-sm"
                        >
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
