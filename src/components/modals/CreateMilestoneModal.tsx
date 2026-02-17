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
}

interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
    managerId?: string;
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

export default function CreateMilestoneModal({ isOpen, onClose, onSuccess, defaultProjectId }: CreateMilestoneModalProps) {
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
    }, [isOpen]);

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                if (currentUser?.role === 'DIRECTOR') {
                    setUsers(data);
                } else {
                    const juniors = data.filter((u: User) => u.managerId === currentUser?.id);
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
                setProjects(data);
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
                ownerId: ownerId || undefined,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <div className="relative bg-[#191919]/95 border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
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
                            <h2 className="text-xl font-bold text-white tracking-tight">Strategic Deliverables</h2>
                            <p className="text-xs text-gray-400 font-medium">Define high-impact milestones and objectives</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10">

                    {/* Global Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                Assign All To
                            </label>
                            {isLoadingUsers ? (
                                <div className="h-11 flex items-center text-xs text-gray-500 gap-2">
                                    <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    Synchronizing Member List...
                                </div>
                            ) : (
                                <select
                                    value={ownerId}
                                    onChange={(e) => setOwnerId(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/10 transition-all appearance-none cursor-pointer text-sm font-medium"
                                >
                                    <option value="" className="bg-[#191919]">Select Assignee...</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id} className="bg-[#191919]">
                                            {user.name || user.email} ({user.role})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                Project Context
                            </label>
                            {isLoadingProjects ? (
                                <div className="h-11 flex items-center text-xs text-gray-500 gap-2">
                                    <span className="w-4 h-4 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
                                    Fetching Projects...
                                </div>
                            ) : (
                                <select
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/10 transition-all appearance-none cursor-pointer text-sm font-medium"
                                >
                                    <option value="" className="bg-[#191919]">Link Project (Optional)</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id} className="bg-[#191919]">
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
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
                                            {index + 1}
                                        </div>
                                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Milestone Objective</h3>
                                    </div>
                                    {entries.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeEntry(entry.id)}
                                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Title</label>
                                        <input
                                            placeholder="e.g. Phase 1 Completion"
                                            value={entry.title}
                                            onChange={(e) => updateEntry(entry.id, 'title', e.target.value)}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                                        <textarea
                                            placeholder="Mission critical deliverables..."
                                            value={entry.description}
                                            onChange={(e) => updateEntry(entry.id, 'description', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none font-medium leading-relaxed min-h-[100px]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</label>
                                            <select
                                                value={entry.category}
                                                onChange={(e) => updateEntry(entry.id, 'category', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white transition-all appearance-none cursor-pointer text-sm font-medium"
                                            >
                                                {MILESTONE_CATEGORIES.map(c => (
                                                    <option key={c.value} value={c.value} className="bg-[#191919]">{c.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Date</label>
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
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MOU Type</label>
                                            <select
                                                value={entry.mouType}
                                                onChange={(e) => updateEntry(entry.id, 'mouType', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer text-sm font-medium"
                                            >
                                                <option value="" className="bg-[#191919]">Select MOU Type...</option>
                                                {MOU_TYPES.map(type => <option key={type} value={type} className="bg-[#191919]">{type}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {entry.category === 'BUSINESS_ORDER' && (
                                        <div className="grid grid-cols-2 gap-6 animate-in fade-in duration-300">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">University Name</label>
                                                <input
                                                    placeholder="Enter university..."
                                                    value={entry.universityName}
                                                    onChange={(e) => updateEntry(entry.id, 'universityName', e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Type</label>
                                                <select
                                                    value={entry.orderType}
                                                    onChange={(e) => updateEntry(entry.id, 'orderType', e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer text-sm font-medium"
                                                >
                                                    <option value="" className="bg-[#191919]">Select Order Type...</option>
                                                    {BUSINESS_ORDER_TYPES.map(type => <option key={type} value={type} className="bg-[#191919]">{type}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                                        <div className="flex items-center gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Priority</label>
                                                <div className="flex gap-2">
                                                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            onClick={() => updateEntry(entry.id, 'priority', p)}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${entry.priority === p
                                                                ? 'bg-[#0052CC] border-blue-500 text-white shadow-lg shadow-blue-900/40 scale-105'
                                                                : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
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
                                                : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                                                }`}
                                        >
                                            <Flag className={`w-4 h-4 ${entry.isFlagged ? 'fill-red-400' : ''}`} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Attention</span>
                                        </button>
                                    </div>

                                    {entry.isFlagged && (
                                        <div className="animate-in slide-in-from-top-2 duration-300">
                                            <input
                                                placeholder="Describe the critical concern..."
                                                value={entry.remarks}
                                                onChange={(e) => updateEntry(entry.id, 'remarks', e.target.value)}
                                                className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 text-red-200 placeholder:text-red-900/50 text-sm italic"
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
                        className="w-full py-6 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 group"
                    >
                        <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" />
                        Add New Objective to Workspace
                    </button>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-6 pt-8 border-t border-[rgba(255,255,255,0.06)] sticky bottom-0 bg-[#191919] pb-0 mt-8 z-10 box-content">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                        >
                            Abort Changes
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="relative group px-10 py-3 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-bold rounded-xl shadow-xl shadow-blue-900/30 disabled:opacity-50 transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
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
