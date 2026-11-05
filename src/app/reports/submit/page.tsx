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
    const [utilization, setUtilization] = useState('80');
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
                    utilization: parseInt(utilization, 10),
                    accomplishments,
                    challenges,
                    tomorrowPlan
                })
            });

            if (response.ok) {
                showToast('Report submitted', 'success');
                // Reset form
                setTasksCompleted('');
                setHoursWorked('');
                setUtilization('80');
                setAccomplishments('');
                setChallenges('');
                setTomorrowPlan('');
                router.push('/reports');
            } else {
                const data = await response.json().catch(() => ({}));
                showToast(`Request failed: ${data.message || 'Unable to submit report'}`, 'error');
            }
        } catch (error) {
            showToast('Network error. Check your connection.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#07090D] text-[rgba(255,255,255,0.9)] pb-20">
            {/* Header / Command Center Styles */}
            <div className="bg-[#0D1016] border-b border-[rgba(255,255,255,0.08)] shadow-xl relative z-20 mb-8">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/reports"
                            className="w-10 h-10 rounded-lg bg-[#131720] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[#1A1F2A] transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <p className="flex items-center gap-2 text-sm font-medium text-blue-300"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />Reports</p>
                            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-white">Daily report</h1>
                            <p className="mt-1 text-sm text-slate-400">
                                {currentDate}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Stats Banner Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#131720] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 hover:bg-[#32393d] transition-colors group shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.12em]">Executed Tasks</span>
                            <div className="w-8 h-8 rounded bg-[#34D399]/10 flex items-center justify-center border border-[#34D399]/20 text-[#34D399] group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white tracking-tight">{tasksCompleted || '0'}</p>
                    </div>
 
                    <div className="bg-[#131720] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 hover:bg-[#32393d] transition-colors group shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.12em]">Active Hours</span>
                            <div className="w-8 h-8 rounded bg-[#3B82F6]/10 flex items-center justify-center border border-[#3B82F6]/20 text-[#3B82F6] group-hover:scale-110 transition-transform">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white tracking-tight">{hoursWorked || '0.0'}</p>
                    </div>
 
                    <div className="bg-[#131720] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 hover:bg-[#32393d] transition-colors group shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.12em]">Daily Utilization</span>
                            <div className="w-8 h-8 rounded bg-[#a855f7]/10 flex items-center justify-center border border-[#a855f7]/20 text-[#a855f7] group-hover:scale-110 transition-transform">
                                <Activity className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white tracking-tight">{utilization}%</p>
                    </div>
 
                    <div className="bg-[#131720] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 hover:bg-[#32393d] transition-colors group shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.12em]">Log Status</span>
                            <div className="w-8 h-8 rounded bg-[#FBBF24]/10 flex items-center justify-center border border-[#FBBF24]/20 text-[#FBBF24] group-hover:scale-110 transition-transform">
                                <Target className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white tracking-tight">{accomplishments.length > 0 ? 'DRAFTING' : 'PENDING'}</p>
                    </div>
                </div>

                {/* Main Form */}
                <form onSubmit={handleSubmit} className="bg-[#131720] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-5 sm:p-8 opacity-[0.02] pointer-events-none">
                        <FileText className="w-64 h-64 transform rotate-12" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-[0.15em]">Tasks Completions</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={tasksCompleted}
                                onChange={(e) => setTasksCompleted(e.target.value)}
                                className="w-full bg-[#0D1016] border border-[rgba(255,255,255,0.1)] rounded-md px-4 py-3 text-white placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-[#3B82F6] transition-all font-mono font-bold"
                                required
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-[0.15em]">Hours Logged</label>
                            <input
                                type="number"
                                placeholder="0.0"
                                value={hoursWorked}
                                onChange={(e) => setHoursWorked(e.target.value)}
                                className="w-full bg-[#0D1016] border border-[rgba(255,255,255,0.1)] rounded-md px-4 py-3 text-white placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-[#3B82F6] transition-all font-mono font-bold"
                                required
                                min="0"
                                step="0.5"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[11px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-[0.15em]">Capacity Utilization</label>
                                <span className="text-xs font-mono font-bold text-[#a855f7] bg-[#a855f7]/10 px-2 py-0.5 rounded border border-[#a855f7]/20">{utilization}%</span>
                            </div>
                            <div className="pt-2 flex items-center h-[46px]">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={utilization}
                                    onChange={(e) => setUtilization(e.target.value)}
                                    className="w-full h-1.5 bg-[#0D1016] rounded-lg appearance-none cursor-pointer accent-[#a855f7] border border-[rgba(255,255,255,0.1)] focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 relative z-10">
                        <label className="text-[11px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-[0.15em]">
                            Mission Accomplishments <span className="text-[#F43F5E]">*</span>
                        </label>
                        <textarea
                            className="w-full bg-[#0D1016] border border-[rgba(255,255,255,0.1)] rounded-md px-4 py-3 text-[rgba(255,255,255,0.9)] placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-[#3B82F6] transition-all min-h-[140px] resize-y"
                            placeholder="What did you get done today? Reports are accepted between 5:00 PM and 11:59 PM IST."
                            value={accomplishments}
                            onChange={(e) => setAccomplishments(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2 relative z-10">
                        <label className="text-[11px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-[0.15em]">
                            Impediments / Challenges
                        </label>
                        <textarea
                            className="w-full bg-[#0D1016] border border-[rgba(255,255,255,0.1)] rounded-md px-4 py-3 text-[rgba(255,255,255,0.9)] placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[#F43F5E]/40 focus:border-[#F43F5E] transition-all min-h-[100px] resize-y"
                            placeholder="Report blocking factors..."
                            value={challenges}
                            onChange={(e) => setChallenges(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 relative z-10">
                        <label className="text-[11px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-[0.15em]">
                            Next Cycle Plan
                        </label>
                        <textarea
                            className="w-full bg-[#0D1016] border border-[rgba(255,255,255,0.1)] rounded-md px-4 py-3 text-[rgba(255,255,255,0.9)] placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-[#3B82F6] transition-all min-h-[100px] resize-y"
                            placeholder="What you plan to do tomorrow"
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
                            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-md font-bold uppercase tracking-wider px-4 sm:px-8 shadow-[0_0_20px_rgba(35,131,226,0.3)] hover:shadow-[0_0_30px_rgba(35,131,226,0.5)] transition-all transform active:scale-95"
                        >
                            Log Mission Data
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
