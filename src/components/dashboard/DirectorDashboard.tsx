"use client";

import React, { useEffect, useState } from 'react';
import PortfolioPulse from './PortfolioPulse';
import WorkspaceHealthWidget from './WorkspaceHealthWidget';
import WorkActivityFeed from './WorkActivityFeed';
import {
    Users,
    TrendingUp,
    Globe,
    Building2,
    Loader2
} from 'lucide-react';

interface DirectorData {
    stats: {
        partnerCount: number;
        totalRevenue: number;
        staffCount: number;
        marketCoverage: number;
        criticalIssues: number;
        totalOpenIssues: number;
    };
    spaceDistribution: any[];
    recentMilestones: any[];
}

export default function DirectorDashboard() {
    const [data, setData] = useState<DirectorData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDirectorData = async () => {
            try {
                const response = await fetch('/api/dashboard/director');
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to fetch director dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDirectorData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex bg-[#FAFBFC] h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#0052CC]" />
                    <p className="text-sm font-medium text-[#6B778C] animate-pulse">Gathering organizational intelligence...</p>
                </div>
            </div>
        );
    }

    const { stats, spaceDistribution, recentMilestones } = data || {
        stats: { partnerCount: 0, totalRevenue: 0, staffCount: 0, marketCoverage: 0, criticalIssues: 0, totalOpenIssues: 0 },
        spaceDistribution: [],
        recentMilestones: []
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#172B4D] mb-1 md:mb-2 tracking-tight">Executive Overview</h1>
                    <p className="text-[#6B778C] text-sm md:text-lg">Global performance metrics and organizational health.</p>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                    <button className="flex-1 sm:flex-none px-3 md:px-4 py-2 text-xs md:text-sm font-bold text-[#42526E] bg-white border border-[#DFE1E6] rounded-sm hover:bg-[#F4F5F7] transition-all shadow-sm">
                        Export Report
                    </button>
                    <button className="flex-1 sm:flex-none px-3 md:px-4 py-2 text-xs md:text-sm font-bold text-white bg-[#0052CC] rounded-sm hover:bg-[#0747A6] transition-all shadow-md">
                        Settings
                    </button>
                </div>
            </div>

            {/* High-Level Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="group bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm hover:shadow-md transition-all flex items-center gap-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 bg-indigo-50 rounded-full opacity-50 transition-transform group-hover:scale-110" />
                    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 relative z-10">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-3xl font-bold text-[#172B4D]">{stats.partnerCount}</div>
                        <div className="text-[10px] text-[#6B778C] font-bold uppercase tracking-widest mt-0.5">Partner Universities</div>
                    </div>
                </div>

                <div className="group bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm hover:shadow-md transition-all flex items-center gap-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 bg-green-50 rounded-full opacity-50 transition-transform group-hover:scale-110" />
                    <div className="p-3 bg-green-50 rounded-lg text-green-600 relative z-10">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-3xl font-bold text-[#172B4D]">₹{(stats.totalRevenue / 10000000).toFixed(1)}Cr</div>
                        <div className="text-[10px] text-[#6B778C] font-bold uppercase tracking-widest mt-0.5">Total Revenue (YTD)</div>
                    </div>
                </div>

                <div className="group bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm hover:shadow-md transition-all flex items-center gap-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 bg-blue-50 rounded-full opacity-50 transition-transform group-hover:scale-110" />
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600 relative z-10">
                        <Users className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-3xl font-bold text-[#172B4D]">{stats.staffCount}</div>
                        <div className="text-[10px] text-[#6B778C] font-bold uppercase tracking-widest mt-0.5">Total Staff</div>
                    </div>
                </div>

                <div className="group bg-white p-6 rounded-sm border border-[#DFE1E6] shadow-sm hover:shadow-md transition-all flex items-center gap-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 bg-purple-50 rounded-full opacity-50 transition-transform group-hover:scale-110" />
                    <div className="p-3 bg-purple-50 rounded-lg text-purple-600 relative z-10">
                        <Globe className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-3xl font-bold text-[#172B4D]">{stats.marketCoverage}%</div>
                        <div className="text-[10px] text-[#6B778C] font-bold uppercase tracking-widest mt-0.5">Market Coverage</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Feed Section */}
                <div className="lg:col-span-2 space-y-10">
                    <section>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-[0.2em]">Portfolio Pulse</h2>
                            <span className="text-[10px] font-bold text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded-full">Per Space Breakdown</span>
                        </div>
                        <PortfolioPulse data={spaceDistribution} />
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-[0.2em]">Strategy & Operations</h2>
                            <span className="text-[10px] font-bold text-[#36B37E] bg-[#E3FCEF] px-2 py-0.5 rounded-full">Global Feed</span>
                        </div>
                        <WorkActivityFeed data={{
                            milestones: recentMilestones,
                            actions: (data as any)?.executiveActions || [],
                            activity: (data as any)?.globalActivity || []
                        }} />
                    </section>
                </div>

                {/* Sidebar Widgets */}
                <div className="space-y-8">
                    <WorkspaceHealthWidget stats={{ critical: stats.criticalIssues, total: stats.totalOpenIssues }} />
                    {/* Add more director-specific widgets here */}
                </div>
            </div>
        </div>
    );
}
