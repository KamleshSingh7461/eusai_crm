"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Send, CheckCircle2, Clock, Target, ArrowLeft, Activity, FileText } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
            showToast('Authorization required for submission', 'error');
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
                showToast('Mission log uploaded successfully', 'success');
                // Reset form
                setTasksCompleted('');
                setHoursWorked('');
                setAccomplishments('');
                setChallenges('');
                setTomorrowPlan('');
                router.push('/reports');
            } else {
                showToast('Uplink failed: Unable to submit report', 'error');
            }
        } catch (error) {
            showToast('Transmission error: Check network connection', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#191919] text-[rgba(255,255,255,0.9)] pb-20">
            {/* Header / Command Center Styles */}
            <div className="bg-[#1D2125] border-b border-[rgba(255,255,255,0.08)] shadow-xl relative z-20 mb-8">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/reports"
                            className="w-10 h-10 rounded-lg bg-[#2f3437] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[#3b4045] transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-[rgba(255,255,255,0.4)] text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                                <Activity className="w-3 h-3 text-[#2383e2]" />
                                Operational Log
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-[rgba(255,255,255,0.95)]">Daily Mission Report</h1>
                            <p className="hidden sm:block text-[rgba(255,255,255,0.5)] text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mt-1">
                                Cycle Date: {currentDate}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Stats Banner Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#2f3437] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 hover:bg-[#32393d] transition-colors group shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em]">Executed Tasks</span>
                            <div className="w-8 h-8 rounded bg-[#36B37E]/10 flex items-center justify-center border border-[#36B37E]/20 text-[#36B37E] group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-white tracking-tight">{tasksCompleted || '0'}</p>
                    </div>

                    <div className="bg-[#2f3437] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 hover:bg-[#32393d] transition-colors group shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em]">Active Hours</span>
                            <div className="w-8 h-8 rounded bg-[#2383e2]/10 flex items-center justify-center border border-[#2383e2]/20 text-[#2383e2] group-hover:scale-110 transition-transform">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-white tracking-tight">{hoursWorked || '0.0'}</p>
                    </div>

                    <div className="bg-[#2f3437] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 hover:bg-[#32393d] transition-colors group shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em]">Log Status</span>
                            <div className="w-8 h-8 rounded bg-[#FFAB00]/10 flex items-center justify-center border border-[#FFAB00]/20 text-[#FFAB00] group-hover:scale-110 transition-transform">
                                <Target className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-white tracking-tight">{accomplishments.length > 0 ? 'DRAFTING' : 'PENDING'}</p>
                    </div>
                </div>

                {/* Main Form */}
                <form onSubmit={handleSubmit} className="bg-[#2f3437] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                        <FileText className="w-64 h-64 transform rotate-12" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[rgba(255,255,255,0.4)] uppercase tracking-[0.15em]">Tasks Completions</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={tasksCompleted}
                                onChange={(e) => setTasksCompleted(e.target.value)}
                                className="w-full bg-[#1D2125] border border-[rgba(255,255,255,0.1)] rounded-md px-4 py-3 text-white placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[#2383e2]/40 focus:border-[#2383e2] transition-all font-mono font-bold"
                                required
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[rgba(255,255,255,0.4)] uppercase tracking-[0.15em]">Hours Logged</label>
                            <input
                                type="number"
                                placeholder="0.0"
                                value={hoursWorked}
                                onChange={(e) => setHoursWorked(e.target.value)}
                                className="w-full bg-[#1D2125] border border-[rgba(255,255,255,0.1)] rounded-md px-4 py-3 text-white placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[#2383e2]/40 focus:border-[#2383e2] transition-all font-mono font-bold"
                                required
                                min="0"
                                step="0.5"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 relative z-10">
                        <label className="text-[10px] font-black text-[rgba(255,255,255,0.4)] uppercase tracking-[0.15em]">
                            Mission Accomplishments <span className="text-[#DE350B]">*</span>
                        </label>
                        <textarea
                            className="w-full bg-[#1D2125] border border-[rgba(255,255,255,0.1)] rounded-md px-4 py-3 text-[rgba(255,255,255,0.9)] placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[#2383e2]/40 focus:border-[#2383e2] transition-all min-h-[140px] resize-y"
                            placeholder="itemize your tactical achievements..."
                            value={accomplishments}
                            onChange={(e) => setAccomplishments(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2 relative z-10">
                        <label className="text-[10px] font-black text-[rgba(255,255,255,0.4)] uppercase tracking-[0.15em]">
                            Impediments / Challenges
                        </label>
                        <textarea
                            className="w-full bg-[#1D2125] border border-[rgba(255,255,255,0.1)] rounded-md px-4 py-3 text-[rgba(255,255,255,0.9)] placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[#DE350B]/40 focus:border-[#DE350B] transition-all min-h-[100px] resize-y"
                            placeholder="Report blocking factors..."
                            value={challenges}
                            onChange={(e) => setChallenges(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 relative z-10">
                        <label className="text-[10px] font-black text-[rgba(255,255,255,0.4)] uppercase tracking-[0.15em]">
                            Next Cycle Plan
                        </label>
                        <textarea
                            className="w-full bg-[#1D2125] border border-[rgba(255,255,255,0.1)] rounded-md px-4 py-3 text-[rgba(255,255,255,0.9)] placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[#2383e2]/40 focus:border-[#2383e2] transition-all min-h-[100px] resize-y"
                            placeholder="Tactical objectives for tomorrow..."
                            value={tomorrowPlan}
                            onChange={(e) => setTomorrowPlan(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end pt-6 border-t border-[rgba(255,255,255,0.08)] relative z-10">
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            leftIcon={<Send className="w-4 h-4" />}
                            isLoading={isSubmitting}
                            className="bg-[#2383e2] hover:bg-[#1a6fcc] text-white rounded-md font-black uppercase tracking-widest px-8 shadow-[0_0_20px_rgba(35,131,226,0.3)] hover:shadow-[0_0_30px_rgba(35,131,226,0.5)] transition-all transform active:scale-95"
                        >
                            Log Mission Data
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
