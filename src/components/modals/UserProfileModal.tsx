'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
    X,
    Mail,
    Shield,
    Briefcase,
    TrendingUp,
    TrendingDown,
    Minus,
    CheckCircle2,
    Clock,
    User as UserIcon,
    GitMerge,
    ChevronRight,
    Loader2,
    FileSpreadsheet,
    Calendar,
    Download,
    Filter,
    FileText,
    Activity,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

interface UserProfileModalProps {
    userId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
    const { data: session } = useSession();
    const currentUserRole = (session?.user as any)?.role || '';
    const isSenior = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(currentUserRole);

    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'reports'>('overview');

    // Reports & Date Range Filter state
    const [reports, setReports] = useState<any[]>([]);
    const [isLoadingReports, setIsLoadingReports] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];
    const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState<string>(thirtyDaysAgoStr);
    const [endDate, setEndDate] = useState<string>(todayStr);
    const [selectedReportForView, setSelectedReportForView] = useState<any | null>(null);

    const renderTruncatedCell = (text: string | null, limit: number, report: any, textColorClass: string = "text-[#172B4D]") => {
        if (!text) return <span className="text-[#97A0AF] italic">-</span>;
        if (text.length <= limit) return <p className={textColorClass}>{text}</p>;
        return (
            <div className="space-y-1">
                <p className={cn("line-clamp-2", textColorClass)} title={text}>
                    {text}
                </p>
                <button
                    type="button"
                    onClick={() => setSelectedReportForView(report)}
                    className="text-[10px] font-bold text-[#0052CC] hover:underline uppercase tracking-wider inline-flex items-center gap-1"
                >
                    Read more →
                </button>
            </div>
        );
    };

    useEffect(() => {
        if (isOpen && userId) {
            fetchUserDetails();
            if (isSenior) {
                fetchUserReports(thirtyDaysAgoStr, todayStr);
            }
        }
    }, [isOpen, userId]);

    const fetchUserDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/team');
            if (res.ok) {
                const data = await res.json();
                const foundUser = data.users.find((u: any) => u.id === userId);
                setUser(foundUser);
            }
        } catch (error) {
            console.error('Failed to fetch user details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserReports = async (start: string, end: string) => {
        if (!userId) return;
        setIsLoadingReports(true);
        try {
            const query = new URLSearchParams({
                userId,
                startDate: start,
                endDate: end
            });
            const res = await fetch(`/api/reports/daily?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setReports(data.reports || []);
            }
        } catch (error) {
            console.error('Failed to fetch user daily reports:', error);
        } finally {
            setIsLoadingReports(false);
        }
    };

    const handleApplyDateFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        fetchUserReports(startDate, endDate);
    };

    const handleQuickPreset = (preset: '7days' | '30days' | 'thisMonth' | 'allTime') => {
        const now = new Date();
        let start = new Date();

        if (preset === '7days') {
            start.setDate(now.getDate() - 7);
        } else if (preset === '30days') {
            start.setDate(now.getDate() - 30);
        } else if (preset === 'thisMonth') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (preset === 'allTime') {
            start = new Date(2025, 0, 1);
        }

        const startS = start.toISOString().split('T')[0];
        const endS = now.toISOString().split('T')[0];

        setStartDate(startS);
        setEndDate(endS);
        fetchUserReports(startS, endS);
    };

    // Export Reports to Spreadsheet CSV
    const exportToCsv = () => {
        if (!reports || reports.length === 0) return;

        const headers = [
            "Date",
            "User Name",
            "Tasks Completed",
            "Hours Worked",
            "Utilization (%)",
            "Accomplishments",
            "Challenges / Impediments",
            "Next Cycle Plan",
            "Project Scope",
            "Submitted Timestamp"
        ];

        const csvRows = [headers.join(",")];

        reports.forEach(r => {
            const row = [
                `"${r.date ? new Date(r.date).toLocaleDateString() : ''}"`,
                `"${(user?.name || r.user?.name || '').replace(/"/g, '""')}"`,
                r.tasksCompleted || 0,
                r.hoursWorked || 0,
                `${r.utilization || 0}%`,
                `"${(r.accomplishments || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                `"${(r.challenges || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                `"${(r.tomorrowPlan || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                `"${(r.project?.name || 'General Operations').replace(/"/g, '""')}"`,
                `"${r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ''}"`
            ];
            csvRows.push(row.join(","));
        });

        const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${user?.name || 'Employee'}_Daily_Reports_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'DIRECTOR': return 'bg-[#EAE6FF] text-[#403294]';
            case 'MANAGER': return 'bg-[#DEEBFF] text-[#0052CC]';
            case 'TEAM_LEADER': return 'bg-[#E3FCEF] text-[#006644]';
            case 'EMPLOYEE': return 'bg-[#DFE1E6] text-[#172B4D]';
            default: return 'bg-[#EBECF0] text-[#172B4D]';
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-[#DFE1E6] flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0052CC] flex items-center justify-center text-white shadow-md">
                            <UserIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#172B4D]">{user?.name || 'Team Member Profile'}</h3>
                            <p className="text-xs text-[#6B778C]">Strategic performance and daily mission logs</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-[#EBECF0] rounded-md text-[#6B778C] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub-Header Navigation Tabs */}
                {isSenior && user && (
                    <div className="flex border-b border-[#DFE1E6] bg-[#FAFBFC] px-6 gap-4">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={cn(
                                "py-3 px-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all",
                                activeTab === 'overview'
                                    ? "border-[#0052CC] text-[#0052CC]"
                                    : "border-transparent text-[#6B778C] hover:text-[#172B4D]"
                            )}
                        >
                            <Activity className="w-4 h-4" /> Profile & Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={cn(
                                "py-3 px-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all",
                                activeTab === 'reports'
                                    ? "border-[#0052CC] text-[#0052CC]"
                                    : "border-transparent text-[#6B778C] hover:text-[#172B4D]"
                            )}
                        >
                            <FileSpreadsheet className="w-4 h-4" /> Reports Ledger ({reports.length})
                        </button>
                    </div>
                )}

                {/* Main Body */}
                <div className="p-0 overflow-y-auto flex-1 bg-white">
                    {isLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[#0052CC]" />
                            <p className="text-sm font-medium text-[#6B778C]">Synchronizing profile data...</p>
                        </div>
                    ) : !user ? (
                        <div className="p-20 text-center">
                            <p className="text-[#6B778C]">User intelligence not found. They may have been unassigned.</p>
                        </div>
                    ) : activeTab === 'overview' ? (
                        <div className="divide-y divide-[#DFE1E6]">
                            {/* Identity Section */}
                            <div className="p-8 bg-white flex flex-col md:flex-row gap-8">
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 rounded-full bg-[#DEEBFF] border-4 border-white shadow-md flex items-center justify-center text-[#0052CC] text-3xl font-bold overflow-hidden">
                                        <Avatar src={user.image} alt={user.name} fallback={user.name?.charAt(0) || 'U'} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-2xl font-bold text-[#172B4D]">{user.name}</h2>
                                            <span className={cn("px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase", getRoleColor(user.role))}>
                                                {user.role}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm text-[#6B778C] font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Mail className="w-4 h-4" />
                                                {user.email}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Briefcase className="w-4 h-4" />
                                                {user.department || 'General Operations'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-sm border border-[#DFE1E6] bg-[#FAFBFC]">
                                            <div className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-2 flex items-center justify-between">
                                                Performance
                                                {user.performanceTrend === 'UP' && <TrendingUp className="w-3 h-3 text-[#36B37E]" />}
                                                {user.performanceTrend === 'DOWN' && <TrendingDown className="w-3 h-3 text-[#FF5630]" />}
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-bold text-[#172B4D]">{user.performanceScore}%</span>
                                                <span className="text-xs font-bold text-[#36B37E]">Active Score</span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-sm border border-[#DFE1E6] bg-[#FAFBFC]">
                                            <div className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-2">Rank</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-bold text-[#0052CC]">#{user.rank || 'N/A'}</span>
                                                <span className="text-xs font-bold text-[#6B778C]">Company Wide</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hierarchy Section */}
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#FAFBFC]/50">
                                <div>
                                    <h4 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <GitMerge className="w-3.5 h-3.5" />
                                        Reporting Line
                                    </h4>
                                    {user.manager ? (
                                        <div className="flex items-center gap-3 p-3 bg-white border border-[#DFE1E6] rounded-sm group hover:border-[#0052CC] transition-colors cursor-default">
                                            <div className="w-8 h-8 rounded-full bg-[#EBECF0] flex items-center justify-center text-[10px] font-bold">
                                                {user.manager.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-[#172B4D]">{user.manager.name}</div>
                                                <div className="text-[10px] text-[#6B778C]">Direct Supervisor</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-[#6B778C] italic p-3 border border-dashed border-[#DFE1E6] rounded-sm text-center">
                                            Reports directly to Board
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5" />
                                        Direct Reports ({user.subordinates?.length || 0})
                                    </h4>
                                    <div className="space-y-2">
                                        {user.subordinates?.length > 0 ? (
                                            user.subordinates.slice(0, 3).map((sub: any) => (
                                                <div key={sub.id} className="flex items-center justify-between p-2 bg-white border border-[#DFE1E6] rounded-sm">
                                                    <span className="text-xs font-bold text-[#42526E]">{sub.name}</span>
                                                    <span className="text-[9px] font-bold text-[#0052CC] uppercase">{sub.role}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-[#6B778C] italic p-3 border border-dashed border-[#DFE1E6] rounded-sm text-center">
                                                No direct reports assigned
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* TAB 2: REPORTS LEDGER & SHEET EXPORT */
                        <div className="p-6 space-y-6">
                            {/* Date Filter & Export Bar */}
                            <div className="bg-[#FAFBFC] border border-[#DFE1E6] p-4 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <form onSubmit={handleApplyDateFilter} className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-[#0052CC]" />
                                        <span className="text-xs font-bold text-[#172B4D]">Range:</span>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-white border border-[#DFE1E6] rounded px-2 py-1 text-xs text-[#172B4D] focus:ring-1 focus:ring-[#0052CC] outline-none"
                                        />
                                        <span className="text-xs text-[#6B778C]">to</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-white border border-[#DFE1E6] rounded px-2 py-1 text-xs text-[#172B4D] focus:ring-1 focus:ring-[#0052CC] outline-none"
                                        />
                                    </div>

                                    <Button type="submit" variant="ghost" size="sm" className="text-xs font-bold">
                                        Apply
                                    </Button>

                                    <div className="h-4 w-px bg-[#DFE1E6] hidden sm:block" />

                                    {/* Presets */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleQuickPreset('7days')}
                                            className="px-2 py-1 text-[10px] font-bold text-[#0052CC] hover:bg-[#DEEBFF] rounded transition-colors"
                                        >
                                            7D
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickPreset('30days')}
                                            className="px-2 py-1 text-[10px] font-bold text-[#0052CC] hover:bg-[#DEEBFF] rounded transition-colors"
                                        >
                                            30D
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickPreset('thisMonth')}
                                            className="px-2 py-1 text-[10px] font-bold text-[#0052CC] hover:bg-[#DEEBFF] rounded transition-colors"
                                        >
                                            This Month
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickPreset('allTime')}
                                            className="px-2 py-1 text-[10px] font-bold text-[#0052CC] hover:bg-[#DEEBFF] rounded transition-colors"
                                        >
                                            All Time
                                        </button>
                                    </div>
                                </form>

                                {/* Export CSV Button */}
                                <Button
                                    onClick={exportToCsv}
                                    disabled={reports.length === 0}
                                    variant="primary"
                                    size="sm"
                                    leftIcon={<Download className="w-4 h-4" />}
                                    className="bg-[#36B37E] hover:bg-[#00875A] text-white shadow-sm font-bold text-xs shrink-0"
                                >
                                    Export to Sheet (CSV)
                                </Button>
                            </div>

                            {/* Reports Table View */}
                            {isLoadingReports ? (
                                <div className="p-16 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
                                    <p className="text-xs font-bold text-[#6B778C]">Retrieving report records...</p>
                                </div>
                            ) : reports.length === 0 ? (
                                <div className="p-16 border-2 border-dashed border-[#DFE1E6] rounded-md text-center bg-[#FAFBFC]">
                                    <FileText className="w-12 h-12 text-[#97A0AF] mx-auto mb-3 opacity-40" />
                                    <h4 className="text-sm font-bold text-[#172B4D]">No Daily Reports Found</h4>
                                    <p className="text-xs text-[#6B778C] mt-1">No mission logs filed by {user.name} for the selected date window.</p>
                                </div>
                            ) : (
                                <div className="border border-[#DFE1E6] rounded-md overflow-x-auto shadow-sm">
                                    <table className="w-full text-left border-collapse min-w-[700px]">
                                        <thead>
                                            <tr className="bg-[#FAFBFC] border-b border-[#DFE1E6]">
                                                <th className="px-4 py-3 text-[10px] font-bold text-[#6B778C] uppercase tracking-wider">Date</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-[#6B778C] uppercase tracking-wider text-center">Tasks</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-[#6B778C] uppercase tracking-wider text-center">Hours</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-[#6B778C] uppercase tracking-wider text-center">Utilization</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-[#6B778C] uppercase tracking-wider">Accomplishments</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-[#6B778C] uppercase tracking-wider">Challenges</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-[#6B778C] uppercase tracking-wider">Next Plan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#DFE1E6]">
                                            {reports.map((r: any) => (
                                                <tr key={r.id} className="hover:bg-[#F4F5F7] transition-colors text-xs">
                                                    <td className="px-4 py-3 font-bold text-[#172B4D] whitespace-nowrap">
                                                        {new Date(r.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-[#0052CC]">
                                                        {r.tasksCompleted || 0}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-medium text-[#42526E]">
                                                        {r.hoursWorked || 0}h
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                                            (r.utilization || 0) >= 80 ? "bg-[#E3FCEF] text-[#006644]" :
                                                                (r.utilization || 0) >= 50 ? "bg-[#FFF0B3] text-[#172B4D]" : "bg-[#FFEBE6] text-[#DE350B]"
                                                        )}>
                                                            {r.utilization || 0}%
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-[#172B4D] max-w-[220px]">
                                                        {renderTruncatedCell(r.accomplishments, 75, r, "text-[#172B4D]")}
                                                    </td>
                                                    <td className="px-4 py-3 text-[#DE350B] max-w-[180px]">
                                                        {renderTruncatedCell(r.challenges, 60, r, "text-[#DE350B]")}
                                                    </td>
                                                    <td className="px-4 py-3 text-[#42526E] max-w-[180px]">
                                                        {renderTruncatedCell(r.tomorrowPlan, 60, r, "text-[#42526E]")}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#DFE1E6] bg-[#FAFBFC] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Close Profile</Button>
                </div>
            </div>

            {/* Nested Full Report Detail Modal */}
            {selectedReportForView && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedReportForView(null)}>
                    <div className="bg-white border border-[#DFE1E6] rounded-lg max-w-xl w-full p-6 space-y-6 shadow-2xl relative text-[#172B4D] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-[#DFE1E6] pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-md bg-[#DEEBFF] text-[#0052CC] flex items-center justify-center font-bold">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#172B4D] uppercase tracking-wider">
                                        Daily Report ({new Date(selectedReportForView.date).toLocaleDateString()})
                                    </h3>
                                    <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest">
                                        {selectedReportForView.user?.name || user?.name}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedReportForView(null)}
                                className="p-1.5 rounded-full hover:bg-[#EBECF0] text-[#6B778C] hover:text-[#172B4D] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div>
                                <h4 className="text-[10px] font-bold text-[#0052CC] uppercase tracking-widest mb-1.5">Accomplishments</h4>
                                <div className="bg-[#FAFBFC] border border-[#DFE1E6] p-4 rounded-md text-xs text-[#172B4D] whitespace-pre-wrap leading-relaxed font-medium">
                                    {selectedReportForView.accomplishments || "No details provided."}
                                </div>
                            </div>

                            {selectedReportForView.challenges && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-[#DE350B] uppercase tracking-widest mb-1.5">Challenges & Impediments</h4>
                                    <div className="bg-[#FFEBE6] border border-[#FFBDAD] p-4 rounded-md text-xs text-[#DE350B] whitespace-pre-wrap leading-relaxed font-medium">
                                        {selectedReportForView.challenges}
                                    </div>
                                </div>
                            )}

                            {selectedReportForView.tomorrowPlan && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-[#006644] uppercase tracking-widest mb-1.5">Next Cycle Plan</h4>
                                    <div className="bg-[#E3FCEF] border border-[#ABF5D1] p-4 rounded-md text-xs text-[#006644] whitespace-pre-wrap leading-relaxed font-medium">
                                        {selectedReportForView.tomorrowPlan}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t border-[#DFE1E6] pt-4 text-xs font-bold text-[#6B778C]">
                            <div className="flex items-center gap-4">
                                <span>Tasks: <strong className="text-[#0052CC]">{selectedReportForView.tasksCompleted}</strong></span>
                                <span>Hours: <strong className="text-[#172B4D]">{selectedReportForView.hoursWorked}h</strong></span>
                                <span>Utilization: <strong className="text-[#006644]">{selectedReportForView.utilization}%</strong></span>
                            </div>
                            <Button size="sm" variant="secondary" onClick={() => setSelectedReportForView(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
