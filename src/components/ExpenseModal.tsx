"use client";

import React, { useState } from 'react';
import { X, DollarSign, Tag, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface ExpenseModalProps {
    projectId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ projectId, onClose, onSuccess }) => {
    const { showToast } = useToast();
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('SERVICES');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, amount, category, description }),
            });
            if (response.ok) {
                onSuccess();
                onClose();
                showToast(`Expense of $${amount} logged successfully.`, 'success');
            }
        } catch (error) {
            console.error('Failed to log expense:', error);
            showToast('Failed to record transaction.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-xl border border-border overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Log Actual Expense</h3>
                        <p className="text-xs text-muted-foreground">Record direct costs against project budget</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5" /> Amount (USD)
                        </label>
                        <input
                            type="number"
                            required
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-white border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5" /> Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-white border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none shadow-sm"
                        >
                            <option value="TRAVEL">Travel & Logistics</option>
                            <option value="HARDWARE">Hardware & Infrastructure</option>
                            <option value="SOFTWARE">Software & Licensing</option>
                            <option value="SERVICES">Professional Services</option>
                            <option value="MARKETING">Marketing & Outreach</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> Description
                        </label>
                        <textarea
                            placeholder="Details of the expenditure..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-white border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all min-h-[100px] shadow-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Confirm Transaction'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;
