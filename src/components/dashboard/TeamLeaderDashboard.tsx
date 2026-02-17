"use client";

import React, { useEffect, useState } from 'react';
import {
    Users,
    TrendingUp,
    Target,
    CheckCircle2,
    GraduationCap,
    ArrowRight,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import EmployeeDashboard from './EmployeeDashboard'; // Re-using for Personal Pipeline section

interface TeamStats {
    revenue: number;
    agreements: number;
    actionsDue: number;
    pendingApprovals: number;
}

interface TeamMember {
    id: string;
    name: string;
    role: string;
    status: string;
    activity: string;
}

interface TeamApproval {
    id: string;
    title: string;
    submittedBy: string;
    amount: string;
    type: string;
}

export default function TeamLeaderDashboard() {
    const [stats, setStats] = useState<TeamStats>({ revenue: 0, agreements: 0, actionsDue: 0, pendingApprovals: 0 });
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<TeamApproval[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch('/api/dashboard/team-leader');
                if (response.ok) {
                    const data = await response.json();
                    setStats(data.stats);
                    setTeam(data.team);
                    setPendingApprovals(data.pendingApprovals || []);
                }
            } catch (error) {
                console.error("Failed to fetch team leader dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleApproval = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const response = await fetch(`/api/expenses/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                setPendingApprovals(prev => prev.filter(a => a.id !== id));
                setStats(prev => ({ ...prev, pendingApprovals: prev.pendingApprovals - 1 }));
            }
        } catch (error) {
            console.error("Failed to update expense:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex bg-[#FAFBFC] h-96 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-heading">Team Leader Dashboard</h1>
                    <p className="text-body">Manage your team's performance and your own pipeline.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-eusai-secondary">
                        Team Report
                    </button>
                    <Link href="/milestones" className="btn-eusai-create flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Assign Goals
                    </Link>
                </div>
            </div>

            {/* Team Oversight Section */}
            <section className="bg-white border border-[#DFE1E6] rounded-sm p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Users className="w-5 h-5 text-[#0052CC]" />
                    <h2 className="text-lg font-bold text-heading">Team Pulse</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="p-4 bg-blue-50/50 rounded-sm border border-blue-100">
                        <div className="text-xs font-bold text-body uppercase mb-1">Total Team Revenue</div>
                        <div className="text-2xl font-bold text-[#0052CC]">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.revenue)}
                        </div>
                        <div className="text-xs text-green-600 mt-1">↑ from milestones</div>
                    </div>
                    <div className="p-4 bg-purple-50/50 rounded-sm border border-purple-100">
                        <div className="text-xs font-bold text-body uppercase mb-1">Agreements Closed</div>
                        <div className="text-2xl font-bold text-purple-700">{stats.agreements}</div>
                        <div className="text-xs text-body mt-1">Across {team.length} members</div>
                    </div>
                    <div className="p-4 bg-orange-50/50 rounded-sm border border-orange-100">
                        <div className="text-xs font-bold text-body uppercase mb-1">Actions Due</div>
                        <div className="text-2xl font-bold text-orange-600">{stats.actionsDue}</div>
                        <div className="text-xs text-orange-600 mt-1">Requires attention</div>
                    </div>
                </div>

                {/* Team Members List */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-body uppercase tracking-wider mb-3">Direct Reports</h3>
                    {team.length === 0 ? (
                        <div className="text-sm text-body py-4 bg-[#FAFBFC] text-center rounded-sm">
                            No team members assigned yet.
                        </div>
                    ) : (
                        team.map((member, i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-[#FAFBFC] rounded-sm border border-transparent hover:border-[#DFE1E6] transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#EBECF0] flex items-center justify-center text-xs font-bold text-subheading">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-subheading">{member.name}</div>
                                        <div className="text-xs text-body">{member.activity}</div>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 roundedElement text-[10px] font-bold uppercase ${member.status === 'On Track' ? 'bg-green-100 text-green-700' :
                                    member.status === 'Needs Support' ? 'bg-red-100 text-red-700' :
                                        member.status === 'Flagged' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>
                                    {member.status}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Team Approvals Flow */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-lg font-bold text-heading">Pending Team Approvals</h2>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase">
                        {stats.pendingApprovals} Pending
                    </span>
                </div>

                {pendingApprovals.length === 0 ? (
                    <div className="p-8 bg-white border border-dashed border-[#DFE1E6] rounded-sm text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 className="w-6 h-6 text-[#DFE1E6]" />
                        </div>
                        <h3 className="font-bold text-subheading">All Clear!</h3>
                        <p className="text-sm text-body">No pending expenses or requests from your team.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingApprovals.map((approval) => (
                            <div key={approval.id} className="bg-white border border-[#DFE1E6] rounded-sm p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-body bg-[#F4F5F7] px-2 py-0.5 roundedElement">
                                        {approval.type}
                                    </span>
                                    <span className="text-sm font-bold text-subheading">{approval.amount}</span>
                                </div>
                                <h4 className="font-bold text-heading mb-1 line-clamp-1">{approval.title}</h4>
                                <p className="text-xs text-body mb-4 flex items-center gap-1">
                                    Submitted by <span className="font-medium text-subheading">{approval.submittedBy}</span>
                                </p>
                                <div className="flex gap-2 pt-3 border-t border-[#F4F5F7]">
                                    <button
                                        onClick={() => handleApproval(approval.id, 'APPROVED')}
                                        className="flex-1 py-1.5 bg-[#36B37E] text-white text-[11px] font-bold rounded-sm hover:bg-[#00875A] transition-colors"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleApproval(approval.id, 'REJECTED')}
                                        className="flex-1 py-1.5 bg-white border border-[#DFE1E6] text-subheading text-[11px] font-bold rounded-sm hover:bg-[#F4F5F7] transition-colors"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Divider */}
            <div className="border-t border-[#DFE1E6]" />

            {/* Personal Pipeline Section */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <GraduationCap className="w-5 h-5 text-[#0052CC]" />
                    <h2 className="text-lg font-bold text-heading">My Personal Pipeline</h2>
                </div>
                {/* Reusing Employee Dashboard Logic for personal view */}
                <div className="bg-[#FAFBFC] p-4 rounded-sm border border-[#DFE1E6]">
                    <EmployeeDashboard />
                </div>
            </section>
        </div>
    );
}
