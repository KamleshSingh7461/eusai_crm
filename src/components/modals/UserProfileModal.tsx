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

    const renderTruncatedCell = (text: string | null, limit: number, report: any, textColorClass: string = "text-[#E6EAF0]") => {
        if (!text) return <span className="text-[#6B7385] italic">-</span>;
        if (text.length <= limit) return <p className={textColorClass}>{text}</p>;
        return (
            <div className="space-y-1">
                <p className={cn("line-clamp-2", textColorClass)} title={text}>
                    {text}
                </p>
                <button
                    type="button"
                    onClick={() => setSelectedReportForView(report)}
                    className="text-[11px] font-semibold text-[#3B82F6] hover:underline inline-flex items-center gap-1"
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
            const res = await fetch('/api/team?includeSuspended=true');
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
            case 'DIRECTOR': return 'bg-[#A78BFA1F] text-[#8B5CF6]';
            case 'MANAGER': return 'bg-[#3B82F61F] text-[#3B82F6]';
            case 'TEAM_LEADER': return 'bg-[#34D3991F] text-[#059669]';
            case 'EMPLOYEE': return 'bg-[#FFFFFF14] text-[#E6EAF0]';
            default: return 'bg-[#FFFFFF0F] text-[#E6EAF0]';
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6 bg-black/70 animate-in fade-in duration-200">
            <div className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-4xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-b-3xl">
                {/* Header */}
                <div className="p-6 border-b border-[#FFFFFF14] flex items-center justify-between bg-[#FFFFFF08]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#3B82F6] flex items-center justify-center text-white shadow-md">
                            <UserIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-[#E6EAF0]">{user?.name || 'Team Member Profile'}</h3>
                            <p className="text-xs text-[#8B94A5]">Strategic performance and daily mission logs</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-[#FFFFFF0F] rounded-md text-[#8B94A5] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub-Header Navigation Tabs */}
                {isSenior && user && (
                    <div className="flex border-b border-[#FFFFFF14] bg-[#FFFFFF08] px-6 gap-4">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={cn(
                                "py-3 px-2 text-xs font-semibold   flex items-center gap-2 border-b-2 transition-all",
                                activeTab === 'overview'
                                    ? "border-[#3B82F6] text-[#3B82F6]"
                                    : "border-transparent text-[#8B94A5] hover:text-[#E6EAF0]"
                            )}
                        >
                            <Activity className="w-4 h-4" /> Profile & Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={cn(
                                "py-3 px-2 text-xs font-semibold   flex items-center gap-2 border-b-2 transition-all",
                                activeTab === 'reports'
                                    ? "border-[#3B82F6] text-[#3B82F6]"
                                    : "border-transparent text-[#8B94A5] hover:text-[#E6EAF0]"
                            )}
                        >
                            <FileSpreadsheet className="w-4 h-4" /> Reports Ledger ({reports.length})
                        </button>
                    </div>
                )}

                {/* Main Body */}
                <div className="p-0 overflow-y-auto flex-1 bg-white/[0.03]">
                    {isLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[#3B82F6]" />
                            <p className="text-sm font-medium text-[#8B94A5]">Synchronizing profile data...</p>
                        </div>
                    ) : !user ? (
                        <div className="p-20 text-center">
                            <p className="text-[#8B94A5]">User intelligence not found. They may have been unassigned.</p>
                        </div>
                    ) : activeTab === 'overview' ? (
                        <div className="divide-y divide-[#FFFFFF14]">
                            {/* Identity Section */}
                            <div className="p-5 sm:p-8 bg-white/[0.03] flex flex-col md:flex-row gap-8">
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 rounded-full bg-[#3B82F61F] border-4 border-white shadow-md flex items-center justify-center text-[#3B82F6] text-3xl font-semibold overflow-hidden">
                                        <Avatar src={user.image} alt={user.name} fallback={user.name?.charAt(0) || 'U'} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-2xl font-semibold text-[#E6EAF0]">{user.name}</h2>
                                            <span className={cn("px-2 py-0.5 rounded-sm text-[11px] font-semibold ", getRoleColor(user.role))}>
                                                {user.role}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm text-[#8B94A5] font-medium">
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

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-sm border border-[#FFFFFF14] bg-[#FFFFFF08]">
                                            <div className="text-[11px] font-semibold text-[#8B94A5] mb-2 flex items-center justify-between">
                                                Performance
                                                {user.performanceTrend === 'UP' && <TrendingUp className="w-3 h-3 text-[#34D399]" />}
                                                {user.performanceTrend === 'DOWN' && <TrendingDown className="w-3 h-3 text-[#FB7185]" />}
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-semibold text-[#E6EAF0]">{user.performanceScore}%</span>
                                                <span className="text-xs font-semibold text-[#34D399]">Active Score</span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-sm border border-[#FFFFFF14] bg-[#FFFFFF08]">
                                            <div className="text-[11px] font-semibold text-[#8B94A5] mb-2">Rank</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-semibold text-[#3B82F6]">#{user.rank || 'N/A'}</span>
                                                <span className="text-xs font-semibold text-[#8B94A5]">Company Wide</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hierarchy Section */}
                            <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#FFFFFF08]/50">
                                <div>
                                    <h4 className="text-[11px] font-semibold text-[#8B94A5] mb-4 flex items-center gap-2">
                                        <GitMerge className="w-3.5 h-3.5" />
                                        Reporting Line
                                    </h4>
                                    {user.manager ? (
                                        <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-[#FFFFFF14] rounded-sm group hover:border-[#3B82F6] transition-colors cursor-default">
                                            <div className="w-8 h-8 rounded-full bg-[#FFFFFF0F] flex items-center justify-center text-[11px] font-semibold">
                                                {user.manager.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-[#E6EAF0]">{user.manager.name}</div>
                                                <div className="text-[11px] text-[#8B94A5]">Direct Supervisor</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-[#8B94A5] italic p-3 border border-dashed border-[#FFFFFF14] rounded-sm text-center">
                                            Reports directly to Board
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-[11px] font-semibold text-[#8B94A5] mb-4 flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5" />
                                        Direct Reports ({user.subordinates?.length || 0})
                                    </h4>
                                    <div className="space-y-2">
                                        {user.subordinates?.length > 0 ? (
                                            user.subordinates.slice(0, 3).map((sub: any) => (
                                                <div key={sub.id} className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white/[0.03] border border-[#FFFFFF14] rounded-sm">
                                                    <span className="text-xs font-semibold text-[#A0A9B8]">{sub.name}</span>
                                                    <span className="text-[11px] font-semibold text-[#3B82F6]">{sub.role}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-[#8B94A5] italic p-3 border border-dashed border-[#FFFFFF14] rounded-sm text-center">
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
                            <div className="bg-[#FFFFFF08] border border-[#FFFFFF14] p-4 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <form onSubmit={handleApplyDateFilter} className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-[#3B82F6]" />
                                        <span className="text-xs font-semibold text-[#E6EAF0]">Range:</span>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-white/[0.03] border border-[#FFFFFF14] rounded px-2 py-1 text-xs text-[#E6EAF0] focus:ring-1 focus:ring-[#3B82F6] outline-none"
                                        />
                                        <span className="text-xs text-[#8B94A5]">to</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-white/[0.03] border border-[#FFFFFF14] rounded px-2 py-1 text-xs text-[#E6EAF0] focus:ring-1 focus:ring-[#3B82F6] outline-none"
                                        />
                                    </div>

                                    <Button type="submit" variant="ghost" size="sm" className="text-xs font-semibold">
                                        Apply
                                    </Button>

                                    <div className="h-4 w-px bg-[#FFFFFF14] hidden sm:block" />

                                    {/* Presets */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleQuickPreset('7days')}
                                            className="px-2 py-1 text-[11px] font-semibold text-[#3B82F6] hover:bg-[#3B82F61F] rounded transition-colors"
                                        >
                                            7D
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickPreset('30days')}
                                            className="px-2 py-1 text-[11px] font-semibold text-[#3B82F6] hover:bg-[#3B82F61F] rounded transition-colors"
                                        >
                                            30D
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickPreset('thisMonth')}
                                            className="px-2 py-1 text-[11px] font-semibold text-[#3B82F6] hover:bg-[#3B82F61F] rounded transition-colors"
                                        >
                                            This Month
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickPreset('allTime')}
                                            className="px-2 py-1 text-[11px] font-semibold text-[#3B82F6] hover:bg-[#3B82F61F] rounded transition-colors"
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
                                    className="bg-[#34D399] hover:bg-[#10B981] text-white shadow-sm font-semibold text-xs shrink-0"
                                >
                                    Export to Sheet (CSV)
                                </Button>
                            </div>

                            {/* Reports Table View */}
                            {isLoadingReports ? (
                                <div className="p-6 sm:p-16 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
                                    <p className="text-xs font-semibold text-[#8B94A5]">Retrieving report records...</p>
                                </div>
                            ) : reports.length === 0 ? (
                                <div className="p-6 sm:p-16 border-2 border-dashed border-[#FFFFFF14] rounded-md text-center bg-[#FFFFFF08]">
                                    <FileText className="w-12 h-12 text-[#6B7385] mx-auto mb-3 opacity-40" />
                                    <h4 className="text-sm font-semibold text-[#E6EAF0]">No Daily Reports Found</h4>
                                    <p className="text-xs text-[#8B94A5] mt-1">No mission logs filed by {user.name} for the selected date window.</p>
                                </div>
                            ) : (
                                <div className="border border-[#FFFFFF14] rounded-md overflow-x-auto shadow-sm">
                                    <table className="w-full text-left border-collapse min-w-[700px]">
                                        <thead>
                                            <tr className="bg-[#FFFFFF08] border-b border-[#FFFFFF14]">
                                                <th className="px-4 py-3 text-[11px] font-semibold text-[#8B94A5]">Date</th>
                                                <th className="px-4 py-3 text-[11px] font-semibold text-[#8B94A5] text-center">Tasks</th>
                                                <th className="px-4 py-3 text-[11px] font-semibold text-[#8B94A5] text-center">Hours</th>
                                                <th className="px-4 py-3 text-[11px] font-semibold text-[#8B94A5] text-center">Utilization</th>
                                                <th className="px-4 py-3 text-[11px] font-semibold text-[#8B94A5]">Accomplishments</th>
                                                <th className="px-4 py-3 text-[11px] font-semibold text-[#8B94A5]">Challenges</th>
                                                <th className="px-4 py-3 text-[11px] font-semibold text-[#8B94A5]">Next Plan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#FFFFFF14]">
                                            {reports.map((r: any) => (
                                                <tr key={r.id} className="hover:bg-[#FFFFFF0A] transition-colors text-xs">
                                                    <td className="px-4 py-3 font-semibold text-[#E6EAF0] whitespace-nowrap">
                                                        {new Date(r.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-semibold text-[#3B82F6]">
                                                        {r.tasksCompleted || 0}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-medium text-[#A0A9B8]">
                                                        {r.hoursWorked || 0}h
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[11px] font-semibold",
                                                            (r.utilization || 0) >= 80 ? "bg-[#34D3991F] text-[#059669]" :
                                                                (r.utilization || 0) >= 50 ? "bg-[#FBBF2433] text-[#E6EAF0]" : "bg-[#FB71851F] text-[#F43F5E]"
                                                        )}>
                                                            {r.utilization || 0}%
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-[#E6EAF0] max-w-[220px]">
                                                        {renderTruncatedCell(r.accomplishments, 75, r, "text-[#E6EAF0]")}
                                                    </td>
                                                    <td className="px-4 py-3 text-[#F43F5E] max-w-[180px]">
                                                        {renderTruncatedCell(r.challenges, 60, r, "text-[#F43F5E]")}
                                                    </td>
                                                    <td className="px-4 py-3 text-[#A0A9B8] max-w-[180px]">
                                                        {renderTruncatedCell(r.tomorrowPlan, 60, r, "text-[#A0A9B8]")}
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
                <div className="p-4 border-t border-[#FFFFFF14] bg-[#FFFFFF08] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Close Profile</Button>
                </div>
            </div>

            {/* Nested Full Report Detail Modal */}
            {selectedReportForView && (
                <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-6 bg-black/70 animate-in fade-in duration-200" onClick={() => setSelectedReportForView(null)}>
                    <div className="bg-[#111113] border border-white/[0.08] rounded-2xl max-w-xl w-full p-6 space-y-6 relative text-[#E6EAF0] animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-b-3xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#FFFFFF14] pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-md bg-[#3B82F61F] text-[#3B82F6] flex items-center justify-center font-semibold">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-[#E6EAF0]">
                                        Daily Report ({new Date(selectedReportForView.date).toLocaleDateString()})
                                    </h3>
                                    <span className="text-[11px] font-semibold text-[#8B94A5]">
                                        {selectedReportForView.user?.name || user?.name}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedReportForView(null)}
                                className="p-1.5 rounded-full hover:bg-[#FFFFFF0F] text-[#8B94A5] hover:text-[#E6EAF0] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div>
                                <h4 className="text-[11px] font-semibold text-[#3B82F6] mb-1.5">Accomplishments</h4>
                                <div className="bg-[#FFFFFF08] border border-[#FFFFFF14] p-4 rounded-md text-xs text-[#E6EAF0] whitespace-pre-wrap leading-relaxed font-medium">
                                    {selectedReportForView.accomplishments || "No details provided."}
                                </div>
                            </div>

                            {selectedReportForView.challenges && (
                                <div>
                                    <h4 className="text-[11px] font-semibold text-[#F43F5E] mb-1.5">Challenges & Impediments</h4>
                                    <div className="bg-[#FB71851F] border border-[#FB718533] p-4 rounded-md text-xs text-[#F43F5E] whitespace-pre-wrap leading-relaxed font-medium">
                                        {selectedReportForView.challenges}
                                    </div>
                                </div>
                            )}

                            {selectedReportForView.tomorrowPlan && (
                                <div>
                                    <h4 className="text-[11px] font-semibold text-[#059669] mb-1.5">Next Cycle Plan</h4>
                                    <div className="bg-[#34D3991F] border border-[#34D39933] p-4 rounded-md text-xs text-[#059669] whitespace-pre-wrap leading-relaxed font-medium">
                                        {selectedReportForView.tomorrowPlan}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#FFFFFF14] pt-4 text-xs font-semibold text-[#8B94A5]">
                            <div className="flex items-center gap-4">
                                <span>Tasks: <strong className="text-[#3B82F6]">{selectedReportForView.tasksCompleted}</strong></span>
                                <span>Hours: <strong className="text-[#E6EAF0]">{selectedReportForView.hoursWorked}h</strong></span>
                                <span>Utilization: <strong className="text-[#059669]">{selectedReportForView.utilization}%</strong></span>
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
