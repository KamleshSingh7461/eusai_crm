"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { X } from 'lucide-react';

interface CreateMilestoneModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
}

export default function CreateMilestoneModal({ isOpen, onClose, onSuccess }: CreateMilestoneModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('CUSTOM');
    const [targetDate, setTargetDate] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [ownerId, setOwnerId] = useState('');
    const [projectId, setProjectId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // Fetch users when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/milestones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    category,
                    targetDate: new Date(targetDate).toISOString(),
                    priority,
                    ownerId: ownerId || undefined,
                    projectId: projectId || undefined,
                })
            });

            if (response.ok) {
                // Reset form
                setTitle('');
                setDescription('');
                setCategory('CUSTOM');
                setTargetDate('');
                setPriority('MEDIUM');
                setOwnerId('');
                setProjectId('');
                onSuccess();
                onClose();
            } else {
                alert('Failed to create milestone');
            }
        } catch (error) {
            console.error('Failed to create milestone:', error);
            alert('Failed to create milestone');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#DFE1E6]">
                    <h2 className="text-xl font-bold text-[#172B4D]">Create New Milestone</h2>
                    <button
                        onClick={onClose}
                        className="text-[#6B778C] hover:text-[#172B4D] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input
                        label="Milestone Title *"
                        placeholder="e.g., Complete EUSAI Logo Design"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <div>
                        <label className="block text-sm font-bold text-[#172B4D] mb-2">
                            Description
                        </label>
                        <textarea
                            className="w-full px-4 py-3 border border-[#DFE1E6] rounded-lg focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all text-[#172B4D]"
                            rows={3}
                            placeholder="Describe the milestone..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Category *"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            options={[
                                { value: 'EUSAI_LOGO', label: 'EUSAI Logo' },
                                { value: 'MOU', label: 'MOU' },
                                { value: 'BUSINESS_ORDER', label: 'Business/Order' },
                                { value: 'CUSTOM', label: 'Custom' }
                            ]}
                            required
                        />

                        <Select
                            label="Priority *"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            options={[
                                { value: 'LOW', label: 'Low' },
                                { value: 'MEDIUM', label: 'Medium' },
                                { value: 'HIGH', label: 'High' },
                                { value: 'CRITICAL', label: 'Critical' }
                            ]}
                            required
                        />
                    </div>

                    <Input
                        type="date"
                        label="Target Date *"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        required
                    />

                    {isLoadingUsers ? (
                        <div className="text-sm text-[#6B778C]">Loading employees...</div>
                    ) : (
                        <Select
                            label="Assign to Employee"
                            value={ownerId}
                            onChange={(e) => setOwnerId(e.target.value)}
                            options={[
                                { value: '', label: 'Unassigned' },
                                ...users.map(user => ({
                                    value: user.id,
                                    label: `${user.name || user.email} (${user.role})`
                                }))
                            ]}
                            helperText="Select an employee to assign this milestone"
                        />
                    )}

                    <Input
                        label="Link to Project (Project ID)"
                        placeholder="Enter project ID (optional)"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        helperText="Leave empty if not linked to a project"
                    />

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmitting}
                        >
                            Create Milestone
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
