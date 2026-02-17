
"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    GraduationCap,
    CheckCircle2,
    Calendar,
    ArrowRight,
    Search,
    Loader2,
    FileText,
    TrendingUp,
    AlertCircle,
    Clock,
    DollarSign,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// import ExpenseModal from '../ExpenseModal'; // TODO: Create ExpenseModal component

interface DashboardData {
    hasSubmittedReport: boolean;
    reportSubmissionTime: string | null;
    kpi: {
        efficiencyScore: number;
        streak: number;
        overdueMissions: number;
        activeMilestones: number;
        completedMilestones: number;
    };
    milestones: any[];
    recentTasks: any[];
    pendingExpenses: any[];
}

export default function EmployeeDashboard() {
    const { data: session } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<'tasks' | 'milestones'>('tasks');

    useEffect(() => {
        if (session) {
            fetchDashboardData();
        }
    }, [session]);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/dashboard/employee');
            if (res.ok) {
                const dashboardData = await res.json();
                setData(dashboardData);
            }
        } catch (error) {
            console.error("Failed to load dashboard", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#2383e2]" />
            </div>
        );
    }

    const currentHour = new Date().getHours();
    const isAfterSix = currentHour >= 18;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
            {/* 1. Dynamic Greeting & Report Status */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-heading tracking-tight">
                        Good {currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening'}, {session?.user?.name?.split(' ')[0]}
                    </h1>
                    <p className="text-subheading text-sm font-medium">Here's your performance impact for today.</p>
                </div>

                {!data?.hasSubmittedReport && (
                    <div className={cn(
                        "p-3 rounded-lg border flex items-center gap-4 animate-pulse",
                        isAfterSix ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                    )}>
                        {isAfterSix ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <span className="text-sm font-bold">Daily Report {isAfterSix ? 'Overdue' : 'Pending'}</span>
                            <button
                                onClick={() => router.push('/reports/submit')}
                                className={cn(
                                    "px-4 py-1 rounded-full text-xs font-bold transition-all",
                                    isAfterSix ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-500 text-white hover:bg-blue-600"
                                )}
                            >
                                Submit Now
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Performance Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Efficiency Score */}
                <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] p-4 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-12 h-12 text-[#2383e2]" />
                    </div>
                    <div className="text-subheading text-[10px] font-bold uppercase tracking-widest mb-1">Efficiency Score</div>
                    <div className="flex items-baseline gap-1">
                        <span className={cn(
                            "text-3xl font-bold",
                            (data?.kpi?.efficiencyScore || 0) >= 80 ? "text-emerald-500" :
                                (data?.kpi?.efficiencyScore || 0) >= 60 ? "text-orange-500" : "text-red-500"
                        )}>
                            {data?.kpi?.efficiencyScore ?? 100}%
                        </span>
                        <span className="text-xs text-subheading">completion rate</span>
                    </div>
                    <div className="mt-2 w-full bg-[var(--notion-bg-tertiary)] h-1 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all duration-1000",
                                (data?.kpi?.efficiencyScore || 0) >= 80 ? "bg-emerald-500" :
                                    (data?.kpi?.efficiencyScore || 0) >= 60 ? "bg-orange-500" : "bg-red-500"
                            )}
                            style={{ width: `${data?.kpi?.efficiencyScore ?? 100}%` }}
                        />
                    </div>
                </div>

                {/* Consistency Streak */}
                <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] p-4 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 className="w-12 h-12 text-blue-500" />
                    </div>
                    <div className="text-subheading text-[10px] font-bold uppercase tracking-widest mb-1">Impact Streak</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-blue-500">{data?.kpi?.streak ?? 0}</span>
                        <span className="text-xs text-subheading">days consecutive</span>
                    </div>
                    <div className="mt-2 text-[10px] text-subheading truncate">
                        Keep submitting reports daily!
                    </div>
                </div>

                {/* Overdue Missions */}
                <div className={cn(
                    "border p-4 rounded-xl relative overflow-hidden transition-all group",
                    (data?.kpi?.overdueMissions || 0) > 0
                        ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40"
                        : "bg-[var(--notion-bg-secondary)] border-[var(--notion-border-default)]"
                )}>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertCircle className={cn("w-12 h-12", (data?.kpi?.overdueMissions || 0) > 0 ? "text-red-500" : "text-emerald-500")} />
                    </div>
                    <div className="text-subheading text-[10px] font-bold uppercase tracking-widest mb-1">Overdue Missions</div>
                    <div className="flex items-baseline gap-1">
                        <span className={cn(
                            "text-3xl font-bold",
                            (data?.kpi?.overdueMissions || 0) > 0 ? "text-red-500" : "text-emerald-500"
                        )}>
                            {data?.kpi?.overdueMissions ?? 0}
                        </span>
                        <span className="text-xs text-subheading">items need attention</span>
                    </div>
                    <div className="mt-2 text-[10px] text-subheading truncate">
                        {(data?.kpi?.overdueMissions || 0) > 0 ? "Prioritize these immediately." : "You are completely up to date."}
                    </div>
                </div>

                {/* Milestone Velocity */}
                <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] p-4 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <GraduationCap className="w-12 h-12 text-purple-500" />
                    </div>
                    <div className="text-subheading text-[10px] font-bold uppercase tracking-widest mb-1">Milestone Velocity</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-heading">{data?.kpi?.activeMilestones ?? 0}</span>
                        <span className="text-xs text-subheading">active / {data?.kpi?.completedMilestones ?? 0} done</span>
                    </div>
                    <div className="mt-2 text-[10px] text-subheading flex items-center gap-1">
                        <span className="text-purple-500 font-bold">Turnover Rate</span>
                        <span>{(data?.kpi?.completedMilestones && data?.kpi?.activeMilestones) ? Math.round((data.kpi.completedMilestones / (data.kpi.completedMilestones + data.kpi.activeMilestones)) * 100) : 0}%</span>
                    </div>
                </div>
            </div>

            {/* 3. Section Navigation */}
            <div className="flex border-b border-[var(--notion-border-default)] gap-6">
                {[
                    { id: 'tasks', label: 'Assigned Tasks', icon: CheckCircle2 },
                    { id: 'milestones', label: 'My Milestones', icon: TrendingUp },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id as any)}
                        className={cn(
                            "pb-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2",
                            activeSection === tab.id
                                ? "text-heading border-heading"
                                : "text-subheading border-transparent hover:text-heading hover:border-[var(--notion-border-default)]"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {activeSection === 'tasks' ? (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                            {(!data?.recentTasks || data.recentTasks.length === 0) ? (
                                <div className="py-20 text-center border border-dashed border-[var(--notion-border-default)] rounded-xl bg-[var(--notion-bg-secondary)]/30">
                                    <CheckCircle2 className="w-10 h-10 text-subheading mx-auto mb-3 opacity-30" />
                                    <p className="text-subheading text-sm">No pending tasks. Great job!</p>
                                </div>
                            ) : (
                                data.recentTasks.map((task: any) => (
                                    <div
                                        key={task.id}
                                        onClick={() => router.push(`/projects/${task.projectId}`)}
                                        className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] p-4 rounded-xl hover:border-[var(--notion-border-active)] hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={cn(
                                                "mt-1 p-2 rounded-lg transition-colors",
                                                task.priority === 3 ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                                            )}>
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-heading group-hover:text-[#2383e2] transition-colors">{task.title}</div>
                                                <div className="text-xs text-subheading flex items-center gap-2 mt-1">
                                                    <span className="font-bold text-[10px] bg-[var(--notion-bg-tertiary)] px-1.5 py-0.5 rounded-sm uppercase">{task.project?.name || 'GEN'}</span>
                                                    <span>•</span>
                                                    <span>Due {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-subheading" />
                                    </div>
                                ))
                            )}
                            <Link href="/tasks" className="flex items-center justify-center py-2 text-xs font-bold text-subheading hover:text-heading transition-colors gap-2">
                                Go to Dedicated Tasks Page <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                            {(!data?.milestones || data.milestones.length === 0) ? (
                                <div className="py-20 text-center border border-dashed border-[var(--notion-border-default)] rounded-xl bg-[var(--notion-bg-secondary)]/30">
                                    <TrendingUp className="w-10 h-10 text-subheading mx-auto mb-3 opacity-30" />
                                    <p className="text-subheading text-sm">No assigned milestones found.</p>
                                </div>
                            ) : (
                                data.milestones.map((milestone: any) => (
                                    <div
                                        key={milestone.id}
                                        onClick={() => router.push(`/milestones`)}
                                        className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] p-4 rounded-xl hover:border-[var(--notion-border-active)] transition-all cursor-pointer flex flex-col gap-3 group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-bold text-heading group-hover:text-[#2383e2] transition-colors">{milestone.title}</div>
                                            <div className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                                milestone.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-500" :
                                                    milestone.status === 'DELAYED' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                                            )}>
                                                {milestone.status}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-subheading flex items-center gap-2">
                                                <GraduationCap className="w-3.5 h-3.5" />
                                                <span>{milestone.university?.name || 'General University'}</span>
                                                <span>•</span>
                                                <span>Target: {new Date(milestone.targetDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="w-32 h-1.5 bg-[var(--notion-bg-tertiary)] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#2383e2] transition-all duration-500"
                                                    style={{ width: `${milestone.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <Link href="/milestones" className="flex items-center justify-center py-2 text-xs font-bold text-subheading hover:text-heading transition-colors gap-2">
                                Go to Specialized Milestones Ledger <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Quick Access Grid */}
                    <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-xl p-6 shadow-sm">
                        <h3 className="text-xs font-bold text-heading uppercase tracking-widest mb-4 opacity-70">Quick Access</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { label: 'University Hunt', href: '/universities', icon: Search },
                                { label: 'Submit Daily Report', href: '/reports/submit', icon: FileText },
                                { label: 'My Library', href: '/library', icon: FileText },
                                { label: 'Space Registry', href: '/spaces', icon: ExternalLink },
                            ].map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.href}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--notion-bg-tertiary)] transition-all group"
                                >
                                    <link.icon className="w-4 h-4 text-subheading group-hover:text-[#2383e2] transition-colors" />
                                    <span className="text-sm font-bold text-subheading group-hover:text-heading">{link.label}</span>
                                </Link>
                            ))}
                            <button
                                onClick={() => setIsExpenseModalOpen(true)}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-500/10 group transition-all text-left w-full"
                            >
                                <DollarSign className="w-4 h-4 text-subheading group-hover:text-emerald-500" />
                                <span className="text-sm font-bold text-subheading group-hover:text-heading">Expense Request</span>
                            </button>
                        </div>
                    </div>

                    {/* Pending Approvals Widget */}
                    {data?.pendingExpenses && data.pendingExpenses.length > 0 && (
                        <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-xl p-6 shadow-sm">
                            <h3 className="text-xs font-bold text-heading uppercase tracking-widest mb-4 opacity-70">Awaiting Approval</h3>
                            <div className="space-y-4">
                                {data.pendingExpenses.map((expense: any) => (
                                    <div key={expense.id} className="flex flex-col gap-1 border-b border-[var(--notion-border-default)] pb-3 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-subheading truncate">{expense.description || expense.category}</span>
                                            <span className="text-xs font-bold text-heading">₹{Number(expense.amount).toLocaleString()}</span>
                                        </div>
                                        <div className="text-[10px] text-subheading flex items-center justify-between">
                                            <span>{expense.project?.name}</span>
                                            <span className="text-orange-500 font-bold">STALLED</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Add Missing Import for 'cn' and formatDistanceToNow
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
