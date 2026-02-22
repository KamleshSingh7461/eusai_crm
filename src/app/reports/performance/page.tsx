"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { TrendingUp, Users, Award, Clock, BarChart3, Download, Activity, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmployeePerformance {
    userId: string;
    user: {
        name: string;
        role: string;
        image?: string;
    };
    totalTasks: number;
    totalHours: number;
    avgPerformance: number;
    avgTasksPerWeek: number;
    avgHoursPerWeek: number;
    reportsCount: number;
    metrics: {
        avgTasksPerDay: number;
        avgHoursPerDay: number;
        completionRate: number;
    };
}

function MetricCard({ icon: Icon, label, value, color, trend }: any) {
    const colors: any = {
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        green: "text-green-400 bg-green-500/10 border-green-500/20",
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
        red: "text-red-400 bg-red-500/10 border-red-500/20",
    };

    return (
        <div className="bg-[#191919]/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl group hover:border-white/20 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-xl border", colors[color])}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{trend}</span>}
            </div>
            <div className="text-3xl font-black text-white tracking-tighter mb-1">{value}</div>
            <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">{label}</div>
        </div>
    );
}

export default function PerformancePage() {
    const [period, setPeriod] = useState('month');
    const [performance, setPerformance] = useState<EmployeePerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPerformance();
    }, [period]);

    const fetchPerformance = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/reports/performance?period=${period}`);
            const data = await res.json();
            setPerformance(data.employeePerformance || []);
        } catch (error) {
            console.error('Failed to fetch performance:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getPerformanceColor = (score: number) => {
        if (score >= 80) return 'text-[#36B37E]';
        if (score >= 60) return 'text-[#FFAB00]';
        return 'text-[#FF5630]';
    };

    const getPerformanceBg = (score: number) => {
        if (score >= 80) return 'bg-[#36B37E]/20 border-[#36B37E]/30';
        if (score >= 60) return 'bg-[#FFAB00]/20 border-[#FFAB00]/30';
        return 'bg-[#FF5630]/20 border-[#FF5630]/30';
    };

    const topPerformer = performance[0];
    const avgPerformance = performance.length > 0
        ? Math.round(performance.reduce((sum, p) => sum + p.avgPerformance, 0) / performance.length)
        : 0;
    const totalTasks = performance.reduce((sum, p) => sum + p.totalTasks, 0);
    const totalHours = performance.reduce((sum, p) => sum + p.totalHours, 0);

    return (
        <div className="p-8 space-y-10 bg-[#0A0A0A] min-h-screen text-white">
            {/* Nav Breadcrumb */}
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
                <Link href="/dashboard" className="hover:text-white transition-colors">Commander</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/60">Intelligence</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-blue-400">Tactical Performance</span>
            </div>

            {/* Header omitted for brevity in replace call, assuming it stays from previous successful edit */}

            {/* Summary Stats Grid - Restoring standard calls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <MetricCard icon={Users} label="Strategic Personnel" value={performance.length} color="blue" trend="+2 New Ops" />
                <MetricCard icon={ShieldCheck} label="Collective Efficiency" value={`${avgPerformance}%`} color="green" trend="Stable" />
                <MetricCard icon={Clock} label="Mission Hours" value={`${totalHours}h`} color="purple" trend="On Track" />
                <MetricCard icon={TrendingUp} label="Objectives Met" value={totalTasks} color="blue" trend="+14% Delta" />
            </div>

            {/* Top Performer & KPI Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {topPerformer && (
                    <Link href={`/team/${topPerformer.userId}`} className="lg:col-span-1 bg-gradient-to-br from-[#0052CC] to-[#0747A6] rounded-3xl p-10 text-white relative overflow-hidden group shadow-2xl shadow-blue-500/10 hover:scale-[1.02] transition-all border border-white/10">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Award className="w-32 h-32" />
                        </div>
                        <h3 className="text-sm font-black text-white/60 mb-10 flex items-center gap-2 uppercase tracking-widest">
                            <Award className="w-5 h-5 text-yellow-400" /> Executive Vanguard
                        </h3>
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-24 h-24 rounded-2xl border-4 border-white/20 bg-white/10 flex items-center justify-center text-4xl font-black shadow-2xl overflow-hidden">
                                {topPerformer.user?.image ? <img src={topPerformer.user.image} alt="" className="w-full h-full object-cover" /> : topPerformer.user?.name?.substring(0, 1) || 'U'}
                            </div>
                            <div>
                                <h4 className="text-3xl font-black tracking-tighter">{topPerformer.user?.name || 'Unknown User'}</h4>
                                <p className="text-xs font-black uppercase tracking-widest text-white/50 mt-1">{topPerformer.user?.role}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/20 transition-all text-center">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Cycle Load</p>
                                <p className="text-3xl font-black tracking-tighter">{topPerformer.avgTasksPerWeek}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/20 transition-all text-center">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Efficiency</p>
                                <p className="text-3xl font-black tracking-tighter text-green-300">{topPerformer.avgPerformance}%</p>
                            </div>
                        </div>
                    </Link>
                )}

                <div className="lg:col-span-2 bg-[#191919]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/2 to-transparent pointer-events-none" />
                    <h3 className="text-sm font-black text-white/60 mb-10 flex items-center gap-2 uppercase tracking-widest relative z-10">
                        <TrendingUp className="w-5 h-5 text-blue-400" /> Operational Efficiency Metrics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                        <div className="space-y-6">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Completion Phase</p>
                            <div className="space-y-4">
                                <span className="text-5xl font-black text-white tracking-tighter italic">
                                    {Math.round(performance.reduce((acc, p) => acc + (p.metrics?.completionRate || 0), 0) / (performance.length || 1))}%
                                </span>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-blue-500 shadow-[0_0_15px_rgba(0,82,204,0.5)]"
                                        style={{ width: `${performance.reduce((acc, p) => acc + (p.metrics?.completionRate || 0), 0) / (performance.length || 1)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6 border-l border-white/5 pl-8">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Daily Ops Capacity</p>
                            <div className="flex items-center gap-4">
                                <span className="text-5xl font-black text-white tracking-tighter italic">
                                    {(performance.reduce((acc, p) => acc + (p.metrics?.avgTasksPerDay || 0), 0) / (performance.length || 1)).toFixed(1)}
                                </span>
                                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6 border-l border-white/5 pl-8">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Resource Burn Rate</p>
                            <div className="flex items-center gap-4">
                                <span className="text-5xl font-black text-white tracking-tighter italic">
                                    {(performance.reduce((acc, p) => acc + (p.metrics?.avgHoursPerDay || 0), 0) / (performance.length || 1)).toFixed(1)}
                                </span>
                                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Table */}
            <div className="bg-[#191919]/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/2 to-transparent pointer-events-none" />
                <div className="px-10 py-8 border-b border-white/10 flex items-center justify-between relative z-10">
                    <h3 className="text-sm font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-400" /> Personnel Execution Registry
                    </h3>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-2 text-[10px] font-black text-[#36B37E] bg-[#36B37E]/20 px-3 py-1.5 rounded-lg border border-[#36B37E]/30 uppercase tracking-tighter">Elite</span>
                        <span className="flex items-center gap-2 text-[10px] font-black text-[#FFAB00] bg-[#FFAB00]/20 px-3 py-1.5 rounded-lg border border-[#FFAB00]/30 uppercase tracking-tighter">Tactical</span>
                        <span className="flex items-center gap-2 text-[10px] font-black text-[#FF5630] bg-[#FF5630]/20 px-3 py-1.5 rounded-lg border border-[#FF5630]/30 uppercase tracking-tighter">Critical</span>
                    </div>
                </div>
                <div className="overflow-x-auto relative z-10">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white/2 border-b border-white/10">
                                <th className="px-10 py-6 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Priority</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Operator</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Mission Rating</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">KPI: Convergence</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Total Output</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black text-white/30 uppercase tracking-widest">Intel Logs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-10 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Activity className="w-12 h-12 animate-pulse text-blue-400" />
                                            <p className="text-sm font-black uppercase tracking-widest text-white/20">Synthesizing field data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : performance.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-10 py-24 text-center">
                                        <p className="text-sm font-black uppercase tracking-widest text-white/20">No intelligence recorded for this cycle</p>
                                    </td>
                                </tr>
                            ) : (
                                performance.map((emp, index) => (
                                    <tr key={emp.userId} className="hover:bg-white/[0.03] transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500">
                                        <td className="px-10 py-6 whitespace-nowrap">
                                            <span className={cn(
                                                "text-2xl font-black italic tracking-tighter",
                                                index < 1 ? 'text-yellow-400' : index < 3 ? 'text-blue-400' : 'text-white/20'
                                            )}>
                                                {index + 1 < 10 ? `0${index + 1}` : index + 1}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 whitespace-nowrap">
                                            <Link href={`/team/${emp.userId}`} className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-xl bg-[#1D2125] flex items-center justify-center text-white font-black text-sm border border-white/10 shadow-lg overflow-hidden group-hover:scale-105 transition-transform">
                                                    {emp.user?.image ? <img src={emp.user.image} alt="" className="w-full h-full object-cover" /> : emp.user?.name?.substring(0, 1).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-white text-base tracking-tight group-hover:text-blue-400 transition-colors">{emp.user?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">{emp.user?.role}</p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-10 py-6 whitespace-nowrap text-center">
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-xl font-black text-sm border",
                                                getPerformanceBg(emp.avgPerformance),
                                                getPerformanceColor(emp.avgPerformance)
                                            )}>
                                                {emp.avgPerformance}%
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-4 min-w-[140px]">
                                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                    <div
                                                        className={cn(
                                                            "h-full transition-all duration-1000",
                                                            emp.metrics?.completionRate >= 80 ? 'bg-green-500 shadow-[0_0_8px_rgba(54,179,126,0.3)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(0,82,204,0.3)]'
                                                        )}
                                                        style={{ width: `${emp.metrics?.completionRate || 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-black text-white/40">{emp.metrics?.completionRate || 0}%</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black text-white tracking-widest uppercase">{emp.totalTasks} <span className="text-[10px] text-white/30">Objectives</span></span>
                                                <span className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">{emp.totalHours} Cycles Tracked</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 whitespace-nowrap text-right">
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                {emp.reportsCount} Submissions
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
