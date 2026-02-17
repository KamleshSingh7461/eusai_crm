"use client";

import React, { useEffect, useState } from 'react';
import {
    Users,
    TrendingUp,
    Target,
    CheckCircle2,
    GraduationCap,
    ArrowRight,
    Loader2,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import EmployeeDashboard from './EmployeeDashboard'; // Re-using for Personal Pipeline section
import DashboardAISummary from './DashboardAISummary';

interface TeamStats {
    revenue: number;
    agreements: number;
    actionsDue: number;
    pendingApprovals: number;
}

interface TeamMember {
    id: string;
    name: string;
    image: string | null;
    role: string;
    metrics: {
        revenue: number;
        deals: number;
        lastActive: string;
    };
}

interface TeamLeaderData {
    stats: TeamStats;
    team: TeamMember[];
}

export default function TeamLeaderDashboard() {
    const [data, setData] = useState<TeamLeaderData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const response = await fetch('/api/dashboard/team-leader');
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to fetch team leader data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeamData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex bg-transparent h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#0052CC]" />
                    <p className="text-sm font-medium text-[rgba(255,255,255,0.7)] animate-pulse">Syncing team data...</p>
                </div>
            </div>
        );
    }

    const { stats, team } = data || {
        stats: { revenue: 0, agreements: 0, actionsDue: 0, pendingApprovals: 0 },
        team: []
    };

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[rgba(255,255,255,0.9)] tracking-tight">Team Command</h2>
                    <p className="text-[rgba(255,255,255,0.7)] mt-1 text-sm md:text-base">Overview of your direct reports and personal pipeline.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 text-xs md:text-sm font-bold text-gray-200 bg-[#3b4045]/50 border border-[rgba(255,255,255,0.08)] rounded-sm hover:bg-[#3b4045] transition-all shadow-sm">
                        Refresh Stats
                    </button>
                    <Link href="/tasks" className="px-4 py-2 text-xs md:text-sm font-bold text-white bg-[#0052CC] rounded-sm hover:bg-[#0747A6] transition-all shadow-md flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Assign Task
                    </Link>
                </div>
            </div>

            {/* AI Summary */}
            <DashboardAISummary role="Team Leader" contextData={stats} />

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-[#191919]/60 backdrop-blur-xl p-5 rounded-xl border border-[rgba(255,255,255,0.08)] shadow-sm hover:bg-[#191919]/80 transition-colors group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400 border border-green-500/20 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-widest">Team Revenue</span>
                    </div>
                    <div className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">₹{(stats.revenue / 100000).toFixed(1)}L</div>
                </div>

                <div className="bg-[#191919]/60 backdrop-blur-xl p-5 rounded-xl border border-[rgba(255,255,255,0.08)] shadow-sm hover:bg-[#191919]/80 transition-colors group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                            <GraduationCap className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-widest">Team Deals</span>
                    </div>
                    <div className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">{stats.agreements}</div>
                </div>

                <div className="bg-[#191919]/60 backdrop-blur-xl p-5 rounded-xl border border-[rgba(255,255,255,0.08)] shadow-sm hover:bg-[#191919]/80 transition-colors group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-widest">Pending Review</span>
                    </div>
                    <div className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">{stats.pendingApprovals}</div>
                </div>

                <div className="bg-[#191919]/60 backdrop-blur-xl p-5 rounded-xl border border-[rgba(255,255,255,0.08)] shadow-sm hover:bg-[#191919]/80 transition-colors group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-400 border border-red-500/20 group-hover:scale-110 transition-transform">
                            <Target className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-widest">Urgent Actions</span>
                    </div>
                    <div className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">{stats.actionsDue}</div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Team Grid */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[rgba(255,255,255,0.9)] flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#0052CC]" /> Your Team
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {team.map((member) => (
                            <div key={member.id} className="bg-[#191919]/60 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-xl p-4 hover:border-[#0052CC] transition-colors group">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-[#0052CC]/20 border border-[#0052CC]/30 flex items-center justify-center text-[#0052CC] font-bold text-lg overflow-hidden">
                                        {member.image ? <img src={member.image} alt="" className="w-full h-full object-cover" /> : member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-[rgba(255,255,255,0.9)]">{member.name}</div>
                                        <div className="text-xs text-[rgba(255,255,255,0.5)]">{member.role}</div>
                                    </div>
                                    <button className="ml-auto p-2 text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm pt-3 border-t border-[rgba(255,255,255,0.08)]">
                                    <div>
                                        <div className="text-[10px] text-[rgba(255,255,255,0.5)] uppercase tracking-widest">Revenue</div>
                                        <div className="font-bold text-[rgba(255,255,255,0.9)]">₹{(member.metrics.revenue / 1000).toFixed(1)}k</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-[rgba(255,255,255,0.5)] uppercase tracking-widest">Deals</div>
                                        <div className="font-bold text-[rgba(255,255,255,0.9)]">{member.metrics.deals}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Personal Pipeline (Employee Dashboard reuse) */}
                <section className="bg-[#191919]/40 border border-[rgba(255,255,255,0.05)] rounded-xl p-1">
                    <div className="px-6 py-4 flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)]">
                        <Zap className="w-4 h-4 text-[#FFAB00]" />
                        <h3 className="text-sm font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-widest">Your Personal Pipeline</h3>
                    </div>
                    <EmployeeDashboard />
                </section>
            </div>
        </div>
    );
}
