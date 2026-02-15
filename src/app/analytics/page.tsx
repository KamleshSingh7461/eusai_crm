"use client";

import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    Zap,
    Target,
    Activity,
    Download,
    Filter,
    TrendingUp,
    AlertCircle,
    Briefcase,
    Users,
    DollarSign,
    RefreshCw
} from 'lucide-react';
import AIInsights from '@/components/AIInsights';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

const COLORS = ['#0052CC', '#FFAB00', '#FF5630', '#36B37E', '#00B8D9'];

export default function AnalyticsPage() {
    const { data: session } = useSession();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/analytics');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchAnalytics();
        }
    }, [session]);

    if (isLoading || !data) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F4F5F7]">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-12 h-12 text-[#0052CC] animate-spin" />
                    <p className="text-[#6B778C] font-semibold tracking-wide uppercase text-xs">Aggregating CRM Intelligence...</p>
                </div>
            </div>
        );
    }

    const taskStatusData = Object.entries(data.taskStatus || {}).map(([name, value]) => ({ name, value }));

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 bg-[#F4F5F7] min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#172B4D] mb-1 font-display">Executive Analytics</h1>
                    <p className="text-[#6B778C] text-sm md:text-lg">Portfolio performance and high-level mission trajectory.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Download className="w-4 h-4" />}
                        className="bg-white border-[#DFE1E6]"
                    >
                        Export Report
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={fetchAnalytics}
                        leftIcon={<RefreshCw className="w-4 h-4" />}
                        className="bg-[#0052CC] hover:bg-[#0747A6]"
                    >
                        Sync Data
                    </Button>
                </div>
            </div>

            {/* AI Insights & KPI Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Revenue', value: `₹${(data.stats.totalRevenue / 1000).toFixed(1)}K`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Project Health', value: data.stats.activeProjects, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Velocity', value: `${data.stats.completionRate}%`, icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
                        { label: 'System Risks', value: data.stats.criticalIssues, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm relative overflow-hidden group">
                            <div className={cn("absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-110", stat.bg)} />
                            <div className="flex items-center gap-2 mb-2 relative">
                                <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                                <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest leading-none">{stat.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-[#172B4D] relative">{stat.value}</p>
                        </div>
                    ))}

                    {/* Secondary Insights or Mini-Stats */}
                    <div className="col-span-2 md:col-span-4 bg-white p-4 md:p-6 rounded-sm border border-[#DFE1E6] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
                            <div className="text-center sm:text-left">
                                <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest block mb-1">Portfolio Budget</span>
                                <span className="text-lg font-bold text-[#172B4D]">₹{(data.stats.totalBudget / 100000).toFixed(1)}L</span>
                            </div>
                            <div className="hidden sm:block h-10 w-px bg-[#DFE1E6]" />
                            <div className="text-center sm:text-left">
                                <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest block mb-1">Total Burn</span>
                                <span className="text-lg font-bold text-[#172B4D]">₹{(data.stats.totalExpenses / 1000).toFixed(1)}K</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-[#36B37E] uppercase tracking-widest leading-none">Healthy</span>
                                <span className="text-[9px] text-[#6B778C] font-medium">Portfolio Status</span>
                            </div>
                            <Activity className="w-5 h-5 text-[#36B37E]" />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <AIInsights />
                </div>
            </div>

            {/* Main Visuals Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend */}
                <div className="bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-8 cursor-default">
                        <div>
                            <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2 uppercase tracking-wide">
                                <TrendingUp className="w-4 h-4 text-[#36B37E]" /> Revenue Stream
                            </h3>
                            <p className="text-[10px] font-medium text-[#6B778C] mt-1">Growth projection based on paid orders</p>
                        </div>
                        <Filter className="w-4 h-4 text-[#6B778C] hover:text-[#0052CC]" />
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.revenueTrend}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0052CC" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0052CC" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F4F5F7" vertical={false} />
                                <XAxis dataKey="month" stroke="#6B778C" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#6B778C" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val / 1000}K`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '3px', border: 'none', boxShadow: '0 4px 12px rgba(9, 30, 66, 0.15)' }}
                                    formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#0052CC" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Execution Velocity */}
                <div className="bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-bold text-[#172B4D] uppercase tracking-wide">Execution Velocity</h3>
                            <p className="text-[10px] font-medium text-[#6B778C] mt-1">Sprinting throughput by week</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#DFE1E6]" /><span className="text-[9px] font-bold text-[#6B778C] uppercase">Goal</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#0052CC]" /><span className="text-[9px] font-bold text-[#6B778C] uppercase">Actual</span></div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.velocity} barGap={6}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F4F5F7" vertical={false} />
                                <XAxis dataKey="week" stroke="#6B778C" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#6B778C" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '3px', border: 'none', boxShadow: '0 4px 12px rgba(9, 30, 66, 0.15)' }}
                                />
                                <Bar dataKey="predicted" fill="#DFE1E6" radius={[2, 2, 0, 0]} barSize={20} />
                                <Bar dataKey="actual" fill="#0052CC" radius={[2, 2, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Distribution & Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
                {/* Task Health */}
                <div className="bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold text-[#172B4D] uppercase tracking-wide mb-6">Pipeline Composition</h3>
                    <div className="flex-1 flex items-center justify-center min-h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={taskStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {taskStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-x-0 bottom-0 py-4 flex flex-wrap justify-center gap-3">
                            {taskStatusData.map((entry, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                    <span className="text-[10px] font-bold text-[#6B778C] uppercase">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Team Leaderboard */}
                <div className="bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-[#172B4D] uppercase tracking-wide flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#0052CC]" /> High Performers
                        </h3>
                        <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest">Points based on DONE items</span>
                    </div>

                    <div className="space-y-4">
                        {data.leaderboard.length === 0 ? (
                            <div className="py-12 text-center text-[#6B778C]">
                                <p className="text-sm italic">No performance data captured for current team segment.</p>
                            </div>
                        ) : (
                            data.leaderboard.map((member: any, i: number) => (
                                <div key={i} className="flex items-center justify-between group cursor-default p-2 hover:bg-[#F4F5F7] rounded-sm transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-[#0052CC] flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-sm">
                                            {member.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#172B4D]">{member.name}</p>
                                            <p className="text-[10px] text-[#6B778C] font-bold uppercase tracking-widest">Team Member</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="w-32 h-1.5 bg-[#F4F5F7] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#36B37E] transition-all duration-1000"
                                                style={{ width: `${Math.min(100, member.points * 10)}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-[#172B4D] min-w-[30px] text-right">{member.points}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
