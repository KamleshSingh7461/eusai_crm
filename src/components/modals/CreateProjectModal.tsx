"use client";

import React, { useState, useEffect } from 'react';
import { X, Briefcase, Calendar, DollarSign, User as UserIcon, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
}

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    spaceId: string;
    spaceName: string;
    onSuccess: () => void;
}

export default function CreateProjectModal({
    isOpen,
    onClose,
    spaceId,
    spaceName,
    onSuccess
}: CreateProjectModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [managerId, setManagerId] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const res = await fetch('/api/team');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    budget: parseFloat(budget) || 0,
                    startDate,
                    endDate,
                    spaceId,
                    managerId: managerId || undefined
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
                setName('');
                setDescription('');
                setBudget('');
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create operation/project');
            }
        } catch (error) {
            console.error('Project creation failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-md shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="p-5 border-b border-[var(--notion-border-default)] flex items-center justify-between bg-[var(--notion-bg-primary)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-sm bg-[#2383e2]/15 flex items-center justify-center text-[#2383e2]">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-[var(--notion-text-primary)]">New Operation (Project)</h2>
                            <p className="text-xs text-[var(--notion-text-tertiary)]">Initialize a project under space <span className="font-semibold text-[#2383e2]">{spaceName}</span></p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-[var(--notion-text-tertiary)] hover:text-[var(--notion-text-primary)] hover:bg-[var(--notion-bg-tertiary)] rounded-sm transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-[var(--notion-text-tertiary)] tracking-wider mb-1">
                            Operation Name *
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. University Outreach Q3"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm text-xs text-[var(--notion-text-primary)] focus:outline-none focus:border-[#2383e2]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-[var(--notion-text-tertiary)] tracking-wider mb-1">
                            Description / Mission Brief
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Key goals, scope, and target outcomes..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm text-xs text-[var(--notion-text-primary)] focus:outline-none focus:border-[#2383e2]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-[var(--notion-text-tertiary)] tracking-wider mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm text-xs text-[var(--notion-text-primary)] focus:outline-none focus:border-[#2383e2]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-[var(--notion-text-tertiary)] tracking-wider mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm text-xs text-[var(--notion-text-primary)] focus:outline-none focus:border-[#2383e2]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-[var(--notion-text-tertiary)] tracking-wider mb-1">
                                Budget (INR)
                            </label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm text-xs text-[var(--notion-text-primary)] focus:outline-none focus:border-[#2383e2]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-[var(--notion-text-tertiary)] tracking-wider mb-1">
                                Project Lead / Manager
                            </label>
                            <select
                                value={managerId}
                                onChange={(e) => setManagerId(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm text-xs text-[var(--notion-text-primary)] focus:outline-none focus:border-[#2383e2]"
                            >
                                <option value="">Select Manager / Lead...</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name || u.email} ({u.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--notion-border-default)] flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#2383e2] hover:bg-[#1a6fcc] text-white"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                                </span>
                            ) : 'Initialize Operation'}
                        </Button>
                    </div>
                </form>

            </div>
        </div>
    );
}
