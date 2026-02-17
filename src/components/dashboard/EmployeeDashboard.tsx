
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
    stats: {
        activeMilestones: number;
        completedMilestones: number;
        pendingTasks: number;
        pendingExpenses: number;
        prospects: number;
        partners: number;
    };
    recentTasks: any[];
    pendingExpenses: any[];
}

export default function EmployeeDashboard() {
    const { data: session } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [myProjects, setMyProjects] = useState<any[]>([]);

    useEffect(() => {
        if (session) {
            fetchDashboardData();
            fetchMyProjects();
        }
    }, [session]);

    const fetchMyProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const projects = await res.json();
                setMyProjects(projects);
            }
        } catch (error) {
            console.error("Failed to load projects", error);
        }
    };

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
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
            </div>
        );
    }

    const currentHour = new Date().getHours();
    const isAfterSix = currentHour >= 18;
    const reportStatus = data?.hasSubmittedReport ? 'SUBMITTED' : isAfterSix ? 'OVERDUE' : 'PENDING';

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* 1. Report Status Alert (Top Priority) */}
            {!data?.hasSubmittedReport && (
                <div className={`p-4 rounded-sm border flex flex-col sm:flex-row items-start gap-4 shadow-sm ${isAfterSix
                    ? 'bg-red-50 border-red-200'
                    : 'bg-indigo-50 border-indigo-200'
                    }`}>
                    {isAfterSix ? (
                        <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                    ) : (
                        <Clock className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                        <h3 className={`font-bold text-base md:text-lg mb-1 ${isAfterSix ? 'text-red-800' : 'text-indigo-900'
                            }`}>
                            {isAfterSix ? 'Daily Report Overdue!' : 'Submit Daily Report'}
                        </h3>
                        <p className={`text-xs md:text-sm mb-3 ${isAfterSix ? 'text-red-700' : 'text-indigo-700'
                            }`}>
                            {isAfterSix
                                ? 'You missed the 6:00 PM deadline. Please submit immediately.'
                                : 'Please submit your accomplishments before 6:00 PM.'}
                        </p>
                        <button
                            onClick={() => router.push('/reports/submit')}
                            className={`w-full sm:w-auto px-6 py-2 rounded-sm text-sm font-bold text-white shadow-sm transition-colors ${isAfterSix
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                        >
                            {isAfterSix ? 'Submit Late Report' : 'Submit Now'}
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Pipeline Stats */}
            <div className="bg-gradient-to-r from-[#0052CC] to-[#2684FF] p-4 md:p-6 rounded-sm text-white shadow-md">
                <h2 className="text-lg md:text-xl font-bold mb-2">My University Pipeline</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4">
                    <div className="bg-white/10 p-3 rounded-sm backdrop-blur-sm">
                        <div className="text-xl md:text-2xl font-bold">{data?.stats.prospects || 0}</div>
                        <div className="text-[10px] uppercase tracking-wider opacity-80">Prospects</div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-sm backdrop-blur-sm">
                        <div className="text-xl md:text-2xl font-bold">{data?.stats.partners || 0}</div>
                        <div className="text-[10px] uppercase tracking-wider opacity-80">Partners</div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-sm backdrop-blur-sm">
                        <div className="text-xl md:text-2xl font-bold text-yellow-300">{data?.stats.activeMilestones || 0}</div>
                        <div className="text-[10px] uppercase tracking-wider opacity-80">Active</div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-sm backdrop-blur-sm">
                        <div className="text-xl md:text-2xl font-bold text-amber-300">{data?.stats.pendingExpenses || 0}</div>
                        <div className="text-[10px] uppercase tracking-wider opacity-80">Pending</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Action Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Pending Tasks */}
                    <section className="bg-white border border-[#DFE1E6] rounded-sm shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-[#DFE1E6] bg-[#FAFBFC] flex items-center justify-between">
                            <h3 className="font-bold text-heading flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-orange-500" />
                                Pending Tasks
                            </h3>
                            <Link href="/projects" className="text-xs font-bold text-[#0052CC] hover:underline">View All</Link>
                        </div>
                        <div className="divide-y divide-[#EBECF0]">
                            {!data?.recentTasks || data.recentTasks.length === 0 ? (
                                <div className="p-6 text-center text-body text-sm italic">
                                    No pending tasks. You're all caught up!
                                </div>
                            ) : (
                                data.recentTasks.map((task: any) => (
                                    <div key={task.id} className="p-4 hover:bg-[#FAFBFC] transition-colors flex items-center justify-between group">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 w-4 h-4 rounded-full border-2 transition-colors ${task.priority > 1 ? 'border-red-400' : 'border-[#DFE1E6] group-hover:border-[#0052CC]'
                                                }`} />
                                            <div>
                                                <div className="font-medium text-subheading">{task.title}</div>
                                                <div className="text-xs text-body flex items-center gap-1">
                                                    <FileText className="w-3 h-3" />
                                                    {task.project?.name || 'General Task'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 roundedElement">
                                            {new Date(task.deadline).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Pending Expenses */}
                    <section className="bg-white border border-[#DFE1E6] rounded-sm shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-[#DFE1E6] bg-[#FAFBFC] flex items-center justify-between">
                            <h3 className="font-bold text-heading flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-500" />
                                My Pending Approvals
                            </h3>
                            <span className="text-xs font-medium text-body">Syncing Live</span>
                        </div>
                        <div className="divide-y divide-[#EBECF0]">
                            {!data?.pendingExpenses || data.pendingExpenses.length === 0 ? (
                                <div className="p-6 text-center text-body text-sm italic">
                                    No pending expense approvals.
                                </div>
                            ) : (
                                data.pendingExpenses.map((expense: any) => (
                                    <div key={expense.id} className="p-4 hover:bg-[#FAFBFC] transition-colors flex items-center justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 p-1.5 bg-emerald-50 rounded-sm">
                                                <DollarSign className="w-3 h-3 text-emerald-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-subheading">{expense.description || `Expense: ${expense.category}`}</div>
                                                <div className="text-xs text-body flex items-center gap-1">
                                                    {expense.project?.name} • {new Date(expense.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-subheading">₹{Number(expense.amount).toLocaleString()}</div>
                                            <div className="text-[10px] uppercase font-bold text-orange-600">Pending</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Quick Links */}
                    <div className="bg-white border border-[#DFE1E6] rounded-sm shadow-sm p-4">
                        <h3 className="font-bold text-heading mb-3 text-sm uppercase tracking-wide">Quick Access</h3>
                        <div className="space-y-2">
                            <Link href="/universities" className="block p-2 hover:bg-[#EBECF0] rounded-sm text-sm text-subheading font-medium flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Find University
                            </Link>
                            <Link href="/reports/submit" className="block p-2 hover:bg-[#EBECF0] rounded-sm text-sm text-subheading font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                {data?.hasSubmittedReport ? 'Update Today\'s Report' : 'Submit Daily Report'}
                            </Link>
                            <Link href="/milestones" className="block p-2 hover:bg-[#EBECF0] rounded-sm text-sm text-subheading font-medium flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Log New Deal
                            </Link>
                            <button
                                onClick={() => setIsExpenseModalOpen(true)}
                                className="w-full text-left p-2 hover:bg-[#EBECF0] rounded-sm text-sm text-subheading font-medium flex items-center gap-2"
                            >
                                <DollarSign className="w-4 h-4" />
                                Seek Expense Approval
                            </button>
                        </div>
                    </div>
                </div>

                {/* TODO: Add ExpenseModal component */}
                {/* {isExpenseModalOpen && myProjects.length > 0 && (
                    <ExpenseModal
                        projectId={myProjects[0].id}
                        onClose={() => setIsExpenseModalOpen(false)}
                        onSuccess={() => {
                            fetchDashboardData();
                            setIsExpenseModalOpen(false);
                        }}
                    />
                )} */}
            </div>
        </div>
    );
}
