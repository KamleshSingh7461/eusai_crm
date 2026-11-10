"use client";

import React, { useEffect, useState } from 'react';
import { IndianRupee, Send } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { useToast } from '@/context/ToastContext';

const CATEGORIES = [
    { value: 'TRAVEL', label: 'Travel' },
    { value: 'HARDWARE', label: 'Hardware' },
    { value: 'SOFTWARE', label: 'Software' },
    { value: 'SERVICES', label: 'Services' },
];

/** Raise an expense request against a project. It goes to managers for approval. */
export default function ExpenseModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: () => void }) {
    const { showToast } = useToast();
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [form, setForm] = useState({ projectId: '', amount: '', category: 'TRAVEL', description: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        fetch('/api/projects')
            .then(res => (res.ok ? res.json() : []))
            .then((list: any[]) => {
                setProjects(list.map(p => ({ id: p.id, name: p.name })));
                if (list.length === 1) setForm(f => ({ ...f, projectId: list[0].id }));
            })
            .catch(() => setProjects([]));
    }, [open]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(form.amount);
        if (!form.projectId) return setError('Choose the project this expense belongs to.');
        if (!amount || amount <= 0) return setError('Enter an amount greater than zero.');
        setError('');
        setSaving(true);
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, amount }),
            });
            if (!res.ok) throw new Error();
            showToast('Expense request sent for approval', 'success');
            setForm({ projectId: '', amount: '', category: 'TRAVEL', description: '' });
            onCreated?.();
            onClose();
        } catch {
            showToast('Could not submit the expense', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Expense request"
            description="Your manager will be asked to approve it."
            icon={<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/25 text-emerald-300 ring-1 ring-inset ring-emerald-400/25"><IndianRupee className="h-5 w-5" /></span>}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="expense-form" isLoading={saving} leftIcon={<Send className="h-4 w-4" />}>Submit request</Button>
                </>
            }
        >
            <form id="expense-form" onSubmit={submit} className="space-y-4">
                <Select
                    label="Project"
                    required
                    value={form.projectId}
                    onChange={e => setForm({ ...form, projectId: e.target.value })}
                    placeholder={projects.length ? 'Choose a project' : 'No projects available'}
                    options={projects.map(p => ({ value: p.id, label: p.name }))}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Amount (₹)" required type="number" min="1" step="1" inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="2500" leftIcon={<IndianRupee />} />
                    <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} options={CATEGORIES} />
                </div>
                <Textarea label="What is it for?" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Train tickets for the Pune University visit" />
                {error && <p className="text-sm text-rose-300">{error}</p>}
            </form>
        </Modal>
    );
}
