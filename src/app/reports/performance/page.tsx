"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { TrendingUp, Users, Award, Clock, BarChart3, Download, Activity } from 'lucide-react';

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
        if (score >= 80) return 'bg-[#E3FCEF]';
        if (score >= 60) return 'bg-[#FFF0B3]';
        return 'bg-[#FFEBE6]';
    };

    const topPerformer = performance[0];
    const avgPerformance = performance.length > 0
        ? Math.round(performance.reduce((sum, p) => sum + p.avgPerformance, 0) / performance.length)
        : 0;
    const totalTasks = performance.reduce((sum, p) => sum + p.totalTasks, 0);
    const totalHours = performance.reduce((sum, p) => sum + p.totalHours, 0);

    return (
        <div className="p-8 space-y-8 bg-[#FAFBFC] min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#172B4D] mb-2">Team Performance Analytics</h1>
                    <p className="text-[#6B778C]">Actionable insights and KPI tracking for team management</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        options={[
                            { value: 'week', label: 'Last Week' },
                            { value: 'month', label: 'Last Month' },
                            { value: 'quarter', label: 'Last Quarter' }
                        ]}
                    />
                    <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
                        Export Data
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-[#DFE1E6] rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-3 text-[#0052CC]">
                        <Users className="w-6 h-6" />
                        <span className="text-3xl font-bold">{performance.length}</span>
                    </div>
                    <p className="text-sm font-bold text-[#6B778C] uppercase">Active Team</p>
                </div>
                <div className="bg-white border border-[#DFE1E6] rounded-lg p-6 shadow-sm text-[#36B37E]">
                    <div className="flex items-center gap-3 mb-3">
                        <BarChart3 className="w-6 h-6" />
                        <span className="text-3xl font-bold text-[#172B4D]">{avgPerformance}%</span>
                    </div>
                    <p className="text-sm font-bold text-[#6B778C] uppercase">Avg Efficiency</p>
                </div>
                <div className="bg-white border border-[#DFE1E6] rounded-lg p-6 shadow-sm text-[#FFAB00]">
                    <div className="flex items-center gap-3 mb-3">
                        <Clock className="w-6 h-6" />
                        <span className="text-3xl font-bold text-[#172B4D]">{totalHours}h</span>
                    </div>
                    <p className="text-sm font-bold text-[#6B778C] uppercase">Total Hours</p>
                </div>
                <div className="bg-white border border-[#DFE1E6] rounded-lg p-6 shadow-sm text-[#6554C0]">
                    <div className="flex items-center gap-3 mb-3">
                        <TrendingUp className="w-6 h-6" />
                        <span className="text-3xl font-bold text-[#172B4D]">{totalTasks}</span>
                    </div>
                    <p className="text-sm font-bold text-[#6B778C] uppercase">Tasks Done</p>
                </div>
            </div>

            {/* Top Performer & KPI Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {topPerformer && (
                    <div className="lg:col-span-1 bg-gradient-to-br from-[#0052CC] to-[#0747A6] rounded-lg p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Award className="w-24 h-24" />
                        </div>
                        <h3 className="text-lg font-bold opacity-80 mb-6 flex items-center gap-2">
                            <Award className="w-5 h-5" /> Top Performer
                        </h3>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-20 h-20 rounded-full border-4 border-white/30 bg-white/20 flex items-center justify-center text-3xl font-bold shadow-xl">
                                {topPerformer.user?.name?.substring(0, 1) || 'U'}
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold">{topPerformer.user?.name || 'Unknown User'}</h4>
                                <p className="opacity-70 text-sm uppercase tracking-wider font-bold">{topPerformer.user?.role}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 rounded-lg p-4">
                                <p className="text-xs opacity-60 uppercase mb-1">Weekly Tasks</p>
                                <p className="text-2xl font-bold">{topPerformer.avgTasksPerWeek}</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <p className="text-xs opacity-60 uppercase mb-1">Avg Score</p>
                                <p className="text-2xl font-bold">{topPerformer.avgPerformance}%</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="lg:col-span-2 bg-white border border-[#DFE1E6] rounded-lg p-6">
                    <h3 className="font-bold text-[#172B4D] mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#0052CC]" /> KPI Efficiency Metrics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-[#6B778C]">Completion Rate</p>
                            <div className="flex items-end gap-3">
                                <span className="text-4xl font-bold text-[#172B4D]">
                                    {Math.round(performance.reduce((acc, p) => acc + (p.metrics?.completionRate || 0), 0) / (performance.length || 1))}%
                                </span>
                                <div className="flex-1 h-3 bg-[#EBECF0] rounded-full overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-[#36B37E]"
                                        style={{ width: `${performance.reduce((acc, p) => acc + (p.metrics?.completionRate || 0), 0) / (performance.length || 1)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-[#6B778C]">Avg Tasks / Day</p>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl font-bold text-[#172B4D]">
                                    {(performance.reduce((acc, p) => acc + (p.metrics?.avgTasksPerDay || 0), 0) / (performance.length || 1)).toFixed(1)}
                                </span>
                                <div className="p-2 bg-[#DEEBFF] text-[#0052CC] rounded-full">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-[#6B778C]">Avg Hours / Day</p>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl font-bold text-[#172B4D]">
                                    {(performance.reduce((acc, p) => acc + (p.metrics?.avgHoursPerDay || 0), 0) / (performance.length || 1)).toFixed(1)}
                                </span>
                                <div className="p-2 bg-[#FFF0B3] text-[#FFAB00] rounded-full">
                                    <Clock className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Table */}
            <div className="bg-white border border-[#DFE1E6] rounded-lg overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#DFE1E6] flex items-center justify-between">
                    <h3 className="font-bold text-[#172B4D]">Individual Performance Tracking</h3>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#36B37E] bg-[#E3FCEF] px-2 py-1 rounded-sm uppercase">High</span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#FFAB00] bg-[#FFF0B3] px-2 py-1 rounded-sm uppercase">Med</span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#FF5630] bg-[#FFEBE6] px-2 py-1 rounded-sm uppercase">Low</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#FAFBFC] border-b border-[#DFE1E6]">
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#6B778C] uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#6B778C] uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#6B778C] uppercase tracking-wider text-center">Efficiency</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#6B778C] uppercase tracking-wider">KPI: Completion</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#6B778C] uppercase tracking-wider">Total Work</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#6B778C] uppercase tracking-wider text-right">Reports</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DFE1E6]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-[#6B778C]">
                                        <div className="flex flex-col items-center gap-2">
                                            <Activity className="w-8 h-8 animate-pulse text-[#0052CC]" />
                                            <p className="font-medium">Crunching data analytics...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : performance.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-[#6B778C]">
                                        No performance data available for this period
                                    </td>
                                </tr>
                            ) : (
                                performance.map((emp, index) => (
                                    <tr key={emp.userId} className="hover:bg-[#FAFBFC] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-lg font-bold ${index < 3 ? 'text-[#0052CC]' : 'text-[#6B778C]'}`}>#{index + 1}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[#DEEBFF] flex items-center justify-center text-[#0052CC] font-bold text-sm border-2 border-white shadow-sm">
                                                    {emp.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#172B4D]">{emp.user?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] text-[#6B778C] uppercase tracking-tighter">{emp.user?.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2.5 py-1 rounded-sm font-bold text-sm ${getPerformanceBg(emp.avgPerformance)} ${getPerformanceColor(emp.avgPerformance)}`}>
                                                {emp.avgPerformance}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 w-24 h-2 bg-[#EBECF0] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${emp.metrics?.completionRate >= 80 ? 'bg-[#36B37E]' : 'bg-[#FFAB00]'}`}
                                                        style={{ width: `${emp.metrics?.completionRate || 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium text-[#42526E]">{emp.metrics?.completionRate || 0}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-[#172B4D]">{emp.totalTasks} Tasks</span>
                                                <span className="text-xs text-[#6B778C]">{emp.totalHours} Hours Logged</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#6B778C] font-medium">
                                            {emp.reportsCount} Submissions
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
