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
                showToast('Mission updated successfully', 'success');
                onSuccess();
            } else {
                showToast('Failed to update mission', 'error');
            }
        } catch (error) {
            showToast('Network error during sync', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <div className="relative bg-[#191919]/95 border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Glossy background detail */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0052CC] to-[#0747A6] flex items-center justify-center shadow-lg shadow-blue-900/20">
                            <Layout className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Modify Mission Parameters</h2>
                            <p className="text-xs text-gray-400 font-medium">Update core strategic data for {project.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 p-8 space-y-8 max-h-[85vh] overflow-y-auto scrollbar-hide">
                    {/* Mission Name */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Mission Name
                        </label>
                        <input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                        />
                    </div>

                    {/* Mission Status */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-3 h-3 text-green-400" /> Mission Lifecycle Status
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['PLANNING', 'EXECUTION', 'MONITORING', 'CLOSED'].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: s })}
                                    className={`px-3 py-2 text-[10px] font-bold rounded-xl border transition-all uppercase tracking-tighter ${formData.status === s
                                            ? 'bg-[#0052CC] border-blue-500 text-white shadow-lg shadow-blue-900/40 scale-105'
                                            : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                                        }`}
                                >
                                    {s === 'CLOSED' ? 'COMPLETED' : s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Target className="w-3 h-3 text-purple-400" /> Strategic Objectives
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            placeholder="Enter detailed mission parameters and context..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none font-medium leading-relaxed"
                        />
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-blue-400" /> Mission Launch Date
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
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-red-400" /> Target Recovery Date
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

                    {/* Mission Leads */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Briefcase className="w-3 h-3 text-yellow-400" /> Designated Mission Leads
                        </label>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl max-h-48 overflow-y-auto space-y-3 scrollbar-hide">
                            {isLoadingManagers ? (
                                <div className="flex items-center gap-3 py-4 justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin text-[#0052CC]" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Scanning Personnel Registry...</span>
                                </div>
                            ) : (
                                managers.map((manager) => (
                                    <label key={manager.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0052CC] to-[#0747A6] flex items-center justify-center font-black text-white text-[10px] shadow-lg shadow-blue-900/20">
                                                {manager.name?.charAt(0) || 'M'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{manager.name}</span>
                                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{manager.role || 'Personnel'}</span>
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
                                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#0052CC] focus:ring-0 transition-all"
                                        />
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-6 pt-8 mt-4 border-t border-[rgba(255,255,255,0.06)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                        >
                            Abort Changes
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="relative group px-12 py-3 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-bold rounded-xl shadow-xl shadow-blue-900/30 disabled:opacity-50 transition-all overflow-hidden flex items-center gap-2"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4" />
                            )}
                            <span className="relative z-10">
                                {isLoading ? 'Synchronizing...' : 'Commit Mission Data'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
