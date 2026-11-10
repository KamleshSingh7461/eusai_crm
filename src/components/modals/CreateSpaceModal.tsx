"use client";

import React, { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpace } from '@/context/SpaceContext';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';

export const SPACE_COLORS = ['#3B82F6', '#34D399', '#FB7185', '#FBBF24', '#A78BFA', '#22D3EE', '#F472B6', '#94A3B8'];
const EMPTY = { name: '', description: '', color: SPACE_COLORS[0], type: 'DEPARTMENT' };

/** Create a department (space). Refreshes the shared space list on success. */
export default function CreateSpaceModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: () => void }) {
    const { refreshSpaces } = useSpace();
    const { showToast } = useToast();
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/spaces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            if (!res.ok) throw new Error();
            showToast('Department created', 'success');
            setForm(EMPTY);
            refreshSpaces();
            onCreated?.();
            onClose();
        } catch {
            showToast('Could not create the department', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Create department"
            description="Departments group projects, milestones and people."
            icon={<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/25 text-blue-300 ring-1 ring-inset ring-blue-400/25"><Building2 className="h-5 w-5" /></span>}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="create-space" isLoading={saving} leftIcon={<Plus className="h-4 w-4" />}>Create department</Button>
                </>
            }
        >
            <form id="create-space" onSubmit={submit} className="space-y-4">
                <Input label="Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="University Relations" autoFocus />
                <Textarea label="Description" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What this department is responsible for" />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Select label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                        options={[{ value: 'DEPARTMENT', label: 'Department' }, { value: 'STANDARD', label: 'Standard space' }]} />
                    <div>
                        <p className="mb-1.5 text-sm font-medium text-zinc-300">Color</p>
                        <div className="flex h-10 flex-wrap items-center gap-2">
                            {SPACE_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setForm({ ...form, color })}
                                    className={cn('h-6 w-6 rounded-lg transition-all', form.color === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0F131B]' : 'opacity-70 hover:opacity-100')}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Color ${color}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
