"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { X, Plus, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

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

interface MilestoneRow {
    id: string;
    title: string;
    description: string;
    category: string;
    mouType: string;
    universityName: string;
    priority: string;
    targetDate: string;
    assignedTo: string;
    projectId: string;
}

const CATEGORIES = [
    { value: 'EUSAI_MAIN_AGREEMENT', label: 'EUSAI Main Agreement' },
    { value: 'MOU', label: 'MOU' },
    { value: 'BUSINESS_ORDER', label: 'Business/Order' },
    { value: 'UNIVERSITY_SPORTS_LOGO', label: 'University Sports Logo' }
];

const MOU_TYPES = [
    { value: 'MERCHANDISE_STORE_MOU', label: 'Merchandise Store MOU' },
    { value: 'SCHOOL_SPIRIT_MOU', label: 'School Spirit Agreement/MOU' },
    { value: 'FGSN_STUDIO_MOU', label: 'FGSN Studio Agreement/MOU' },
    { value: 'OUTGOING_PROGRAM_MOU', label: 'Outgoing Program MOU' },
    { value: 'SCHOLARSHIP_TRANSFER_LETTER', label: 'Scholarship Transfer Letter' },
    { value: 'ALUMNI_ESTABLISHMENT_MOU', label: 'Alumni Establishment MOU' },
    { value: 'SCHOLARSHIP_VALUATION_LETTER', label: 'Scholarship Valuation Letter' }
];

const BUSINESS_ORDER_TYPES = [
    { value: 'OUTGOING_PROGRAM', label: 'Outgoing Program' },
    { value: 'SCHOOL_SPIRIT', label: 'School Spirit' },
    { value: 'MERCHANDISE_JERSEY', label: 'Merchandise Jersey' }
];

export default function CreateMilestoneModal({ isOpen, onClose, onSuccess }: CreateMilestoneModalProps) {
    const { data: session } = useSession();
    const [milestones, setMilestones] = useState<MilestoneRow[]>([createEmptyRow()]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    function createEmptyRow(): MilestoneRow {
        return {
            id: Math.random().toString(36).substr(2, 9),
            title: '',
            description: '',
            category: 'MOU',
            mouType: '',
            universityName: '',
            priority: 'MEDIUM',
            targetDate: '',
            assignedTo: '',
            projectId: ''
        };
    }

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
                // Filter users based on hierarchy: Directors/Managers shouldn't see themselves as assignees
                const currentUserId = (session?.user as any)?.id;
                const currentUserRole = (session?.user as any)?.role;

                let filteredUsers = data;
                if (currentUserRole === 'DIRECTOR' || currentUserRole === 'MANAGER') {
                    filteredUsers = data.filter((u: any) => u.id !== currentUserId);
                }

                setUsers(filteredUsers);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const addRow = () => {
        setMilestones([...milestones, createEmptyRow()]);
    };

    const removeRow = (id: string) => {
        if (milestones.length > 1) {
            setMilestones(milestones.filter(m => m.id !== id));
        }
    };

    const updateRow = (id: string, field: keyof MilestoneRow, value: any) => {
        setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/milestones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(milestones.map(m => ({
                    ...m,
                    targetDate: new Date(m.targetDate).toISOString()
                })))
            });

            if (response.ok) {
                setMilestones([createEmptyRow()]);
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#DFE1E6]">
                    <div>
                        <h2 className="text-xl font-bold text-[#172B4D]">Batch Create Milestones</h2>
                        <p className="text-sm text-[#6B778C]">Set university-related goals for your team members.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#6B778C] hover:text-[#172B4D] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {milestones.map((milestone, index) => (
                            <div key={milestone.id} className="p-4 border border-[#DFE1E6] rounded-lg relative bg-gray-50/30">
                                {milestones.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeRow(milestone.id)}
                                        className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input
                                        label="Milestone Title *"
                                        placeholder="e.g., Sign MOU with University X"
                                        value={milestone.title}
                                        onChange={(e) => updateRow(milestone.id, 'title', e.target.value)}
                                        required
                                    />

                                    <Select
                                        label="Category *"
                                        value={milestone.category}
                                        onChange={(e) => updateRow(milestone.id, 'category', e.target.value)}
                                        options={CATEGORIES}
                                        required
                                    />

                                    {milestone.category === 'MOU' ? (
                                        <Select
                                            label="MOU Type *"
                                            value={milestone.mouType}
                                            onChange={(e) => updateRow(milestone.id, 'mouType', e.target.value)}
                                            options={MOU_TYPES}
                                            required
                                        />
                                    ) : milestone.category === 'BUSINESS_ORDER' ? (
                                        <Select
                                            label="Order Type *"
                                            value={milestone.mouType}
                                            onChange={(e) => updateRow(milestone.id, 'mouType', e.target.value)}
                                            options={BUSINESS_ORDER_TYPES}
                                            required
                                        />
                                    ) : (
                                        <div className="hidden md:block"></div>
                                    )}

                                    <Input
                                        label="University Name *"
                                        placeholder="Enter university name"
                                        value={milestone.universityName}
                                        onChange={(e) => updateRow(milestone.id, 'universityName', e.target.value)}
                                        required
                                    />

                                    <Input
                                        type="date"
                                        label="Target Date *"
                                        value={milestone.targetDate}
                                        onChange={(e) => updateRow(milestone.id, 'targetDate', e.target.value)}
                                        required
                                    />

                                    <Select
                                        label="Priority *"
                                        value={milestone.priority}
                                        onChange={(e) => updateRow(milestone.id, 'priority', e.target.value)}
                                        options={[
                                            { value: 'LOW', label: 'Low' },
                                            { value: 'MEDIUM', label: 'Medium' },
                                            { value: 'HIGH', label: 'High' },
                                            { value: 'CRITICAL', label: 'Critical' }
                                        ]}
                                        required
                                    />

                                    <Select
                                        label="Assign to Employee"
                                        value={milestone.assignedTo}
                                        onChange={(e) => updateRow(milestone.id, 'assignedTo', e.target.value)}
                                        options={[
                                            { value: '', label: 'Me (Self)' },
                                            ...users.map(user => ({
                                                value: user.id,
                                                label: `${user.name || user.email} (${user.role})`
                                            }))
                                        ]}
                                        helperText="Select the employee responsible for this deliverable."
                                    />

                                    <Input
                                        label="Link Project *"
                                        placeholder="Enter project ID"
                                        value={milestone.projectId}
                                        onChange={(e) => updateRow(milestone.id, 'projectId', e.target.value)}
                                        required
                                    />

                                    <div className="md:col-span-3">
                                        <label className="block text-sm font-bold text-[#172B4D] mb-1">Description</label>
                                        <textarea
                                            className="w-full px-3 py-2 border border-[#DFE1E6] rounded-md text-sm"
                                            rows={2}
                                            placeholder="Add details about deliverables..."
                                            value={milestone.description}
                                            onChange={(e) => updateRow(milestone.id, 'description', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addRow}
                        className="mt-4 flex items-center gap-2 text-[#0052CC] font-bold text-sm hover:underline"
                    >
                        <Plus className="w-4 h-4" />
                        Add Another Milestone
                    </button>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-8 border-t border-[#DFE1E6] mt-6">
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
                            Create {milestones.length} Milestone{milestones.length > 1 ? 's' : ''}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
