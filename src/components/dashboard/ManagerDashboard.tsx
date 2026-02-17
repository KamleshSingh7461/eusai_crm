"use client";

import React, { useEffect, useState } from 'react';
import {
    Users,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Calendar,
    FileText,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    Briefcase,
    Zap,
    BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface DashboardData {
    stats: {
        revenue: number;
        activeMOUs: number;
        pendingSignatures: number;
        reportsSubmitted: number;
        totalTeamSize: number;
    };
    recentMilestones: Array<{
        id: string;
        title: string;
        category: string;
        ownerName: string;
        ownerImage: string | null;
        completedAt: string;
    }>;
    pendingApprovals: Array<{
        id: string;
        title: string;
        submittedBy: string;
        amount: string;
        type: string;
    }>;
}

export default function ManagerDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch('/api/dashboard/manager');
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to fetch manager dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex bg-[#3b4045] h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#0052CC]" />
                    <p className="text-sm font-medium text-[rgba(255,255,255,0.7)] animate-pulse">Assembling team metrics...</p>
                </div>
            </div>
        );
    }

    const { stats, recentMilestones, pendingApprovals } = data || {
        stats: { revenue: 0, activeMOUs: 0, pendingSignatures: 0, reportsSubmitted: 0, totalTeamSize: 0 },
        recentMilestones: [],
        pendingApprovals: []
    };

    const handleApproval = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const response = await fetch(`/api/expenses/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                // Remove from list or refresh
                setData(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        pendingApprovals: prev.pendingApprovals.filter(a => a.id !== id)
                    };
                });
            }
        } catch (error) {
            console.error("Failed to update expense:", error);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[rgba(255,255,255,0.9)] tracking-tight">Team Performance</h2>
                    <p className="text-[rgba(255,255,255,0.7)] mt-1 text-sm md:text-base">Real-time metrics for your managed departments.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <span className="text-[10px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-widest">Team Sync</span>
                        <span className="text-xs font-medium text-[#36B37E] flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-current" /> Live Update
                        </span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none px-4 py-2 text-xs md:text-sm font-bold text-subheading bg-[#2f3437] border border-[rgba(255,255,255,0.09)] rounded-sm hover:bg-[#3b4045] transition-all shadow-sm">
                            Insights
                        </button>
                        <Link href="/team" className="flex-1 md:flex-none px-4 py-2 text-xs md:text-sm font-bold text-white bg-[#0052CC] rounded-sm hover:bg-[#0747A6] transition-all shadow-md flex items-center justify-center gap-2">
                            <Users className="w-4 h-4" />
                            Team
                        </Link>
                    </div>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group relative overflow-hidden bg-[#2f3437] p-6 rounded-sm border border-[rgba(255,255,255,0.09)] shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-green-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-green-100 rounded-lg text-green-700">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" /> 12.5%
                            </span>
                        </div>
                        <h3 className="text-xs font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-widest mb-1">Group Revenue</h3>
                        <div className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">₹{(stats.revenue / 100000).toFixed(1)}L</div>
                        <div className="mt-4 pt-4 border-t border-[#F4F5F7] flex items-center justify-between">
                            <span className="text-[10px] text-[rgba(255,255,255,0.7)]">YTD Collection</span>
                            <span className="text-xs font-bold text-[rgba(255,255,255,0.9)]">Goal: ₹15L</span>
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-[#2f3437] p-6 rounded-sm border border-[rgba(255,255,255,0.09)] shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-blue-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                                Active MOUs
                            </span>
                        </div>
                        <h3 className="text-xs font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-widest mb-1">MOU Pipeline</h3>
                        <div className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">{stats.activeMOUs}</div>
                        <div className="mt-4 pt-4 border-t border-[#F4F5F7] flex items-center justify-between">
                            <span className="text-[10px] text-[rgba(255,255,255,0.7)]">{stats.pendingSignatures} Pending Signature</span>
                            <div className="w-24 h-1.5 bg-[#EBECF0] rounded-full overflow-hidden">
                                <div className="h-full bg-[#0052CC] rounded-full" style={{ width: '65%' }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-[#2f3437] p-6 rounded-sm border border-[rgba(255,255,255,0.09)] shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-purple-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
                                <Users className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center gap-1">
                                <ArrowDownRight className="w-3 h-3" /> Warning
                            </span>
                        </div>
                        <h3 className="text-xs font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-widest mb-1">Reporting Compliance</h3>
                        <div className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">{stats.reportsSubmitted}/{stats.totalTeamSize}</div>
                        <div className="mt-4 pt-4 border-t border-[#F4F5F7] flex items-center justify-between">
                            <span className="text-[10px] text-[rgba(255,255,255,0.7)]">Weekly submissions</span>
                            <span className="text-xs font-bold text-[#FF5630]">{stats.totalTeamSize - stats.reportsSubmitted} Overdue</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Grid: Team Activity and Approvals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Team Milestones Section */}
                <section className="bg-[#2f3437] border border-[rgba(255,255,255,0.09)] rounded-sm shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.09)] bg-[#3b4045] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#0052CC]" />
                            <h3 className="font-bold text-[rgba(255,255,255,0.9)] text-sm md:text-base">Recent Achievements</h3>
                        </div>
                        <Link href="/milestones" className="text-xs font-bold text-[#0052CC] hover:underline">View All</Link>
                    </div>
                    <div className="flex-1 p-0">
                        {recentMilestones.length === 0 ? (
                            <div className="p-10 text-center">
                                <div className="p-3 bg-[#F4F5F7] rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                                    <Zap className="w-6 h-6 text-[rgba(255,255,255,0.7)]" />
                                </div>
                                <p className="text-sm text-[rgba(255,255,255,0.7)]">No recent milestones completed.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#F4F5F7]">
                                {recentMilestones.map((milestone) => (
                                    <div key={milestone.id} className="px-6 py-4 hover:bg-[#3b4045] transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#DEEBFF] border border-[#B3D4FF] flex items-center justify-center text-[#0052CC] font-bold text-xs shrink-0 overflow-hidden shadow-inner">
                                                {milestone.ownerImage ? <img src={milestone.ownerImage} alt="" className="w-full h-full object-cover" /> : milestone.ownerName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-bold text-[rgba(255,255,255,0.9)] truncate group-hover:text-[#0052CC] transition-colors">{milestone.title}</h4>
                                                    <span className="text-[10px] text-[rgba(255,255,255,0.7)] shrink-0">{formatDistanceToNow(new Date(milestone.completedAt))} ago</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-[rgba(255,255,255,0.7)]">Completed by <span className="text-[rgba(255,255,255,0.9)] font-medium">{milestone.ownerName}</span></span>
                                                    <span className="w-1 h-1 rounded-full bg-[#DFE1E6]" />
                                                    <span className="text-[10px] font-bold text-[#403294] bg-[#EAE6FF] px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">{milestone.category.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Approvals Section */}
                <section className="bg-[#2f3437] border border-[rgba(255,255,255,0.09)] rounded-sm shadow-sm flex flex-col">
                    <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.09)] bg-[#3b4045] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-[#FFAB00]" />
                            <h3 className="font-bold text-[rgba(255,255,255,0.9)] text-sm md:text-base">Pending Approvals</h3>
                        </div>
                        <span className="px-2 py-0.5 bg-[#FFFAE6] text-[#FFAB00] text-[10px] font-bold rounded-sm border border-[#FFE380]">
                            {pendingApprovals.length} Actions
                        </span>
                    </div>
                    <div className="flex-1 p-6">
                        <div className="space-y-4">
                            {pendingApprovals.map((approval) => (
                                <div key={approval.id} className="relative p-5 bg-[#2f3437] border border-[rgba(255,255,255,0.09)] rounded-sm hover:border-[#0052CC] transition-all group overflow-hidden">
                                    <div className="absolute left-0 top-0 w-1 h-full bg-[#FFAB00]" />
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="text-sm font-bold text-[rgba(255,255,255,0.9)] mb-1">{approval.title}</h4>
                                            <p className="text-xs text-[rgba(255,255,255,0.7)]">Submitted by <span className="font-medium text-[rgba(255,255,255,0.9)]">{approval.submittedBy}</span></p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-[rgba(255,255,255,0.9)]">{approval.amount}</span>
                                            <div className="text-[10px] text-[rgba(255,255,255,0.7)] font-bold tracking-widest uppercase mt-1">{approval.type}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-3 mt-3 border-t border-[#F4F5F7]">
                                        <button
                                            onClick={() => handleApproval(approval.id, 'APPROVED')}
                                            className="px-4 py-1.5 bg-[#36B37E] text-white text-xs font-bold rounded-sm hover:bg-[#00875A] transition-colors"
                                        >
                                            Approve
                                        </button>
                                        <button className="px-4 py-1.5 bg-[#2f3437] border border-[rgba(255,255,255,0.09)] text-subheading text-xs font-bold rounded-sm hover:bg-[#3b4045] transition-colors">
                                            Review Details
                                        </button>
                                        <button className="ml-auto p-1.5 text-[rgba(255,255,255,0.7)] hover:text-[#FF5630] transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="mt-8 pt-8 border-t border-[#F4F5F7]">
                                <div className="flex items-center gap-6 justify-around">
                                    <div className="text-center group cursor-pointer">
                                        <div className="w-12 h-12 rounded-full bg-[#E3FCEF] flex items-center justify-center text-[#36B37E] mx-auto mb-2 transition-transform group-hover:scale-110 group-hover:shadow-md">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-[rgba(255,255,255,0.9)]">Team PTO</span>
                                    </div>
                                    <div className="text-center group cursor-pointer">
                                        <div className="w-12 h-12 rounded-full bg-[#DEEBFF] flex items-center justify-center text-[#0052CC] mx-auto mb-2 transition-transform group-hover:scale-110 group-hover:shadow-md">
                                            <Briefcase className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-[rgba(255,255,255,0.9)]">Resources</span>
                                    </div>
                                    <div className="text-center group cursor-pointer">
                                        <div className="w-12 h-12 rounded-full bg-[#EAE6FF] flex items-center justify-center text-[#403294] mx-auto mb-2 transition-transform group-hover:scale-110 group-hover:shadow-md">
                                            <BarChart3 className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-[rgba(255,255,255,0.9)]">Analytics</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
