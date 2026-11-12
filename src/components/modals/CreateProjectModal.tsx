"use client";

import React, { useState, useEffect } from 'react';
import { X, Briefcase, Calendar, DollarSign, User as UserIcon, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal, { ModalIcon } from '@/components/ui/Modal';

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
                setUsers((data.users || []).filter((u: any) => !u.isSuspended));
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

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            size="md"
            title="New project"
            description={<>In the <span className="font-medium text-zinc-200">{spaceName}</span> department</>}
            icon={<ModalIcon><Briefcase /></ModalIcon>}
            onSubmit={handleSubmit}
            footer={<>
                <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Create project</Button>
            </>}
        >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--notion-text-tertiary)] mb-1">
                            Project name *
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. University Outreach Q3"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm text-xs text-[var(--notion-text-primary)] focus:outline-none focus:border-[#3B82F6]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--notion-text-tertiary)] mb-1">
                            Description
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Key goals, scope, and target outcomes..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm text-xs text-[var(--notion-text-primary)] focus:outline-none focus:border-[#3B82F6]"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--notion-text-tertiary)] mb-1">
                                Start date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm text-xs text-[var(--notion-text-primary)] focus:outline-none focus:border-[#3B82F6]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--notion-text-tertiary)] mb-1">
                                End date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm text-xs text-[var(--notion-text-primary)] focus:outline-none focus:border-[#3B82F6]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--notion-text-tertiary)] mb-1">
                                Budget (INR)
                            </label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm text-xs text-[var(--notion-text-primary)] focus:outline-none focus:border-[#3B82F6]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--notion-text-tertiary)] mb-1">
                                Project lead
                            </label>
                            <select
                                value={managerId}
                                onChange={(e) => setManagerId(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm text-xs text-[var(--notion-text-primary)] focus:outline-none focus:border-[#3B82F6]"
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

                </div>
        </Modal>
    );
}
