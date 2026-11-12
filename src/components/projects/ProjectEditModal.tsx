"use client";

import React, { useState, useEffect } from 'react';
import {
    X,
    Loader2,
    Briefcase,
    Target,
    Calendar,
    Layout,
    Plus,
    Activity,
    CheckCircle2
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import Modal, { ModalIcon } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

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
    const { showToast } = useToast();

    useEffect(() => {
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
                showToast('Milestone updated', 'success');
                onSuccess();
            } else {
                showToast('Could not update the milestone', 'error');
            }
        } catch (error) {
            showToast('Network error during sync', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="lg"
            title="Edit project"
            description={project.name}
            icon={<ModalIcon><Layout /></ModalIcon>}
            onSubmit={handleSubmit}
            footer={<>
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" isLoading={isLoading} leftIcon={<CheckCircle2 className="h-4 w-4" />}>Save changes</Button>
            </>}
        >
                <div className="space-y-6">
                    {/* Project name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Project name
                        </label>
                        <input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-fg-muted focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                        />
                    </div>

                    {/* Mission Status */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <Activity className="w-3 h-3 text-green-400" /> Status
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['PLANNING', 'EXECUTION', 'MONITORING', 'CLOSED'].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: s })}
                                    className={`px-3 py-2 text-[11px] font-semibold rounded-xl border transition-all  tracking-tighter ${formData.status === s
                                            ? 'bg-[#3B82F6] border-blue-500 text-white shadow-lg shadow-blue-900/40 scale-105'
                                            : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                                        }`}
                                >
                                    {s === 'CLOSED' ? 'COMPLETED' : s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <Target className="w-3 h-3 text-purple-400" /> Objectives
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            placeholder="What is this project about?"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-fg-muted focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none font-medium leading-relaxed"
                        />
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-blue-400" /> Start date
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/10 transition-all cursor-pointer text-sm font-medium [color-scheme:dark]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-red-400" /> Target date
                            </label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/10 transition-all cursor-pointer text-sm font-medium [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {/* Managers */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <Briefcase className="w-3 h-3 text-yellow-400" /> Project managers
                        </label>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl max-h-48 overflow-y-auto space-y-3 scrollbar-hide">
                            {isLoadingManagers ? (
                                <div className="flex items-center gap-3 py-4 justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin text-[#3B82F6]" />
                                    <span className="text-[11px] font-semibold text-zinc-400">Loading team…</span>
                                </div>
                            ) : (
                                managers.map((manager) => (
                                    <label key={manager.id} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center font-semibold text-white text-[11px] shadow-lg shadow-blue-900/20">
                                                {manager.name?.charAt(0) || 'M'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{manager.name}</span>
                                                <span className="text-[11px] font-semibold text-zinc-400">{manager.role || 'Personnel'}</span>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={formData.managerIds.includes(manager.id)}
                                            onChange={(e) => {
                                                const id = manager.id;
                                                const newIds = e.target.checked
                                                    ? [...formData.managerIds, id]
                                                    : formData.managerIds.filter((mid: string) => mid !== id);
                                                setFormData({ ...formData, managerIds: newIds });
                                            }}
                                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#3B82F6] focus:ring-0 transition-all"
                                        />
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                </div>
        </Modal>
    );
}
