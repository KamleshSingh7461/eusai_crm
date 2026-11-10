"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { X, Flag, Briefcase, Plus, Trash2, Layout, Calendar, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface CreateMilestoneModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultProjectId?: string;
    defaultSpaceId?: string;
}

interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
    reportingManagers?: { id: string }[];
}

const MILESTONE_CATEGORIES = [
    { value: 'EUSAI_AGREEMENT', label: 'EUSAI Agreement' },
    { value: 'SPORTS_LOGO', label: 'Sports Logo Agreement' },
    { value: 'MOU', label: "MOU's" },
    { value: 'BUSINESS_ORDER', label: 'Business Order' },
    { value: 'CUSTOM', label: 'Custom' }
];

const MOU_TYPES = [
    "Merchandise Store MOU",
    "School Spirit Agreement/MOU",
    "FGSN Studio Agreement/MOU",
    "Outgoing Program MOU",
    "Scholarship Transfer Letter",
    "Alumni Establishment MOU",
    "Scholarship Valuation Letter"
];

const BUSINESS_ORDER_TYPES = [
    "School Spirit",
    "Outgoing Packages",
    "Merchandise Jersey"
];

export default function CreateMilestoneModal({ isOpen, onClose, onSuccess, defaultProjectId, defaultSpaceId }: CreateMilestoneModalProps) {
    const { data: session } = useSession();
    const [entries, setEntries] = useState([{
        id: crypto.randomUUID(),
        title: '',
        description: '',
        category: 'CUSTOM',
        mouType: '',
        universityName: '',
        orderType: '',
        targetDate: '',
        priority: 'MEDIUM',
        isFlagged: false,
        remarks: ''
    }]);
    const [ownerId, setOwnerId] = useState('');
    const [ownerIds, setOwnerIds] = useState<string[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [projectId, setProjectId] = useState(defaultProjectId || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);

    const currentUser = session?.user as any;

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            fetchProjects();
        }
    }, [isOpen, defaultSpaceId]);

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                const activeUsers = (data || []).filter((u: any) => !u.isSuspended);
                if (currentUser?.role === 'DIRECTOR') {
                    setUsers(activeUsers);
                } else {
                    const juniors = activeUsers.filter((u: any) => u.reportingManagers?.some((m: any) => m.id === currentUser?.id));
                    setUsers(juniors);
                }
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const fetchProjects = async () => {
        setIsLoadingProjects(true);
        try {
            const response = await fetch('/api/projects');
            if (response.ok) {
                const data = await response.json();
                if (defaultSpaceId) {
                    const spaceProjects = data.filter((p: any) => p.spaceId === defaultSpaceId);
                    setProjects(spaceProjects);
                    if (spaceProjects.length > 0 && !projectId) {
                        setProjectId(spaceProjects[0].id);
                    }
                } else {
                    setProjects(data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setIsLoadingProjects(false);
        }
    };

    const addEntry = () => {
        setEntries([...entries, {
            id: crypto.randomUUID(),
            title: '',
            description: '',
            category: 'CUSTOM',
            mouType: '',
            universityName: '',
            orderType: '',
            targetDate: entries[entries.length - 1].targetDate, // Carry over date for convenience
            priority: 'MEDIUM',
            isFlagged: false,
            remarks: ''
        }]);
    };

    const removeEntry = (id: string) => {
        if (entries.length > 1) {
            setEntries(entries.filter(e => e.id !== id));
        }
    };

    const updateEntry = (id: string, field: string, value: any) => {
        setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const submissionData = entries.map(entry => ({
                ...entry,
                targetDate: new Date(entry.targetDate).toISOString(),
                ownerId: isBulkMode ? undefined : (ownerId || undefined),
                ownerIds: isBulkMode ? ownerIds : undefined,
                projectId: projectId || undefined,
                mouType: entry.category === 'MOU' ? entry.mouType : undefined,
                universityName: entry.category === 'BUSINESS_ORDER' ? entry.universityName : undefined,
                orderType: entry.category === 'BUSINESS_ORDER' ? entry.orderType : undefined,
                remarks: entry.remarks || undefined
            }));

            const response = await fetch('/api/milestones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData)
            });

            if (response.ok) {
                setEntries([{
                    id: crypto.randomUUID(),
                    title: '',
                    description: '',
                    category: 'CUSTOM',
                    mouType: '',
                    universityName: '',
                    orderType: '',
                    targetDate: '',
                    priority: 'MEDIUM',
                    isFlagged: false,
                    remarks: ''
                }]);
                setOwnerId('');
                setOwnerIds([]);
                setIsBulkMode(false);
                setProjectId('');
                onSuccess();
                onClose();
            } else {
                alert('Failed to create milestones');
            }
        } catch (error) {
            console.error('Failed to create milestones:', error);
            alert('Failed to create milestones');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-black/70 animate-in fade-in duration-200">
            <div className="bg-[#111113] border border-white/[0.08] rounded-2xl relative w-full rounded-b-none sm:rounded-b-3xl max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                {/* Glossy background detail */}

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-6 border-b border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#3B82F6] flex items-center justify-center shadow-lg shadow-blue-900/20">
                            <Layout className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-display text-lg font-semibold text-white">New milestone</h2>
                            <p className="text-xs text-zinc-400 font-medium">Define high-impact milestones and objectives</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto p-5 sm:p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10">

                    {/* Global Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                    Assign All To
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsBulkMode(!isBulkMode)}
                                    className="text-[11px] font-semibold text-[#3B82F6] tracking-tighter hover:underline"
                                >
                                    {isBulkMode ? "Single Mode" : "Bulk Assign"}
                                </button>
                            </div>

                            {isLoadingUsers ? (
                                <div className="h-11 flex items-center text-xs text-zinc-400 gap-2">
                                    <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    Synchronizing...
                                </div>
                            ) : isBulkMode ? (
                                <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 max-h-32 overflow-y-auto space-y-2 scrollbar-hide">
                                    {[
                                        ...(session?.user ? [{ id: (session.user as any).id, name: 'Assign to Me', role: 'Self' }] : []),
                                        ...users.filter(u => u.id !== (session?.user as any)?.id)
                                    ].map(u => (
                                        <label key={u.id} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={ownerIds.includes(u.id)}
                                                onChange={() => setOwnerIds(prev => prev.includes(u.id) ? prev.filter(i => i !== u.id) : [...prev, u.id])}
                                                className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#3B82F6] focus:ring-0 transition-all"
                                            />
                                            <span className="text-xs font-medium text-gray-300 group-hover:text-white">{u.name || (u as any).email}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <select
                                    value={ownerId}
                                    onChange={(e) => setOwnerId(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/10 transition-all appearance-none cursor-pointer text-sm font-medium"
                                >
                                    <option value="" className="bg-[#09090B]">Select Assignee...</option>
                                    <option value={(session?.user as any)?.id} className="bg-[#09090B]">Assign to Me</option>
                                    {users.filter(u => u.id !== (session?.user as any)?.id).map(user => (
                                        <option key={user.id} value={user.id} className="bg-[#09090B]">
                                            {user.name || (user as any).email} ({user.role})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                Project Context
                            </label>
                            {isLoadingProjects ? (
                                <div className="h-11 flex items-center text-xs text-zinc-400 gap-2">
                                    <span className="w-4 h-4 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
                                    Fetching Projects...
                                </div>
                            ) : (
                                <select
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/10 transition-all appearance-none cursor-pointer text-sm font-medium"
                                >
                                    <option value="" className="bg-[#09090B]">Link Project (Optional)</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id} className="bg-[#09090B]">
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Milestone Entries */}
                    <div className="space-y-12">
                        {entries.map((entry, index) => (
                            <div key={entry.id} className="relative p-6 bg-white/5 border border-white/10 rounded-2xl group animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[11px] font-semibold text-white border border-white/10">
                                            {index + 1}
                                        </div>
                                        <h3 className="text-xs font-semibold text-white">Milestone Objective</h3>
                                    </div>
                                    {entries.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeEntry(entry.id)}
                                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Title</label>
                                        <input
                                            placeholder="e.g. Phase 1 Completion"
                                            value={entry.title}
                                            onChange={(e) => updateEntry(entry.id, 'title', e.target.value)}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-fg-muted focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Description</label>
                                        <textarea
                                            placeholder="What needs to be delivered"
                                            value={entry.description}
                                            onChange={(e) => updateEntry(entry.id, 'description', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-fg-muted focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none font-medium leading-relaxed min-h-[100px]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">Category</label>
                                            <select
                                                value={entry.category}
                                                onChange={(e) => updateEntry(entry.id, 'category', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white transition-all appearance-none cursor-pointer text-sm font-medium"
                                            >
                                                {MILESTONE_CATEGORIES.map(c => (
                                                    <option key={c.value} value={c.value} className="bg-[#09090B]">{c.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">Target Date</label>
                                            <input
                                                type="date"
                                                value={entry.targetDate}
                                                onChange={(e) => updateEntry(entry.id, 'targetDate', e.target.value)}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white transition-all cursor-pointer text-sm font-medium [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>

                                    {/* Sub-selectors */}
                                    {entry.category === 'MOU' && (
                                        <div className="space-y-2 animate-in fade-in duration-300">
                                            <label className="text-sm font-medium text-zinc-300">MOU Type</label>
                                            <select
                                                value={entry.mouType}
                                                onChange={(e) => updateEntry(entry.id, 'mouType', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer text-sm font-medium"
                                            >
                                                <option value="" className="bg-[#09090B]">Select MOU Type...</option>
                                                {MOU_TYPES.map(type => <option key={type} value={type} className="bg-[#09090B]">{type}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {entry.category === 'BUSINESS_ORDER' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-300">University Name</label>
                                                <input
                                                    placeholder="Enter university..."
                                                    value={entry.universityName}
                                                    onChange={(e) => updateEntry(entry.id, 'universityName', e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-300">Order Type</label>
                                                <select
                                                    value={entry.orderType}
                                                    onChange={(e) => updateEntry(entry.id, 'orderType', e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer text-sm font-medium"
                                                >
                                                    <option value="" className="bg-[#09090B]">Select Order Type...</option>
                                                    {BUSINESS_ORDER_TYPES.map(type => <option key={type} value={type} className="bg-[#09090B]">{type}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white/5 border border-white/5 rounded-xl">
                                        <div className="flex items-center gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-300 block mb-2">Priority</label>
                                                <div className="flex gap-2">
                                                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            onClick={() => updateEntry(entry.id, 'priority', p)}
                                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold  transition-all border ${entry.priority === p
                                                                ? 'bg-[#1F1F23] border-blue-500 text-white shadow-lg shadow-blue-900/40 scale-105'
                                                                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                                                                }`}
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => updateEntry(entry.id, 'isFlagged', !entry.isFlagged)}
                                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${entry.isFlagged
                                                ? 'bg-red-500/20 border-red-500/30 text-red-400 shadow-lg shadow-red-900/20'
                                                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                                                }`}
                                        >
                                            <Flag className={`w-4 h-4 ${entry.isFlagged ? 'fill-red-400' : ''}`} />
                                            <span className="text-[11px] font-semibold">Attention</span>
                                        </button>
                                    </div>

                                    {entry.isFlagged && (
                                        <div className="animate-in slide-in-from-top-2 duration-300">
                                            <input
                                                placeholder="Describe the critical concern..."
                                                value={entry.remarks}
                                                onChange={(e) => updateEntry(entry.id, 'remarks', e.target.value)}
                                                className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 text-red-200 placeholder:text-red-300/50 text-sm italic"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addEntry}
                        className="w-full py-6 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-semibold text-xs flex items-center justify-center gap-3 group"
                    >
                        <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" />
                        Add New Objective to Workspace
                    </button>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-6 pt-8 border-t border-[rgba(255,255,255,0.06)] sticky bottom-0 bg-[#09090B] pb-0 mt-8 z-10 box-content">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="relative group px-5 sm:px-10 py-3 bg-[#1F1F23] hover:bg-[#1F1F23] text-white text-xs font-semibold rounded-xl shadow-xl shadow-blue-900/30 disabled:opacity-50 transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            <span className="relative z-10">
                                {isSubmitting ? 'Synchronizing...' : (entries.length > 1 ? `Execute ${entries.length} Deployments` : 'Initialize Milestone')}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
