"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Calendar, CheckCircle2, ChevronLeft, ChevronRight, Download, Filter,
    MoreHorizontal, Plus, Search, User, FileText, AlertTriangle, TrendingUp,
    Users, Clock, CheckCircle, XCircle, PieChart, Briefcase, Activity, Layers, Loader2, BarChart3, Target, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';

interface DailyReport {
    id: string;
    content: string;
    accomplishments: string;
    challenges: string | null;
    tomorrowPlan: string | null;
    tasksCompleted: number;
    hoursWorked: number;
    date: string;
    user: {
        name: string;
        image: string | null;
        role: string;
    };
    project: {
        id: string;
        name: string;
    } | null;
}

interface KPIData {
    employees: {
        avgCompletion: number;
        topPerformers: any[];
        list: any[];
    };
    projects: {
        total: number;
        avgRisk: number;
        list: any[];
    };
    tasks: {
        total: number;
        completed: number;
        completionRate: number;
        overdue: number;
        avgResolutionTime: string;
    };
    team: {
        velocity: number;
        activeIssues: number;
    };
    risks: any[];
    departments: any[];
    financials: {
        totalBudget: number;
        totalSpent: number;
        remaining: number;
        utilization: number;
    };
}

export default function ReportsPage() {
    const { showToast } = useToast();
    const { data: session } = useSession();
    // Safely determine if user is a director
    const userRole = session?.user?.role || '';
    const isDirector = userRole === 'DIRECTOR';
    const isManager = userRole === 'MANAGER';

    const [activeTab, setActiveTab] = useState<'MY' | 'TEAM' | 'FINANCIAL' | 'RESOURCES' | 'KPI'>('MY');

    useEffect(() => {
        if (isDirector) {
            setActiveTab('KPI');
        }
    }, [isDirector]);
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [meta, setMeta] = useState<any>(null);
    const [financialData, setFinancialData] = useState<any>(null);
    const [resourceData, setResourceData] = useState<any>(null);
    const [kpiData, setKpiData] = useState<KPIData | null>(null);

    useEffect(() => {
        if (session) {
            fetchData();
        }
    }, [session, activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'MY') {
                const res = await fetch('/api/reports/daily?type=my');
                if (res.ok) {
                    const data = await res.json();
                    setReports(data.reports);
                    setMeta(data.meta);
                }
            } else if (activeTab === 'TEAM') {
                const res = await fetch('/api/reports/daily?type=team');
                if (res.ok) {
                    const data = await res.json();
                    setReports(data.reports);
                    setMeta(data.meta);
                }
            } else if (activeTab === 'FINANCIAL') {
                const res = await fetch('/api/reports/financial');
                if (res.ok) setFinancialData(await res.json());
            } else if (activeTab === 'RESOURCES') {
                const res = await fetch('/api/reports/resources');
                if (res.ok) setResourceData(await res.json());
            } else if (activeTab === 'KPI') {
                const res = await fetch('/api/reports/kpi');
                if (res.ok) setKpiData(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error);
            showToast("Failed to load reports", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        showToast("Generating PDF Report...", "info");
        setTimeout(() => {
            showToast("Report downloaded successfully", "success");
        }, 1500);
    };

    const filteredReports = reports.filter(r =>
        r.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.accomplishments.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    );

    const renderKPIDashboard = () => {
        if (!kpiData) return null;
        const { employees, projects, tasks, team } = kpiData;

        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {/* 4 Key Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-sm border border-[#DFE1E6] hover:border-[#0052CC] transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-[#6B778C] uppercase">Task Velocity</p>
                            <TrendingUp className="w-4 h-4 text-[#36B37E] group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-3xl font-bold text-[#172B4D]">{team.velocity}</p>
                        <p className="text-[10px] text-[#6B778C] mt-1">Tasks / 7 Days</p>
                    </div>
                    <div className="bg-white p-5 rounded-sm border border-[#DFE1E6] hover:border-[#0052CC] transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-[#6B778C] uppercase">Avg Efficiency</p>
                            <Activity className="w-4 h-4 text-[#0052CC] group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-3xl font-bold text-[#172B4D]">{employees.avgCompletion}%</p>
                        <p className="text-[10px] text-[#6B778C] mt-1">Task Completion Rate</p>
                    </div>
                    <div className="bg-white p-5 rounded-sm border border-[#DFE1E6] hover:border-[#0052CC] transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-[#6B778C] uppercase">Project Risks</p>
                            <AlertTriangle className="w-4 h-4 text-[#FF5630] group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-3xl font-bold text-[#172B4D]">{projects.avgRisk}</p>
                        <p className="text-[10px] text-[#6B778C] mt-1">Avg Risk Score</p>
                    </div>
                    <div className="bg-white p-5 rounded-sm border border-[#DFE1E6] hover:border-[#0052CC] transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-[#6B778C] uppercase">Resolution Time</p>
                            <Clock className="w-4 h-4 text-[#6554C0] group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-3xl font-bold text-[#172B4D]">{tasks.avgResolutionTime}d</p>
                        <p className="text-[10px] text-[#6B778C] mt-1">Avg Task Turnaround</p>
                    </div>
                </div>

                {/* Strategic & Financial Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Financial Snapshot */}
                    <div className="bg-white p-6 rounded-sm border border-[#DFE1E6]">
                        <h3 className="font-bold text-[#172B4D] mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-[#0052CC]" /> Financial Snapshot
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-bold text-[#6B778C] uppercase">Budget Utilization</p>
                                    <p className="text-2xl font-bold text-[#172B4D]">{kpiData.financials?.utilization || 0}%</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-[#6B778C] uppercase">Remaining</p>
                                    <p className={`text-sm font-bold font-mono ${kpiData.financials?.remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        ₹{(kpiData.financials?.remaining || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="w-full h-2 bg-[#F4F5F7] rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${kpiData.financials?.utilization > 100 ? 'bg-red-500' : 'bg-[#0052CC]'}`}
                                    style={{ width: `${Math.min(kpiData.financials?.utilization || 0, 100)}%` }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EBECF0]">
                                <div>
                                    <p className="text-[9px] text-[#6B778C] uppercase">Total Allocated</p>
                                    <p className="text-xs font-bold text-[#172B4D]">₹{(kpiData.financials?.totalBudget || 0).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-[#6B778C] uppercase">Total Spent</p>
                                    <p className="text-xs font-bold text-[#172B4D]">₹{(kpiData.financials?.totalSpent || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Strategic Risks */}
                    <div className="bg-white p-6 rounded-sm border border-[#DFE1E6]">
                        <h3 className="font-bold text-[#BF2600] mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> Strategic Risks
                        </h3>
                        <div className="space-y-3">
                            {kpiData.risks?.length === 0 ? (
                                <p className="text-sm text-[#6B778C] italic">No critical risks identified.</p>
                            ) : (
                                kpiData.risks?.map((risk: any) => (
                                    <div key={risk.id} className="p-2 border border-[#FFEBE6] bg-[#FFF5F2] rounded-sm flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-[#FF5630] flex-shrink-0 mt-0.5" />
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-[#172B4D] truncate">{risk.title}</p>
                                            <div className="flex gap-2 text-[10px] items-center mt-1">
                                                <span className="font-bold text-[#BF2600] uppercase bg-[#FFBDAD] px-1 rounded-sm">{risk.severity}</span>
                                                <span className="text-[#6B778C] truncate max-w-[100px]">{risk.source}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Department Pulse */}
                    <div className="bg-white p-6 rounded-sm border border-[#DFE1E6]">
                        <h3 className="font-bold text-[#172B4D] mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-[#0052CC]" /> Department Pulse
                        </h3>
                        <div className="space-y-3">
                            {kpiData.departments?.map((dept: any) => (
                                <div key={dept.name} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-[#172B4D]">{dept.name}</p>
                                        <p className="text-[9px] text-[#6B778C] font-bold uppercase">{dept.headcount} Members</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-[#EBECF0] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#36B37E]" style={{ width: `${dept.avgEfficiency}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-[#172B4D] w-8 text-right">{dept.avgEfficiency}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Employee Performance */}
                    <div className="bg-white p-6 rounded-sm border border-[#DFE1E6]">
                        <h3 className="font-bold text-[#172B4D] mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#0052CC]" /> Employee Performance (Top 5)
                        </h3>
                        <div className="space-y-4">
                            {employees.topPerformers.map((emp: any) => (
                                <div key={emp.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#DEEBFF] text-[#0052CC] flex items-center justify-center font-bold text-xs ring-2 ring-transparent group-hover:ring-[#0052CC] transition-all">
                                            {emp.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#172B4D]">{emp.name}</p>
                                            <div className="flex gap-2">
                                                <span className="text-[10px] text-[#6B778C]">{emp.activeCount} Active Tasks</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-[#36B37E]">{emp.completionRate}%</p>
                                        <p className="text-[9px] text-[#6B778C] uppercase">Efficiency</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Project Health */}
                    <div className="bg-white p-6 rounded-sm border border-[#DFE1E6]">
                        <h3 className="font-bold text-[#172B4D] mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-[#0052CC]" /> Project Health & Risks
                        </h3>
                        <div className="space-y-3">
                            {projects.list.slice(0, 5).map((p: any) => (
                                <div key={p.id} className="p-3 border border-[#EBECF0] rounded-sm hover:bg-[#FAFBFC] transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-bold text-[#172B4D]">{p.name}</p>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase",
                                            p.riskScore > 20 ? "bg-red-100 text-red-700" : p.riskScore > 10 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                                        )}>
                                            Risk: {p.riskScore}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#EBECF0] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#0052CC]" style={{ width: `${p.progress}%` }} />
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[10px] text-[#6B778C]">Progress</span>
                                        <span className="text-[10px] font-bold text-[#172B4D]">{p.progress}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Global Task Stats */}
                <div className="bg-white p-6 rounded-sm border border-[#DFE1E6]">
                    <h3 className="font-bold text-[#172B4D] mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#0052CC]" /> Global Task Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="p-4 bg-[#FAFBFC] rounded-sm text-center">
                            <p className="text-[10px] font-bold text-[#6B778C] uppercase mb-1">Completion</p>
                            <div className="text-2xl font-bold text-[#172B4D] mb-2">{tasks.completionRate}%</div>
                            <div className="w-full h-1 bg-[#DFE1E6] rounded-full">
                                <div className="h-full bg-[#36B37E]" style={{ width: `${tasks.completionRate}%` }} />
                            </div>
                        </div>
                        <div className="p-4 bg-[#FFF5F2] rounded-sm text-center border border-[#FFE7E0]">
                            <p className="text-[10px] font-bold text-[#BF2600] uppercase mb-1">Overdue</p>
                            <div className="text-2xl font-bold text-[#BF2600] mb-2">{tasks.overdue}</div>
                            <p className="text-[9px] text-[#FF5630]">Tasks missed deadline</p>
                        </div>
                        <div className="p-4 bg-[#FAFBFC] rounded-sm text-center">
                            <p className="text-[10px] font-bold text-[#6B778C] uppercase mb-1">Total Volume</p>
                            <div className="text-2xl font-bold text-[#172B4D] mb-2">{tasks.total}</div>
                            <p className="text-[9px] text-[#6B778C]">Tasks recorded</p>
                        </div>
                        <div className="p-4 bg-[#FAFBFC] rounded-sm text-center">
                            <p className="text-[10px] font-bold text-[#6B778C] uppercase mb-1">Active Issues</p>
                            <div className="text-2xl font-bold text-[#172B4D] mb-2">{team.activeIssues}</div>
                            <p className="text-[9px] text-[#6B778C]">Reported blockers</p>
                        </div>
                    </div>
                </div>


                {/* Performance Directory */}
                <div className="bg-white p-6 rounded-sm border border-[#DFE1E6]">
                    <h3 className="font-bold text-[#172B4D] mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#0052CC]" /> Performance Directory
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#DFE1E6]">
                                    <th className="pb-2 text-[10px] font-bold text-[#6B778C] uppercase">Employee</th>
                                    <th className="pb-2 text-[10px] font-bold text-[#6B778C] uppercase">Role / Dept</th>
                                    <th className="pb-2 text-[10px] font-bold text-[#6B778C] uppercase text-center">Efficiency</th>
                                    <th className="pb-2 text-[10px] font-bold text-[#6B778C] uppercase text-center">On-Time Rate</th>
                                    <th className="pb-2 text-[10px] font-bold text-[#6B778C] uppercase text-center">Active Load</th>
                                    <th className="pb-2 text-[10px] font-bold text-[#6B778C] uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.list?.map((emp: any) => (
                                    <tr key={emp.id} className="border-b border-[#EBECF0] hover:bg-[#FAFBFC] group">
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-[#DEEBFF] text-[#0052CC] flex items-center justify-center font-bold text-xs">
                                                    {emp.name[0]}
                                                </div>
                                                <span className="text-sm font-bold text-[#172B4D]">{emp.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-[#42526E]">{emp.role}</span>
                                                <span className="text-[10px] text-[#6B778C]">{emp.department}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                                emp.completionRate >= 80 ? "bg-green-100 text-green-700" :
                                                    emp.completionRate >= 50 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                                            )}>
                                                {emp.completionRate}%
                                            </span>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className="text-sm font-mono text-[#172B4D]">{emp.onTimeRate}%</span>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className="text-xs font-bold text-[#172B4D]">{emp.activeCount} Tasks</span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={() => {
                                                    setActiveTab('TEAM');
                                                    setSearchQuery(emp.name);
                                                    showToast(`Viewing logs for ${emp.name}`, "info");
                                                }}
                                                className="text-xs font-bold text-[#0052CC] hover:underline flex items-center justify-end gap-1 ml-auto"
                                            >
                                                View Logs <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div >
        );
    };

    const renderFinancialReport = () => {
        if (!financialData) return null;
        const { stats, breakdown, projects } = financialData;

        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-sm border border-[#DFE1E6]">
                        <p className="text-[10px] font-bold text-[#6B778C] uppercase mb-1">Total Budget</p>
                        <p className="text-2xl font-bold text-[#172B4D] font-mono">₹{stats.totalBudget.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-5 rounded-sm border border-[#DFE1E6]">
                        <p className="text-[10px] font-bold text-[#6B778C] uppercase mb-1">Total Spent</p>
                        <p className="text-2xl font-bold text-[#172B4D] font-mono">₹{stats.totalSpent.toLocaleString()}</p>
                        <div className="w-full h-1 bg-[#F4F5F7] mt-2 rounded-full overflow-hidden">
                            <div className="h-full bg-[#0052CC]" style={{ width: `${(stats.totalSpent / stats.totalBudget) * 100}%` }} />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-sm border border-[#DFE1E6]">
                        <p className="text-[10px] font-bold text-[#6B778C] uppercase mb-1">Remaining</p>
                        <p className={`text-2xl font-bold font-mono ${stats.remainingBudget < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            ₹{stats.remainingBudget.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white p-5 rounded-sm border border-[#DFE1E6]">
                        <p className="text-[10px] font-bold text-[#6B778C] uppercase mb-1">Burn Rate / Project</p>
                        <p className="text-2xl font-bold text-[#172B4D] font-mono">₹{Math.round(stats.burnRate).toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Expense Breakdown */}
                    <div className="bg-white p-6 rounded-sm border border-[#DFE1E6]">
                        <h3 className="font-bold text-[#172B4D] mb-4 flex items-center gap-2">
                            <PieChart className="w-4 h-4 text-[#0052CC]" /> Expense Distribution
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(breakdown).map(([category, amount]: [string, any]) => (
                                <div key={category}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-bold text-[#42526E] uppercase">{category}</span>
                                        <span className="font-mono text-[#172B4D]">₹{amount.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#F4F5F7] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#36B37E]" style={{ width: `${(amount / stats.totalSpent) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Project List */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-sm border border-[#DFE1E6]">
                        <h3 className="font-bold text-[#172B4D] mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-[#0052CC]" /> Project Financial Health
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#DFE1E6] text-left">
                                        <th className="py-2 text-[10px] font-bold text-[#6B778C] uppercase">Project</th>
                                        <th className="py-2 text-[10px] font-bold text-[#6B778C] uppercase text-right">Budget</th>
                                        <th className="py-2 text-[10px] font-bold text-[#6B778C] uppercase text-right">Spent</th>
                                        <th className="py-2 text-[10px] font-bold text-[#6B778C] uppercase text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map((p: any) => (
                                        <tr key={p.id} className="border-b border-[#EBECF0] hover:bg-[#FAFBFC]">
                                            <td className="py-3 text-sm font-medium text-[#172B4D]">{p.name}</td>
                                            <td className="py-3 text-sm text-[#42526E] font-mono text-right">₹{p.budget.toLocaleString()}</td>
                                            <td className="py-3 text-sm text-[#42526E] font-mono text-right">₹{p.spent.toLocaleString()}</td>
                                            <td className="py-3 text-center">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase",
                                                    p.status === 'OVER_BUDGET' ? "bg-red-100 text-red-700" :
                                                        p.status === 'AT_RISK' ? "bg-orange-100 text-orange-700" :
                                                            "bg-green-100 text-green-700"
                                                )}>
                                                    {p.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderResourceReport = () => {
        if (!resourceData) return null;
        const { stats, team } = resourceData;

        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-sm border border-[#DFE1E6]">
                        <p className="text-[10px] font-bold text-[#6B778C] uppercase mb-1">Active Tasks</p>
                        <p className="text-2xl font-bold text-[#172B4D]">{stats.totalActiveTasks}</p>
                    </div>
                    <div className="bg-white p-5 rounded-sm border border-[#DFE1E6]">
                        <p className="text-[10px] font-bold text-[#6B778C] uppercase mb-1">Avg Utilization</p>
                        <p className="text-2xl font-bold text-[#172B4D]">{stats.avgUtilization}%</p>
                        <div className="w-full h-1 bg-[#F4F5F7] mt-2 rounded-full overflow-hidden">
                            <div className="h-full bg-[#6554C0]" style={{ width: `${stats.avgUtilization}%` }} />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-sm border border-[#DFE1E6]">
                        <p className="text-[10px] font-bold text-[#6B778C] uppercase mb-1">Overdue Items</p>
                        <p className="text-2xl font-bold text-red-600">{stats.totalOverdue}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-sm border border-[#DFE1E6]">
                    <h3 className="font-bold text-[#172B4D] mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#0052CC]" /> Workforce Utilization
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {team.map((member: any) => (
                            <div key={member.id} className="p-4 border border-[#EBECF0] rounded-sm hover:border-[#0052CC] transition-colors relative bg-[#FAFBFC]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-[#DEEBFF] flex items-center justify-center text-[#0052CC] font-bold text-xs overflow-hidden">
                                        {member.image ? <img src={member.image} alt={member.name} className="w-full h-full object-cover" /> : member.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#172B4D] text-sm">{member.name}</p>
                                        <p className="text-[10px] text-[#6B778C] uppercase font-bold">{member.role}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-xl font-bold text-[#172B4D]">{member.metrics.utilization}%</p>
                                        <p className="text-[9px] text-[#6B778C] uppercase">Load</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[#6B778C]">Active Tasks</span>
                                        <span className="font-bold text-[#172B4D]">{member.metrics.activeTasks}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[#6B778C]">High Priority</span>
                                        <span className="font-bold text-orange-600">{member.metrics.highPriority}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[#6B778C]">Overdue</span>
                                        <span className="font-bold text-red-600">{member.metrics.overdue}</span>
                                    </div>
                                </div>
                                {member.metrics.overdue > 0 && (
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12 p-4 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#172B4D] mb-1 md:mb-2 font-display">Mission Intelligence</h1>
                    <p className="text-[#6B778C] text-sm md:text-base">Strategic oversight of tactical execution and operational risks.</p>
                </div>
                <div className="flex flex-col xs:flex-row gap-2">
                    {!isDirector && (
                        <Link
                            href="/reports/submit"
                            className="btn-eusai-create flex items-center justify-center gap-2 px-4 py-2 text-sm w-full xs:w-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Submit Report
                        </Link>
                    )}
                    <button
                        onClick={handleExport}
                        className="bg-white border border-[#DFE1E6] hover:bg-[#FAFBFC] text-[#172B4D] px-4 py-2 rounded-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm text-sm w-full xs:w-auto"
                    >
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-6 md:gap-8 border-b border-[#DFE1E6] overflow-x-auto no-scrollbar">
                {!isDirector && (
                    <button
                        onClick={() => setActiveTab('MY')}
                        className={cn(
                            "pb-4 text-sm font-bold transition-all relative whitespace-nowrap",
                            activeTab === 'MY' ? "text-[#0052CC] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#0052CC]" : "text-[#6B778C] hover:text-[#172B4D]"
                        )}
                    >
                        Personnel Log
                    </button>
                )}
                {isManager && (
                    <>
                        {(isDirector || userRole === 'MANAGER') && (
                            <button
                                onClick={() => setActiveTab('KPI')}
                                className={cn(
                                    "pb-4 text-sm font-bold transition-all relative whitespace-nowrap",
                                    activeTab === 'KPI' ? "text-[#0052CC] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#0052CC]" : "text-[#6B778C] hover:text-[#172B4D]"
                                )}
                            >
                                Performance KPIs
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('TEAM')}
                            className={cn(
                                "pb-4 text-sm font-bold transition-all relative whitespace-nowrap",
                                activeTab === 'TEAM' ? "text-[#0052CC] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#0052CC]" : "text-[#6B778C] hover:text-[#172B4D]"
                            )}
                        >
                            Team Intelligence
                        </button>
                        {(isDirector || userRole === 'MANAGER') && (
                            <>
                                <button
                                    onClick={() => setActiveTab('FINANCIAL')}
                                    className={cn(
                                        "pb-4 text-sm font-bold transition-all relative whitespace-nowrap",
                                        activeTab === 'FINANCIAL' ? "text-[#0052CC] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#0052CC]" : "text-[#6B778C] hover:text-[#172B4D]"
                                    )}
                                >
                                    Financial Audit
                                </button>
                                <button
                                    onClick={() => setActiveTab('RESOURCES')}
                                    className={cn(
                                        "pb-4 text-sm font-bold transition-all relative whitespace-nowrap",
                                        activeTab === 'RESOURCES' ? "text-[#0052CC] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#0052CC]" : "text-[#6B778C] hover:text-[#172B4D]"
                                    )}
                                >
                                    Resource Utilization
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 bg-white border border-[#DFE1E6] rounded-sm">
                    <Loader2 className="w-8 h-8 text-[#0052CC] animate-spin mb-4" />
                    <p className="text-[#6B778C] font-bold text-sm uppercase tracking-widest">Gaining Intelligence...</p>
                </div>
            ) : (
                <>
                    {/* Render specific views based on activeTab */}
                    {activeTab === 'KPI' && renderKPIDashboard()}
                    {activeTab === 'FINANCIAL' && renderFinancialReport()}
                    {activeTab === 'RESOURCES' && renderResourceReport()}

                    {['MY', 'TEAM'].includes(activeTab) && (
                        <div className="space-y-6">
                            {/* Search Bar for Logs */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B778C]" />
                                <input
                                    placeholder="Search mission logs by user, project, or content..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white border border-[#DFE1E6] rounded-sm py-2 pl-10 pr-4 text-sm text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#0052CC] w-full md:w-96 transition-all"
                                />
                            </div>

                            {/* Executive Dashboard for Team View */}
                            {activeTab === 'TEAM' && meta && (
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
                                    <div className="card-jira p-5 bg-white border border-[#DFE1E6] rounded-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#E3FCEF] -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                                        <div className="relative">
                                            <p className="text-[10px] font-bold text-[#36B37E] uppercase tracking-widest mb-3">Submission Health</p>
                                            <div className="flex items-end gap-2 mb-1">
                                                <span className="text-3xl font-bold text-[#172B4D]">{meta.submissionRate}%</span>
                                                <span className="text-xs text-[#6B778C] font-bold mb-1">({meta.totalSubmitted}/{meta.totalExpected})</span>
                                            </div>
                                            <div className="w-full h-1 bg-[#EBECF0] rounded-full mt-2">
                                                <div className="h-full bg-[#36B37E] transition-all duration-1000" style={{ width: `${meta.submissionRate}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-jira p-5 bg-white border border-[#DFE1E6] rounded-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFFAE6] -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                                        <div className="relative">
                                            <p className="text-[10px] font-bold text-[#FFAB00] uppercase tracking-widest mb-3">Risk Detection</p>
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertTriangle className={`w-5 h-5 ${meta.risks.length > 0 ? 'text-[#FF5630] animate-pulse' : 'text-[#36B37E]'}`} />
                                                <span className="text-xl font-bold text-[#172B4D]">{meta.risks.length} Flagged Reports</span>
                                            </div>
                                            <p className="text-[9px] text-[#6B778C] font-bold mt-2 font-mono">Real-time challenge detection active</p>
                                        </div>
                                    </div>

                                    <div className="col-span-2 card-jira p-5 bg-white border border-[#DFE1E6] rounded-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-[10px] font-bold text-[#0052CC] uppercase tracking-widest">Effort Distribution</p>
                                            <BarChart3 className="w-4 h-4 text-[#6B778C]" />
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {Object.entries(meta.effortByProject).slice(0, 4).map(([proj, hours]) => (
                                                <div key={proj as string} className="p-2 bg-[#FAFBFC] rounded-sm border border-[#DFE1E6]">
                                                    <p className="text-[8px] font-bold text-[#6B778C] uppercase truncate mb-1">{proj as string}</p>
                                                    <p className="text-sm font-bold text-[#172B4D]">{hours as number}h</p>
                                                </div>
                                            ))}
                                            {Object.keys(meta.effortByProject).length === 0 && (
                                                <p className="col-span-4 text-center text-[10px] text-[#6B778C] italic py-2">No effort data available for current cycle.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Logs List & Sidebar */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                <div className="lg:col-span-3 space-y-4">
                                    <h3 className="font-bold text-[#172B4D] text-lg mb-4">
                                        {activeTab === 'MY' ? 'Mission Logs' : 'Personnel Activity Feed'}
                                    </h3>

                                    {filteredReports.length === 0 ? (
                                        <div className="p-16 text-center bg-[#FAFBFC] border-2 border-dashed border-[#DFE1E6] rounded-sm text-[#6B778C]">
                                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                            <h3 className="text-xl font-bold text-[#172B4D] mb-2">No Intel Found</h3>
                                            <p className="text-sm max-w-sm mx-auto">Either no reports have been filed for this cycle, or they don't match your current search parameters.</p>
                                        </div>
                                    ) : (
                                        filteredReports.map((report: DailyReport) => (
                                            <div key={report.id} className="card-jira p-5 bg-white border border-[#DFE1E6] rounded-sm hover:border-[#0052CC] transition-all group relative">
                                                {report.challenges && report.challenges.trim().length > 10 && (
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#FF5630]" />
                                                )}

                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            {report.user.image ? (
                                                                <img src={report.user.image} alt={report.user.name} className="w-12 h-12 rounded-sm object-cover border border-[#DFE1E6]" />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-sm bg-[#0052CC] flex items-center justify-center text-white text-lg font-bold">
                                                                    {report.user.name[0]}
                                                                </div>
                                                            )}
                                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${report.challenges ? 'bg-[#FFAB00]' : 'bg-[#36B37E]'}`}>
                                                                {report.challenges ? <AlertTriangle className="w-2 h-2 text-white" /> : <CheckCircle className="w-2 h-2 text-white" />}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-[#172B4D] group-hover:text-[#0052CC] transition-colors">{report.user.name}</h4>
                                                            <div className="flex items-center gap-2 text-[10px] text-[#6B778C] font-bold uppercase tracking-tighter">
                                                                <span>{report.user.role}</span>
                                                                <span>•</span>
                                                                <Calendar className="w-2.5 h-2.5" />
                                                                <span>{new Date(report.date).toLocaleDateString()}</span>
                                                                {report.project && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="text-[#0052CC]">{report.project.name}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="px-3 py-1 bg-[#E3FCEF] text-[#006644] text-[10px] font-bold rounded-sm flex items-center gap-1.5 uppercase">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            {report.tasksCompleted} Tasks
                                                        </div>
                                                        <div className="px-3 py-1 bg-[#DEEBFF] text-[#0747A6] text-[10px] font-bold rounded-sm flex items-center gap-1.5 uppercase">
                                                            <Clock className="w-3 h-3" />
                                                            {report.hoursWorked}h
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pl-14">
                                                    <div className="bg-[#FAFBFC] p-3 border-l-2 border-[#0052CC] rounded-r-sm">
                                                        <p className="text-[10px] font-bold text-[#6B778C] uppercase mb-1 flex items-center gap-1.5">
                                                            <Target className="w-3 h-3" /> Accomplishments
                                                        </p>
                                                        <p className="text-sm text-[#172B4D] leading-relaxed whitespace-pre-wrap">{report.accomplishments}</p>
                                                    </div>

                                                    {(report.challenges || report.tomorrowPlan) && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {report.challenges && (
                                                                <div className="bg-[#FFFAE6] p-3 border-l-2 border-[#FFAB00] rounded-r-sm">
                                                                    <p className="text-[10px] font-bold text-[#BF2600] uppercase mb-1 flex items-center gap-1.5">
                                                                        <AlertTriangle className="w-3 h-3" /> Challenges
                                                                    </p>
                                                                    <p className="text-xs text-[#172B4D]">{report.challenges}</p>
                                                                </div>
                                                            )}
                                                            {report.tomorrowPlan && (
                                                                <div className="bg-[#F4F5F7] p-3 border-l-2 border-[#42526E] rounded-r-sm">
                                                                    <p className="text-[10px] font-bold text-[#6B778C] uppercase mb-1 flex items-center gap-1.5">
                                                                        <TrendingUp className="w-3 h-3" /> Tactical Plan
                                                                    </p>
                                                                    <p className="text-xs text-[#172B4D]">{report.tomorrowPlan}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {/* Missing Members Tracker */}
                                    {activeTab === 'TEAM' && meta && meta.missingMembers.length > 0 && (
                                        <div className="card-jira p-5 rounded-sm border border-[#FF5630] bg-[#FFF5F2]">
                                            <h3 className="font-bold text-[#BF2600] text-sm mb-4 flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Missing Reports ({meta.missingMembers.length})
                                            </h3>
                                            <div className="space-y-3">
                                                {meta.missingMembers.map((member: any) => (
                                                    <div key={member.id} className="flex items-center justify-between text-xs p-2 bg-white rounded-sm border border-[#FFE7E0]">
                                                        <div>
                                                            <p className="font-bold text-[#172B4D]">{member.name}</p>
                                                            <p className="text-[9px] text-[#6B778C] font-bold uppercase">{member.role}</p>
                                                        </div>
                                                        <XCircle className="w-3.5 h-3.5 text-[#FF5630]" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
