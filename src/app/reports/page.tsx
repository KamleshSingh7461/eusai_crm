"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
    Calendar, CheckCircle2, ChevronLeft, ChevronRight, Download, Filter,
    MoreHorizontal, Plus, Search, User, FileText, AlertTriangle, TrendingUp,
    Users, Clock, CheckCircle, XCircle, PieChart, Briefcase, Activity, Layers, Loader2, BarChart3, Target, ShieldAlert, FileSpreadsheet, X
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';

interface DailyReport {
    id: string;
    userId: string;
    content: string;
    accomplishments: string;
    challenges: string | null;
    tomorrowPlan: string | null;
    tasksCompleted: number;
    hoursWorked: number;
    utilization?: number;
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

}

export default function ReportsPage() {
    const { showToast } = useToast();
    const { data: session } = useSession();
    const userRole = session?.user?.role || '';
    const isDirector = userRole === 'DIRECTOR';
    const isManager = userRole === 'MANAGER';
    const isTeamLeader = userRole === 'TEAM_LEADER';
    const isLeadership = isDirector || isManager || isTeamLeader;

    const [activeTab, setActiveTab] = useState<'MY' | 'TEAM' | 'RESOURCES' | 'KPI'>(
        isDirector || isManager ? 'KPI' : 'MY'
    );

    useEffect(() => {
        // Initial load default is already handled in useState
    }, [isDirector, isManager]);

    const todayStr = new Date().toISOString().split('T')[0];
    const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState<string>(thirtyDaysAgoStr);
    const [endDate, setEndDate] = useState<string>(todayStr);
    const [selectedUser, setSelectedUser] = useState<string>('ALL');
    const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; role: string }>>([]);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [selectedReportForView, setSelectedReportForView] = useState<any | null>(null);

    useEffect(() => {
        fetch('/api/team')
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : (data?.users || []);
                if (Array.isArray(list)) {
                    setTeamMembers(list.map((u: any) => ({ id: u.id, name: u.name, role: u.role })));
                }
            })
            .catch(() => {});
    }, []);

    const [reports, setReports] = useState<DailyReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
    const [meta, setMeta] = useState<any>(null);

    const userOptions = useMemo(() => {
        const rawList = teamMembers.length > 0 ? teamMembers : (() => {
            const userMap = new Map();
            reports.forEach(r => {
                if (r.userId && r.user && !userMap.has(r.userId)) {
                    userMap.set(r.userId, { id: r.userId, name: r.user.name, role: r.user.role });
                }
            });
            return Array.from(userMap.values());
        })();

        // Exclude Directors and Management roles from employee selection
        return rawList.filter((u: any) => u.role !== 'DIRECTOR' && u.role !== 'MANAGEMENT');
    }, [teamMembers, reports]);

    const [resourceData, setResourceData] = useState<any>(null);
    const [kpiData, setKpiData] = useState<KPIData | null>(null);

    useEffect(() => {
        if (session) {
            fetchData();
        }
    }, [session, activeTab, startDate, endDate]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'MY') {
                const res = await fetch(`/api/reports/daily?type=my&startDate=${startDate}&endDate=${endDate}`);
                if (res.ok) {
                    const data = await res.json();
                    setReports(data.reports);
                    setMeta(data.meta);
                }
            } else if (activeTab === 'TEAM') {
                const res = await fetch(`/api/reports/daily?type=team&startDate=${startDate}&endDate=${endDate}`);
                if (res.ok) {
                    const data = await res.json();
                    setReports(data.reports);
                    setMeta(data.meta);
                }
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

    const renderTruncatedCell = (text: string | null, limit: number, report: any, textColorClass: string = "text-[var(--notion-text-primary)]") => {
        if (!text) return <span className="text-[var(--notion-text-tertiary)] italic">-</span>;
        if (text.length <= limit) return <p className={textColorClass}>{text}</p>;
        return (
            <div className="space-y-1">
                <p className={cn("line-clamp-2", textColorClass)} title={text}>
                    {text}
                </p>
                <button
                    type="button"
                    onClick={() => setSelectedReportForView(report)}
                    className="text-[10px] font-bold text-[#2383e2] hover:underline uppercase tracking-wider inline-flex items-center gap-1"
                >
                    Read more →
                </button>
            </div>
        );
    };

    const handleExport = () => {
        showToast("Generating PDF Report...", "info");
        setTimeout(() => {
            window.print();
        }, 500);
    };

    const handleExportCsv = () => {
        if (!filteredReports || filteredReports.length === 0) {
            showToast("No report logs available to export", "error");
            return;
        }

        const headers = [
            "Date",
            "User Name",
            "User Role",
            "Tasks Completed",
            "Hours Worked",
            "Utilization (%)",
            "Accomplishments",
            "Challenges / Impediments",
            "Next Cycle Plan",
            "Project Scope"
        ];

        const csvRows = [headers.join(",")];

        filteredReports.forEach(r => {
            const row = [
                `"${r.date ? new Date(r.date).toLocaleDateString() : ''}"`,
                `"${(r.user?.name || '').replace(/"/g, '""')}"`,
                `"${(r.user?.role || '').replace(/"/g, '""')}"`,
                r.tasksCompleted || 0,
                r.hoursWorked || 0,
                `${r.utilization || 0}%`,
                `"${(r.accomplishments || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                `"${(r.challenges || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                `"${(r.tomorrowPlan || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                `"${(r.project?.name || 'General Operations').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(","));
        });

        const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `EuSai_Daily_Reports_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Spreadsheet exported successfully", "success");
    };

    const filteredReports = reports.filter(r => {
        const matchesUser = selectedUser === 'ALL' || r.userId === selectedUser;
        const matchesEmployeeSearch = !employeeSearchQuery ||
            r.user.name.toLowerCase().includes(employeeSearchQuery.toLowerCase());
        const matchesSearch = !searchQuery ||
            r.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.accomplishments.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
        return matchesUser && matchesEmployeeSearch && matchesSearch;
    });

    const renderKPIDashboard = () => {
        if (!kpiData) return null;
        const { employees, projects, tasks, team } = kpiData;

        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[var(--notion-bg-secondary)] p-5 rounded-sm border border-[var(--notion-border-default)] hover:bg-[var(--notion-bg-tertiary)] transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase">Task Velocity</p>
                            <TrendingUp className="w-4 h-4 text-[#36B37E] group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-3xl font-bold text-[var(--notion-text-primary)]">{team.velocity}</p>
                        <p className="text-[10px] text-[var(--notion-text-tertiary)] mt-1">Tasks / 7 Days</p>
                    </div>
                    <div className="bg-[var(--notion-bg-secondary)] p-5 rounded-sm border border-[var(--notion-border-default)] hover:bg-[var(--notion-bg-tertiary)] transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase">Avg Efficiency</p>
                            <Activity className="w-4 h-4 text-[#2383e2] group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-3xl font-bold text-[var(--notion-text-primary)]">{employees.avgCompletion}%</p>
                        <p className="text-[10px] text-[var(--notion-text-tertiary)] mt-1">Task Completion Rate</p>
                    </div>
                    <div className="bg-[var(--notion-bg-secondary)] p-5 rounded-sm border border-[var(--notion-border-default)] hover:bg-[var(--notion-bg-tertiary)] transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase">Project Risks</p>
                            <AlertTriangle className="w-4 h-4 text-[#ef4444] group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-3xl font-bold text-[var(--notion-text-primary)]">{projects.avgRisk}</p>
                        <p className="text-[10px] text-[var(--notion-text-tertiary)] mt-1">Avg Risk Score</p>
                    </div>
                    <div className="bg-[var(--notion-bg-secondary)] p-5 rounded-sm border border-[var(--notion-border-default)] hover:bg-[var(--notion-bg-tertiary)] transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase">Resolution Time</p>
                            <Clock className="w-4 h-4 text-[#a855f7] group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-3xl font-bold text-[var(--notion-text-primary)]">{tasks.avgResolutionTime}d</p>
                        <p className="text-[10px] text-[var(--notion-text-tertiary)] mt-1">Avg Task Turnaround</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">


                    <div className="bg-[var(--notion-bg-secondary)] p-6 rounded-sm border border-[var(--notion-border-default)]">
                        <h3 className="font-bold text-[#ef4444] mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> Strategic Risks
                        </h3>
                        <div className="space-y-3">
                            {kpiData.risks?.length === 0 ? (
                                <p className="text-sm text-[var(--notion-text-tertiary)] italic">No critical risks identified.</p>
                            ) : (
                                kpiData.risks?.map((risk: any) => (
                                    <div key={risk.id} className="p-2 border border-[#7f1d1d]/30 bg-[#450a0a]/20 rounded-sm flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" />
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-[var(--notion-text-primary)] truncate">{risk.title}</p>
                                            <div className="flex gap-2 text-[10px] items-center mt-1">
                                                <span className="font-bold text-[#ef4444] uppercase bg-[#7f1d1d]/30 px-1 rounded-sm">{risk.severity}</span>
                                                <span className="text-[var(--notion-text-tertiary)] truncate max-w-[100px]">{risk.source}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-[var(--notion-bg-secondary)] p-6 rounded-sm border border-[var(--notion-border-default)]">
                        <h3 className="font-bold text-[var(--notion-text-primary)] mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-[#2383e2]" /> Department Pulse
                        </h3>
                        <div className="space-y-3">
                            {kpiData.departments?.map((dept: any) => (
                                <div key={dept.name} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-[var(--notion-text-secondary)]">{dept.name}</p>
                                        <p className="text-[9px] text-[var(--notion-text-tertiary)] font-bold uppercase">{dept.headcount} Members</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-[var(--notion-bg-tertiary)] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#36B37E]" style={{ width: `${dept.avgEfficiency}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-[var(--notion-text-secondary)] w-8 text-right">{dept.avgEfficiency}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[var(--notion-bg-secondary)] p-6 rounded-sm border border-[var(--notion-border-default)]">
                        <h3 className="font-bold text-[var(--notion-text-primary)] mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#2383e2]" /> Employee Performance (Top 5)
                        </h3>
                        <div className="space-y-4">
                            {employees.topPerformers.map((emp: any) => (
                                <Link href={`/team/${emp.id}`} key={emp.id} className="flex items-center justify-between group hover:bg-[var(--notion-bg-tertiary)] p-2 rounded-sm transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#2383e2]/20 text-[#2383e2] flex items-center justify-center font-bold text-xs ring-2 ring-transparent group-hover:ring-[#2383e2] transition-all">
                                            {emp.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[var(--notion-text-primary)] group-hover:text-[#2383e2]">{emp.name}</p>
                                            <div className="flex gap-2">
                                                <span className="text-[10px] text-[var(--notion-text-tertiary)]">{emp.activeCount} Active Tasks</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-[#36B37E]">{emp.completionRate}%</p>
                                        <p className="text-[9px] text-[var(--notion-text-tertiary)] uppercase">Efficiency</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[var(--notion-bg-secondary)] p-6 rounded-sm border border-[var(--notion-border-default)]">
                        <h3 className="font-bold text-[var(--notion-text-primary)] mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-[#2383e2]" /> Project Health & Risks
                        </h3>
                        <div className="space-y-3">
                            {projects.list.slice(0, 5).map((p: any) => (
                                <div key={p.id} className="p-3 border border-[var(--notion-border-default)] rounded-sm hover:bg-[var(--notion-bg-tertiary)] transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-bold text-[var(--notion-text-secondary)]">{p.name}</p>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase",
                                            p.riskScore > 20 ? "bg-red-500/20 text-red-400" : p.riskScore > 10 ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"
                                        )}>
                                            Risk: {p.riskScore}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[var(--notion-bg-tertiary)] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#2383e2]" style={{ width: `${p.progress}%` }} />
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[10px] text-[var(--notion-text-tertiary)]">Progress</span>
                                        <span className="text-[10px] font-bold text-[var(--notion-text-secondary)]">{p.progress}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--notion-bg-secondary)] p-6 rounded-sm border border-[var(--notion-border-default)]">
                    <h3 className="font-bold text-[var(--notion-text-primary)] mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#2383e2]" /> Global Task Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="p-4 bg-[var(--notion-bg-tertiary)] rounded-sm text-center">
                            <p className="text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase mb-1">Completion</p>
                            <div className="text-2xl font-bold text-[var(--notion-text-primary)] mb-2">{tasks.completionRate}%</div>
                            <div className="w-full h-1 bg-[var(--notion-border-default)] rounded-full">
                                <div className="h-full bg-[#36B37E]" style={{ width: `${tasks.completionRate}%` }} />
                            </div>
                        </div>
                        <div className="p-4 bg-[#450a0a]/20 rounded-sm text-center border border-[#7f1d1d]/30">
                            <p className="text-[10px] font-bold text-[#ef4444] uppercase mb-1">Overdue</p>
                            <div className="text-2xl font-bold text-[#ef4444] mb-2">{tasks.overdue}</div>
                            <p className="text-[9px] text-[#fca5a5]">Tasks missed deadline</p>
                        </div>
                        <div className="p-4 bg-[var(--notion-bg-tertiary)] rounded-sm text-center">
                            <p className="text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase mb-1">Total Volume</p>
                            <div className="text-2xl font-bold text-[var(--notion-text-primary)] mb-2">{tasks.total}</div>
                            <p className="text-[9px] text-[var(--notion-text-tertiary)]">Tasks recorded</p>
                        </div>
                        <div className="p-4 bg-[var(--notion-bg-tertiary)] rounded-sm text-center">
                            <p className="text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase mb-1">Active Issues</p>
                            <div className="text-2xl font-bold text-[var(--notion-text-primary)] mb-2">{team.activeIssues}</div>
                            <p className="text-[9px] text-[var(--notion-text-tertiary)]">Reported blockers</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--notion-bg-secondary)] p-6 rounded-sm border border-[var(--notion-border-default)]">
                    <h3 className="font-bold text-[var(--notion-text-primary)] mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#2383e2]" /> Performance Directory
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[var(--notion-border-default)]">
                                    <th className="pb-2 text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase">Employee</th>
                                    <th className="pb-2 text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase">Role / Dept</th>
                                    <th className="pb-2 text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase text-center">Efficiency</th>
                                    <th className="pb-2 text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase text-center">On-Time Rate</th>
                                    <th className="pb-2 text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase text-center">Active Objectives</th>
                                    <th className="pb-2 text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.list?.map((emp: any) => (
                                    <tr key={emp.id} className="border-b border-[var(--notion-border-default)] hover:bg-[var(--notion-bg-hover)] group transition-colors">
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-[#2383e2]/20 text-[#2383e2] flex items-center justify-center font-bold text-xs">
                                                    {emp.name[0]}
                                                </div>
                                                <span className="text-sm font-bold text-[var(--notion-text-secondary)]">{emp.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-[var(--notion-text-secondary)]">{emp.role}</span>
                                                <span className="text-[10px] text-[var(--notion-text-tertiary)]">{emp.department}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                                emp.completionRate >= 80 ? "bg-green-500/20 text-green-400" :
                                                    emp.completionRate >= 50 ? "bg-orange-500/20 text-orange-400" : "bg-red-500/20 text-red-400"
                                            )}>
                                                {emp.completionRate}%
                                            </span>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className="text-sm font-mono text-[var(--notion-text-secondary)]">{emp.onTimeRate}%</span>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className="text-xs font-bold text-[var(--notion-text-secondary)]">{emp.activeCount} Objectives</span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <Link
                                                href={`/team/${emp.id}`}
                                                className="text-xs font-bold text-[#2383e2] hover:underline flex items-center justify-end gap-1 ml-auto"
                                            >
                                                Intelligence Profile <ChevronRight className="w-3 h-3" />
                                            </Link>
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



    const renderResourceReport = () => {
        if (!resourceData) return null;
        const { stats, team } = resourceData;

        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[var(--notion-bg-secondary)] p-5 rounded-sm border border-[var(--notion-border-default)]">
                        <p className="text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase mb-1">Active Tasks</p>
                        <p className="text-2xl font-bold text-[var(--notion-text-primary)]">{stats.totalActiveTasks}</p>
                    </div>
                    <div className="bg-[var(--notion-bg-secondary)] p-5 rounded-sm border border-[var(--notion-border-default)]">
                        <p className="text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase mb-1">Avg Utilization</p>
                        <p className="text-2xl font-bold text-[var(--notion-text-primary)]">{stats.avgUtilization}%</p>
                        <div className="w-full h-1 bg-[var(--notion-bg-tertiary)] mt-2 rounded-full overflow-hidden">
                            <div className="h-full bg-[#a855f7]" style={{ width: `${stats.avgUtilization}%` }} />
                        </div>
                    </div>
                    <div className="bg-[var(--notion-bg-secondary)] p-5 rounded-sm border border-[var(--notion-border-default)]">
                        <p className="text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase mb-1">Overdue Items</p>
                        <p className="text-2xl font-bold text-red-500">{stats.totalOverdue}</p>
                    </div>
                </div>

                <div className="bg-[var(--notion-bg-secondary)] p-6 rounded-sm border border-[var(--notion-border-default)]">
                    <h3 className="font-bold text-[var(--notion-text-primary)] mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#2383e2]" /> Workforce Utilization
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {team.map((member: any) => (
                            <div key={member.id} className="p-4 border border-[var(--notion-border-default)] rounded-sm hover:border-[#2383e2] transition-colors relative bg-[var(--notion-bg-tertiary)]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-[#2383e2]/20 flex items-center justify-center text-[#2383e2] font-bold text-xs overflow-hidden">
                                        {member.image ? <img src={member.image} alt={member.name} className="w-full h-full object-cover" /> : member.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[var(--notion-text-primary)] text-sm">{member.name}</p>
                                        <p className="text-[10px] text-[var(--notion-text-tertiary)] uppercase font-bold">{member.role}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-xl font-bold text-[var(--notion-text-primary)]">{member.metrics.utilization}%</p>
                                        <p className="text-[9px] text-[var(--notion-text-tertiary)] uppercase">Load</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--notion-text-tertiary)]">Active Tasks</span>
                                        <span className="font-bold text-[var(--notion-text-secondary)]">{member.metrics.activeTasks}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--notion-text-tertiary)]">High Priority</span>
                                        <span className="font-bold text-orange-400">{member.metrics.highPriority}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--notion-text-tertiary)]">Overdue</span>
                                        <span className="font-bold text-red-500">{member.metrics.overdue}</span>
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
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12 p-4 md:p-8 min-h-screen bg-[var(--notion-bg-primary)] text-[var(--notion-text-primary)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--notion-text-primary)] mb-1 md:mb-2 font-display">Mission Intelligence</h1>
                    <p className="text-[var(--notion-text-tertiary)] text-sm md:text-base">Strategic oversight of tactical execution and operational risks.</p>
                </div>
                <div className="flex flex-col xs:flex-row gap-2">
                    {!isDirector && (
                        <Link
                            href="/reports/submit"
                            className="bg-[#2383e2] hover:bg-[#1a6fcc] text-white px-4 py-2 rounded-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm text-sm w-full xs:w-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Submit Report
                        </Link>
                    )}
                    <button
                        onClick={handleExportCsv}
                        className="bg-[#36B37E] hover:bg-[#00875A] text-white px-4 py-2 rounded-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm text-sm w-full xs:w-auto"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export CSV Sheet
                    </button>
                    <button
                        onClick={handleExport}
                        className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] hover:bg-[var(--notion-bg-tertiary)] text-[var(--notion-text-primary)] px-4 py-2 rounded-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm text-sm w-full xs:w-auto"
                    >
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-6 md:gap-8 border-b border-[var(--notion-border-default)] overflow-x-auto no-scrollbar">
                {(!isDirector && !isManager) && (
                    <button
                        onClick={() => setActiveTab('MY')}
                        className={cn(
                            "pb-4 text-sm font-bold transition-all relative whitespace-nowrap",
                            activeTab === 'MY' ? "text-[#2383e2] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#2383e2]" : "text-[var(--notion-text-tertiary)] hover:text-[var(--notion-text-primary)]"
                        )}
                    >
                        Personnel Logs
                    </button>
                )}
                {(isLeadership) && (
                    <>
                        {(isDirector || isManager) && (
                            <button
                                onClick={() => setActiveTab('KPI')}
                                className={cn(
                                    "pb-4 text-sm font-bold transition-all relative whitespace-nowrap",
                                    activeTab === 'KPI' ? "text-[#2383e2] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#2383e2]" : "text-[var(--notion-text-tertiary)] hover:text-[var(--notion-text-primary)]"
                                )}
                            >
                                Performance KPIs
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('TEAM')}
                            className={cn(
                                "pb-4 text-sm font-bold transition-all relative whitespace-nowrap",
                                activeTab === 'TEAM' ? "text-[#2383e2] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#2383e2]" : "text-[var(--notion-text-tertiary)] hover:text-[var(--notion-text-primary)]"
                            )}
                        >
                            Team Intelligence
                        </button>
                        {(isDirector || isManager) && (
                            <button
                                onClick={() => setActiveTab('RESOURCES')}
                                className={cn(
                                    "pb-4 text-sm font-bold transition-all relative whitespace-nowrap",
                                    activeTab === 'RESOURCES' ? "text-[#2383e2] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#2383e2]" : "text-[var(--notion-text-tertiary)] hover:text-[var(--notion-text-primary)]"
                                )}
                            >
                                Resource Utilization
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm">
                    <Loader2 className="w-8 h-8 text-[#2383e2] animate-spin mb-4" />
                    <p className="text-[var(--notion-text-tertiary)] font-bold text-sm uppercase tracking-widest">Gaining Intelligence...</p>
                </div>
            ) : (
                <>
                    {/* Render specific views based on activeTab */}
                    {activeTab === 'KPI' && renderKPIDashboard()}

{activeTab === 'RESOURCES' && renderResourceReport()}
                    {['MY', 'TEAM'].includes(activeTab) && (
                        <div className="space-y-6">
                            {/* Controls & Date Filter Bar */}
                            <div className="p-4 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* General Search Bar */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--notion-text-tertiary)]" />
                                        <input
                                            placeholder="Search content or project..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm py-1.5 pl-9 pr-3 text-xs text-[var(--notion-text-primary)] focus:outline-none focus:ring-1 focus:ring-[#2383e2] w-48 placeholder-[var(--notion-text-disabled)]"
                                        />
                                    </div>

                                    {/* Employee Quick Search Box */}
                                    <div className="relative">
                                        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2383e2]" />
                                        <input
                                            placeholder="Filter by Employee Name..."
                                            value={employeeSearchQuery}
                                            onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                                            className="bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm py-1.5 pl-8 pr-3 text-xs text-[var(--notion-text-primary)] focus:outline-none focus:ring-1 focus:ring-[#2383e2] w-48 placeholder-[var(--notion-text-disabled)]"
                                        />
                                    </div>

                                    {/* Personnel / Employee Filter Dropdown */}
                                    {userOptions.length > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <select
                                                value={selectedUser}
                                                onChange={(e) => setSelectedUser(e.target.value)}
                                                className="bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm px-2 py-1.5 text-xs text-[var(--notion-text-primary)] focus:outline-none font-medium cursor-pointer max-w-[170px] truncate"
                                            >
                                                <option value="ALL">All Employees</option>
                                                {userOptions.map((m: any) => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.name} ({m.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Date Range Controls */}
                                    <div className="flex items-center gap-2 text-xs">
                                        <Calendar className="w-4 h-4 text-[#2383e2]" />
                                        <span className="font-bold text-[var(--notion-text-tertiary)]">Range:</span>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm px-2 py-1 text-xs text-[var(--notion-text-primary)] focus:outline-none"
                                        />
                                        <span className="text-[var(--notion-text-tertiary)]">to</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm px-2 py-1 text-xs text-[var(--notion-text-primary)] focus:outline-none"
                                        />
                                    </div>

                                    {/* Presets */}
                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const now = new Date();
                                                const start = new Date();
                                                start.setDate(now.getDate() - 7);
                                                setStartDate(start.toISOString().split('T')[0]);
                                                setEndDate(now.toISOString().split('T')[0]);
                                            }}
                                            className="px-2 py-1 text-[#2383e2] hover:bg-[#2383e2]/10 rounded-sm transition-colors"
                                        >
                                            7D
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const now = new Date();
                                                const start = new Date();
                                                start.setDate(now.getDate() - 30);
                                                setStartDate(start.toISOString().split('T')[0]);
                                                setEndDate(now.toISOString().split('T')[0]);
                                            }}
                                            className="px-2 py-1 text-[#2383e2] hover:bg-[#2383e2]/10 rounded-sm transition-colors"
                                        >
                                            30D
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const now = new Date();
                                                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                                                setStartDate(start.toISOString().split('T')[0]);
                                                setEndDate(now.toISOString().split('T')[0]);
                                            }}
                                            className="px-2 py-1 text-[#2383e2] hover:bg-[#2383e2]/10 rounded-sm transition-colors"
                                        >
                                            This Month
                                        </button>
                                    </div>
                                </div>

                                {/* View Switcher */}
                                <div className="flex items-center gap-2 border border-[var(--notion-border-default)] rounded-sm p-0.5 bg-[var(--notion-bg-primary)]">
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={cn("px-3 py-1 text-[10px] font-bold uppercase rounded-sm transition-all", viewMode === 'table' ? "bg-[#2383e2] text-white" : "text-[var(--notion-text-tertiary)] hover:text-[var(--notion-text-primary)]")}
                                    >
                                        Table View
                                    </button>
                                    <button
                                        onClick={() => setViewMode('cards')}
                                        className={cn("px-3 py-1 text-[10px] font-bold uppercase rounded-sm transition-all", viewMode === 'cards' ? "bg-[#2383e2] text-white" : "text-[var(--notion-text-tertiary)] hover:text-[var(--notion-text-primary)]")}
                                    >
                                        Feed View
                                    </button>
                                </div>
                            </div>



                            {/* Reports Tabular or Cards Display */}
                            {filteredReports.length === 0 ? (
                                <div className="p-16 text-center bg-[var(--notion-bg-secondary)] border-2 border-dashed border-[var(--notion-border-default)] rounded-sm text-[var(--notion-text-tertiary)]">
                                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                    <h3 className="text-xl font-bold text-[var(--notion-text-primary)] mb-2">No Intel Found</h3>
                                    <p className="text-sm max-w-sm mx-auto">Either no reports have been filed for this window, or they don't match your search parameters.</p>
                                </div>
                            ) : viewMode === 'table' ? (
                                <div className="border border-[var(--notion-border-default)] rounded-sm overflow-x-auto bg-[var(--notion-bg-secondary)] shadow-sm">
                                    <table className="w-full text-left border-collapse min-w-[850px]">
                                        <thead>
                                            <tr className="bg-[var(--notion-bg-tertiary)] border-b border-[var(--notion-border-default)]">
                                                <th className="px-4 py-3 text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider">Date</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider">Personnel</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider text-center">Tasks</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider text-center">Hours</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider text-center">Utilization</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider">Accomplishments</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider">Challenges</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider">Next Plan</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase tracking-wider">Project</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--notion-border-default)] text-xs">
                                            {filteredReports.map((report: DailyReport) => (
                                                <tr key={report.id} className="hover:bg-[var(--notion-bg-tertiary)] transition-colors">
                                                    <td className="px-4 py-3 font-bold text-[var(--notion-text-primary)] whitespace-nowrap">
                                                        {new Date(report.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-[var(--notion-text-primary)] whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-[#2383e2] text-white flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0">
                                                                {report.user.image ? <img src={report.user.image} alt={report.user.name} className="w-full h-full object-cover" /> : report.user.name[0]}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <Link href={`/team/${report.userId}`} className="hover:text-[#2383e2] transition-colors leading-tight font-bold">
                                                                    {report.user.name}
                                                                </Link>
                                                                <span className="text-[9px] font-bold text-[var(--notion-text-tertiary)] uppercase">{report.user.role}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-[#2383e2]">
                                                        {report.tasksCompleted || 0}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-medium text-[var(--notion-text-secondary)]">
                                                        {report.hoursWorked || 0}h
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                                            (report.utilization || 0) >= 80 ? "bg-[#36B37E]/20 text-[#36B37E]" :
                                                                (report.utilization || 0) >= 50 ? "bg-[#FFAB00]/20 text-[#FFAB00]" : "bg-[#FF5630]/20 text-[#FF5630]"
                                                        )}>
                                                            {report.utilization || 0}%
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-[var(--notion-text-primary)] max-w-[220px]">
                                                        {renderTruncatedCell(report.accomplishments, 75, report, "text-[var(--notion-text-primary)]")}
                                                    </td>
                                                    <td className="px-4 py-3 text-[#FF5630] max-w-[180px]">
                                                        {renderTruncatedCell(report.challenges, 60, report, "text-[#FF5630]")}
                                                    </td>
                                                    <td className="px-4 py-3 text-[var(--notion-text-secondary)] max-w-[180px]">
                                                        {renderTruncatedCell(report.tomorrowPlan, 60, report, "text-[var(--notion-text-secondary)]")}
                                                    </td>
                                                    <td className="px-4 py-3 text-[var(--notion-text-tertiary)] font-bold text-[10px] uppercase whitespace-nowrap">
                                                        {report.project?.name || 'General Operations'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredReports.map((report: DailyReport) => (
                                        <div key={report.id} className="p-5 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm hover:border-[#2383e2] transition-all group relative">
                                            {report.challenges && report.challenges.trim().length > 10 && (
                                                <div className="absolute top-0 left-0 w-1 h-full bg-[#FF5630]" />
                                            )}

                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        {report.user.image ? (
                                                            <img src={report.user.image} alt={report.user.name} className="w-12 h-12 rounded-sm object-cover border border-[var(--notion-border-default)]" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-sm bg-[#2383e2] flex items-center justify-center text-white text-lg font-bold">
                                                                {report.user.name[0]}
                                                            </div>
                                                        )}
                                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--notion-bg-secondary)] flex items-center justify-center ${report.challenges ? 'bg-[#FFAB00]' : 'bg-[#36B37E]'}`}>
                                                            {report.challenges ? <AlertTriangle className="w-2 h-2 text-white" /> : <CheckCircle className="w-2 h-2 text-white" />}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Link href={`/team/${report.userId}`} className="font-bold text-[var(--notion-text-primary)] hover:text-[#2383e2] transition-colors">{report.user.name}</Link>
                                                        <div className="flex items-center gap-2 text-[10px] text-[var(--notion-text-tertiary)] font-bold uppercase tracking-tighter">
                                                            <span>{report.user.role}</span>
                                                            <span>•</span>
                                                            <Calendar className="w-2.5 h-2.5" />
                                                            <span>{new Date(report.date).toLocaleDateString()}</span>
                                                            {report.project && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-[#2383e2]">{report.project.name}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="px-3 py-1 bg-[#36B37E]/20 text-[#36B37E] text-[10px] font-bold rounded-sm flex items-center gap-1.5 uppercase">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        {report.tasksCompleted} Tasks
                                                    </div>
                                                    <div className="px-3 py-1 bg-[#2383e2]/20 text-[#2383e2] text-[10px] font-bold rounded-sm flex items-center gap-1.5 uppercase">
                                                        <Clock className="w-3 h-3" />
                                                        {report.hoursWorked}h
                                                    </div>
                                                    {report.utilization !== undefined && report.utilization !== null && (
                                                        <div className="px-3 py-1 bg-[#a855f7]/20 text-[#a855f7] text-[10px] font-bold rounded-sm flex items-center gap-1.5 uppercase">
                                                            <Activity className="w-3 h-3" />
                                                            {report.utilization}% Util
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-4 pl-14">
                                                <div className="bg-[var(--notion-bg-tertiary)] p-3 border-l-2 border-[#2383e2] rounded-r-sm">
                                                    <p className="text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase mb-1 flex items-center gap-1.5">
                                                        <Target className="w-3 h-3" /> Accomplishments
                                                    </p>
                                                    <p className="text-sm text-[var(--notion-text-primary)] leading-relaxed whitespace-pre-wrap">{report.accomplishments}</p>
                                                </div>

                                                {(report.challenges || report.tomorrowPlan) && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {report.challenges && (
                                                            <div className="bg-[#FFAB00]/10 p-3 border-l-2 border-[#FFAB00] rounded-r-sm">
                                                                <p className="text-[10px] font-bold text-[#FFAB00] uppercase mb-1 flex items-center gap-1.5">
                                                                    <AlertTriangle className="w-3 h-3" /> Challenges
                                                                </p>
                                                                <p className="text-xs text-[var(--notion-text-primary)]">{report.challenges}</p>
                                                            </div>
                                                        )}
                                                        {report.tomorrowPlan && (
                                                            <div className="bg-[var(--notion-bg-tertiary)] p-3 border-l-2 border-[var(--notion-text-tertiary)] rounded-r-sm">
                                                                <p className="text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase mb-1 flex items-center gap-1.5">
                                                                    <TrendingUp className="w-3 h-3" /> Tactical Plan
                                                                </p>
                                                                <p className="text-xs text-[var(--notion-text-primary)]">{report.tomorrowPlan}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
            {/* Report Full Text Detail Modal */}
            {selectedReportForView && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedReportForView(null)}>
                    <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-md max-w-xl w-full p-6 space-y-6 shadow-2xl relative text-[var(--notion-text-primary)] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-[var(--notion-border-default)] pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-[#2383e2]/20 text-[#2383e2] flex items-center justify-center font-bold">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--notion-text-primary)] uppercase tracking-wider">
                                        Daily Report ({new Date(selectedReportForView.date).toLocaleDateString()})
                                    </h3>
                                    <span className="text-[10px] font-bold text-[var(--notion-text-tertiary)] uppercase tracking-widest">
                                        {selectedReportForView.user?.name} ({selectedReportForView.user?.role})
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedReportForView(null)}
                                className="p-1.5 rounded-full hover:bg-[var(--notion-bg-tertiary)] text-[var(--notion-text-tertiary)] hover:text-[var(--notion-text-primary)] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div>
                                <h4 className="text-[10px] font-bold text-[#2383e2] uppercase tracking-widest mb-1.5">Accomplishments</h4>
                                <div className="bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] p-4 rounded-sm text-xs text-[var(--notion-text-primary)] whitespace-pre-wrap leading-relaxed font-medium">
                                    {selectedReportForView.accomplishments || "No details provided."}
                                </div>
                            </div>

                            {selectedReportForView.challenges && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-[#FF5630] uppercase tracking-widest mb-1.5">Challenges & Impediments</h4>
                                    <div className="bg-[#FF5630]/10 border border-[#FF5630]/30 p-4 rounded-sm text-xs text-[#FF5630] whitespace-pre-wrap leading-relaxed font-medium">
                                        {selectedReportForView.challenges}
                                    </div>
                                </div>
                            )}

                            {selectedReportForView.tomorrowPlan && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-[#36B37E] uppercase tracking-widest mb-1.5">Next Cycle Plan</h4>
                                    <div className="bg-[#36B37E]/10 border border-[#36B37E]/30 p-4 rounded-sm text-xs text-[#36B37E] whitespace-pre-wrap leading-relaxed font-medium">
                                        {selectedReportForView.tomorrowPlan}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t border-[var(--notion-border-default)] pt-4 text-xs font-bold text-[var(--notion-text-tertiary)]">
                            <div className="flex items-center gap-4">
                                <span>Tasks: <strong className="text-[#2383e2]">{selectedReportForView.tasksCompleted}</strong></span>
                                <span>Hours: <strong className="text-[var(--notion-text-primary)]">{selectedReportForView.hoursWorked}h</strong></span>
                                <span>Utilization: <strong className="text-[#36B37E]">{selectedReportForView.utilization}%</strong></span>
                            </div>
                            <button
                                onClick={() => setSelectedReportForView(null)}
                                className="px-4 py-2 bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] hover:bg-[var(--notion-bg-primary)] text-[var(--notion-text-primary)] rounded-sm text-xs font-bold uppercase transition-all shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
