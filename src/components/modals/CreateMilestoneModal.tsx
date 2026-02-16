"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { X, Flag } from 'lucide-react';
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

    const currentUser = session?.user as any;

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#DFE1E6] bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-[#172B4D]">Strategic Deliverables</h2>
                        <p className="text-xs text-[#6B778C] mt-1">Assign multiple milestones for this team member</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-[#6B778C] hover:text-[#172B4D] hover:bg-slate-200 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Global Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        {isLoadingUsers ? (
                            <div className="text-sm text-[#6B778C] flex items-center gap-2">
                                <span className="animate-spin text-blue-600">🌀</span> Loading available juniors...
                            </div>
                        ) : (
                            <Select
                                label="Assign All To *"
                                value={ownerId}
                                onChange={(e) => setOwnerId(e.target.value)}
                                required
                                options={[
                                    { value: '', label: 'Select Assignee...' },
                                    ...users.map(user => ({
                                        value: user.id,
                                        label: `${user.name || user.email} (${user.role})`
                                    }))
                                ]}
                            />
                        )}

                        <Input
                            label="Link Project (Optional)"
                            placeholder="Enter project ID"
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                        />
                    </div>

                    <div className="h-px bg-[#DFE1E6]" />

                    {/* Milestone List */}
                    <div className="space-y-12">
                        {entries.map((entry, index) => (
                            <div key={entry.id} className="relative space-y-6 pt-4">
                                {entries.length > 1 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest italic">Milestone #{index + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeEntry(entry.id)}
                                            className="text-xs text-red-500 hover:text-red-700 font-bold"
                                        >
                                            Remove Entry
                                        </button>
                                    </div>
                                )}

                                <Input
                                    label="Milestone Title *"
                                    placeholder="e.g. Sign MOU with University X"
                                    value={entry.title}
                                    onChange={(e) => updateEntry(entry.id, 'title', e.target.value)}
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-bold text-[#172B4D] mb-1.5 font-['Outfit']">
                                        Description
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-3 border border-[#DFE1E6] rounded-lg focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all text-[#172B4D] min-h-[80px] text-sm"
                                        placeholder="Add details about deliverables..."
                                        value={entry.description}
                                        onChange={(e) => updateEntry(entry.id, 'description', e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Select
                                        label="Category *"
                                        value={entry.category}
                                        onChange={(e) => updateEntry(entry.id, 'category', e.target.value)}
                                        options={MILESTONE_CATEGORIES}
                                        required
                                    />

                                    {entry.category === 'MOU' && (
                                        <Select
                                            label="MOU Type *"
                                            value={entry.mouType}
                                            onChange={(e) => updateEntry(entry.id, 'mouType', e.target.value)}
                                            options={MOU_TYPES.map(type => ({ value: type, label: type }))}
                                            required
                                        />
                                    )}

                                    {entry.category === 'BUSINESS_ORDER' && (
                                        <>
                                            <Input
                                                label="University Name *"
                                                placeholder="Enter university"
                                                value={entry.universityName}
                                                onChange={(e) => updateEntry(entry.id, 'universityName', e.target.value)}
                                                required
                                            />
                                            <Select
                                                label="Order Type *"
                                                value={entry.orderType}
                                                onChange={(e) => updateEntry(entry.id, 'orderType', e.target.value)}
                                                options={BUSINESS_ORDER_TYPES.map(type => ({ value: type, label: type }))}
                                                required
                                            />
                                        </>
                                    )}

                                    <Select
                                        label="Priority *"
                                        value={entry.priority}
                                        onChange={(e) => updateEntry(entry.id, 'priority', e.target.value)}
                                        options={[
                                            { value: 'LOW', label: 'Low' },
                                            { value: 'MEDIUM', label: 'Medium' },
                                            { value: 'HIGH', label: 'High' },
                                            { value: 'CRITICAL', label: 'Critical' }
                                        ]}
                                        required
                                    />

                                    <Input
                                        type="date"
                                        label="Target Date *"
                                        value={entry.targetDate}
                                        onChange={(e) => updateEntry(entry.id, 'targetDate', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                                        <input
                                            type="checkbox"
                                            checked={entry.isFlagged}
                                            onChange={(e) => updateEntry(entry.id, 'isFlagged', e.target.checked)}
                                            className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-[#0052CC]"
                                        />
                                        <Flag className={entry.isFlagged ? "w-4 h-4 text-red-500 fill-red-500" : "w-4 h-4 text-gray-400"} />
                                        <span className="text-sm font-bold text-amber-900">Attention Needed</span>
                                    </label>
                                    <Input
                                        placeholder="Flag reason..."
                                        value={entry.remarks}
                                        onChange={(e) => updateEntry(entry.id, 'remarks', e.target.value)}
                                        disabled={!entry.isFlagged}
                                    />
                                </div>
                                {index < entries.length - 1 && <div className="h-px bg-slate-100" />}
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addEntry}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-[#0052CC] hover:bg-blue-50 hover:border-blue-300 transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                    >
                        <span className="text-lg group-hover:scale-125 transition-transform">+</span> Add Another Milestone for this Employee
                    </button>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-[#DFE1E6] sticky bottom-0 bg-white pb-2 z-10">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="bg-slate-100 hover:bg-slate-200 border-none px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmitting}
                            className="bg-[#0052CC] hover:bg-[#0747A6] px-8 shadow-lg shadow-blue-600/20"
                        >
                            {entries.length > 1 ? `Create ${entries.length} Milestones` : 'Create Milestone'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
