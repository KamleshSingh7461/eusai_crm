"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Send, CheckCircle2, Clock, Target, ArrowLeft } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

export default function SubmitReportPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const { showToast } = useToast();

    const [currentDate, setCurrentDate] = useState('');
    const [tasksCompleted, setTasksCompleted] = useState('');
    const [hoursWorked, setHoursWorked] = useState('');
    const [accomplishments, setAccomplishments] = useState('');
    const [challenges, setChallenges] = useState('');
    const [tomorrowPlan, setTomorrowPlan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString());
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user) {
            showToast('You must be logged in to submit a report', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/reports/daily', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: (session.user as any).id,
                    tasksCompleted: parseInt(tasksCompleted),
                    hoursWorked: parseFloat(hoursWorked),
                    accomplishments,
                    challenges,
                    tomorrowPlan
                })
            });

            if (response.ok) {
                showToast('Daily report submitted successfully!', 'success');
                // Reset form
                setTasksCompleted('');
                setHoursWorked('');
                setAccomplishments('');
                setChallenges('');
                setTomorrowPlan('');
                router.push('/reports');
            } else {
                showToast('Failed to submit report', 'error');
            }
        } catch (error) {
            showToast('Failed to submit report', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--notion-bg-primary)] text-[var(--notion-text-primary)] p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/reports" className="p-2 hover:bg-[var(--notion-bg-hover)] rounded-sm transition-colors text-[var(--notion-text-tertiary)] hover:text-[var(--notion-text-primary)]">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[var(--notion-text-primary)] mb-1 font-display">Daily Mission Log</h1>
                        <p className="text-[var(--notion-text-tertiary)]">Submit your daily accomplishments and plans for {currentDate}</p>
                    </div>
                </div>

                {/* Stats Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm p-4 hover:bg-[var(--notion-bg-tertiary)] transition-colors group">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-[#36B37E] group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-[var(--notion-text-tertiary)] uppercase">Tasks</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--notion-text-primary)]">{tasksCompleted || '0'}</p>
                    </div>
                    <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm p-4 hover:bg-[var(--notion-bg-tertiary)] transition-colors group">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-[#2383e2] group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-[var(--notion-text-tertiary)] uppercase">Hours</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--notion-text-primary)]">{hoursWorked || '0.0'}</p>
                    </div>
                    <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm p-4 hover:bg-[var(--notion-bg-tertiary)] transition-colors group">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5 text-[#FFAB00] group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-[var(--notion-text-tertiary)] uppercase">Progress</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--notion-text-primary)]">{accomplishments.length > 0 ? 'Active' : 'Pending'}</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm p-6 md:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-[var(--notion-text-secondary)]">Tasks Completed</label>
                            <input
                                type="number"
                                placeholder="e.g. 5"
                                value={tasksCompleted}
                                onChange={(e) => setTasksCompleted(e.target.value)}
                                className="w-full bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] rounded-sm px-3 py-2 text-[var(--notion-text-primary)] placeholder-[var(--notion-text-disabled)] focus:outline-none focus:ring-1 focus:ring-[#2383e2] transition-colors"
                                required
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-[var(--notion-text-secondary)]">Hours Worked</label>
                            <input
                                type="number"
                                placeholder="e.g. 8.5"
                                value={hoursWorked}
                                onChange={(e) => setHoursWorked(e.target.value)}
                                className="w-full bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] rounded-sm px-3 py-2 text-[var(--notion-text-primary)] placeholder-[var(--notion-text-disabled)] focus:outline-none focus:ring-1 focus:ring-[#2383e2] transition-colors"
                                required
                                min="0"
                                step="0.5"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[var(--notion-text-secondary)]">
                            Today's Accomplishments <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            className="w-full bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] rounded-sm px-4 py-3 text-[var(--notion-text-primary)] placeholder-[var(--notion-text-disabled)] focus:outline-none focus:ring-1 focus:ring-[#2383e2] transition-colors min-h-[120px]"
                            placeholder="List what you accomplished today..."
                            value={accomplishments}
                            onChange={(e) => setAccomplishments(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[var(--notion-text-secondary)]">
                            Challenges Faced
                        </label>
                        <textarea
                            className="w-full bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] rounded-sm px-4 py-3 text-[var(--notion-text-primary)] placeholder-[var(--notion-text-disabled)] focus:outline-none focus:ring-1 focus:ring-[#2383e2] transition-colors min-h-[80px]"
                            placeholder="Any blockers or challenges?"
                            value={challenges}
                            onChange={(e) => setChallenges(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[var(--notion-text-secondary)]">
                            Tomorrow's Plan
                        </label>
                        <textarea
                            className="w-full bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] rounded-sm px-4 py-3 text-[var(--notion-text-primary)] placeholder-[var(--notion-text-disabled)] focus:outline-none focus:ring-1 focus:ring-[#2383e2] transition-colors min-h-[80px]"
                            placeholder="What do you plan to work on tomorrow?"
                            value={tomorrowPlan}
                            onChange={(e) => setTomorrowPlan(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            leftIcon={<Send className="w-4 h-4" />}
                            isLoading={isSubmitting}
                            className="bg-[#2383e2] hover:bg-[#1a6fcc] text-white rounded-sm font-bold px-6"
                        >
                            Submit Daily Report
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
