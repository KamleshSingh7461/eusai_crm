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
        budget: project.budget.toString(),
        startDate: project.startDate.split('T')[0],
        endDate: project.endDate.split('T')[0],
    });
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
                    budget: parseFloat(formData.budget)
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-sm w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between">
                    <h2 className="font-bold text-[#172B4D]">Edit Initiative: {project.name}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-sm">
                        <X className="w-5 h-5 text-[#6B778C]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input
                        label="Project Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full h-10 px-3 bg-white border border-[#DFE1E6] rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                        >
                            <option value="PLANNING">Planning</option>
                            <option value="EXECUTION">Execution</option>
                            <option value="MONITORING">Monitoring</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            required
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            required
                        />
                    </div>

                    <Input
                        label="Budget (INR)"
                        type="number"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        required
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#6B778C] uppercase tracking-wider">Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-3 bg-white border border-[#DFE1E6] rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>Save Changes</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
