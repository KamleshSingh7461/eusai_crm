"use client";

import React, { useState, useEffect } from 'react';
import { X, Search, Check, Users, UserPlus, Shield, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal, { ModalIcon } from '@/components/ui/Modal';

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    department?: string | null;
    image?: string | null;
}

interface ManageSpaceMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    spaceId: string;
    spaceName: string;
    currentMembers: User[];
    onSuccess: () => void;
}

export default function ManageSpaceMembersModal({
    isOpen,
    onClose,
    spaceId,
    spaceName,
    currentMembers,
    onSuccess
}: ManageSpaceMembersModalProps) {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedMemberIds(currentMembers.map(m => m.id));
            fetchAllUsers();
        }
    }, [isOpen, currentMembers]);

    const fetchAllUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/team');
            if (res.ok) {
                const data = await res.json();
                const usersList = (data.users || []).filter((u: any) => !u.isSuspended);
                setAllUsers(usersList);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMember = (userId: string) => {
        setSelectedMemberIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/spaces/${spaceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberIds: selectedMemberIds })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to update members');
            }
        } catch (error) {
            console.error('Error updating space members:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = allUsers.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            size="md"
            title="Department members"
            description={<>Add or remove people in <span className="font-medium text-zinc-200">{spaceName}</span></>}
            icon={<ModalIcon><UserPlus /></ModalIcon>}
            bodyClassName="p-0 sm:p-0"
            footer={<>
                <p className="text-xs text-zinc-500 sm:mr-auto max-sm:basis-full max-sm:flex-none"><span className="font-semibold text-zinc-200">{selectedMemberIds.length}</span> selected</p>
                <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleSave} isLoading={isSaving}>Save members</Button>
            </>}
        >
                {/* Search Input */}
                <div className="p-4 border-b border-[var(--notion-border-default)] bg-[var(--notion-bg-primary)]">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--notion-text-tertiary)]" />
                        <input
                            type="text"
                            placeholder="Search employees by name, email, or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-xs text-[var(--notion-text-primary)] placeholder-[var(--notion-text-tertiary)] focus:outline-none focus:border-[#3B82F6]"
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8 sm:py-12 text-[var(--notion-text-tertiary)] gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-[#3B82F6]" />
                            <span className="text-xs">Loading employee directory...</span>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-6 sm:py-8 text-xs text-[var(--notion-text-tertiary)]">
                            No employees found matching "{searchQuery}".
                        </div>
                    ) : (
                        filteredUsers.map((user) => {
                            const isSelected = selectedMemberIds.includes(user.id);
                            return (
                                <div
                                    key={user.id}
                                    onClick={() => toggleMember(user.id)}
                                    className={`flex items-center justify-between p-3 rounded-sm border cursor-pointer transition-all ${
                                        isSelected
                                            ? 'bg-[#3B82F6]/10 border-[#3B82F6]/40 text-[var(--notion-text-primary)]'
                                            : 'bg-[var(--notion-bg-primary)] border-[var(--notion-border-default)] hover:border-[var(--notion-text-tertiary)] text-[var(--notion-text-secondary)]'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs ${
                                            isSelected ? 'bg-[#3B82F6] text-white' : 'bg-[var(--notion-bg-tertiary)] text-[var(--notion-text-secondary)]'
                                        }`}>
                                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-[var(--notion-text-primary)]">{user.name || user.email}</p>
                                            <p className="text-[11px] text-[var(--notion-text-tertiary)] flex items-center gap-1.5 mt-0.5">
                                                <span className="font-semibold text-[#3B82F6]">{user.role}</span>
                                                <span>•</span>
                                                <span>{user.email}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-colors ${
                                        isSelected ? 'bg-[#3B82F6] border-[#3B82F6] text-white' : 'border-[var(--notion-border-default)]'
                                    }`}>
                                        {isSelected && <Check className="w-3.5 h-3.5" />}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

        </Modal>
    );
}
