"use client";

import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Filter,
    Search,
    Plus,
    ShieldAlert,
    Zap,
    X,
    ChevronDown,
    MoreHorizontal,
    Briefcase
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import IssueModal from '@/components/modals/IssueModal';

export default function IssuesLogPage() {
    const { data: session } = useSession();
    const [issues, setIssues] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ project: 'all', severity: 'all', status: 'all' });
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const { showToast } = useToast?.() || { showToast: console.log };

    const fetchIssues = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/issues');
            if (response.ok) {
                const data = await response.json();
                setIssues(data.issues || []);
                setMeta(data.meta);
            }
        } catch (error) {
            console.error('Failed to fetch issues', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchIssues();
        }
    }, [session]);

    const userRole = (session?.user as any)?.role;
    const isManager = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);

    const filteredIssues = issues.filter(issue => {
        const projectMatch = filters.project === 'all' || issue.projectId === filters.project;
        const severityMatch = filters.severity === 'all' || issue.severity === filters.severity;
        const statusMatch = filters.status === 'all' || issue.status === filters.status;
        return projectMatch && severityMatch && statusMatch;
    });

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F4F5F7]">
                <div className="flex flex-col items-center gap-4">
                    <ShieldAlert className="w-12 h-12 text-[#0052CC] animate-pulse" />
                    <p className="text-[#6B778C] font-medium">Scanning for mission impediments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 bg-[#F4F5F7] min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#DE350B]/10 flex items-center justify-center text-[#DE350B]">
                        <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#172B4D] font-display">Issue Log</h1>
                        <p className="text-[#6B778C] text-sm md:text-lg">Project impediments and risk mitigation.</p>
                    </div>
                </div>
                {isManager && (
                    <button
                        onClick={() => { setSelectedIssue(null); setIsIssueModalOpen(true); }}
                        className="w-full sm:w-auto bg-[#0052CC] hover:bg-[#0747A6] text-white px-6 py-2.5 rounded-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Report Impediment
                    </button>
                )}
            </div>

            {/* Manager Health Dashboard */}
            {isManager && meta && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-white p-4 md:p-6 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-2 block">Active Impediments</span>
                        <div className="text-xl md:text-2xl font-bold text-[#172B4D]">{meta.activeCount}</div>
                        <p className="text-[10px] md:text-xs text-[#6B778C] mt-1">Pending resolution</p>
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-2 block">Critical Path Risk</span>
                        <div className="text-xl md:text-2xl font-bold text-red-600">{meta.criticalCount}</div>
                        <p className="text-[10px] md:text-xs text-[#6B778C] mt-1">Immediate action required</p>
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-2 block">Avg Resolution Time</span>
                        <div className="text-xl md:text-2xl font-bold text-[#172B4D]">{meta.avgDaysOpen} Days</div>
                        <p className="text-[10px] md:text-xs text-[#6B778C] mt-1">Cycle velocity</p>
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-sm border border-[#DFE1E6] shadow-sm">
                        <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-2 block">Portfolio Health</span>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-[#F4F5F7] rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full transition-all duration-1000", meta.criticalCount > 2 ? "bg-red-500" : "bg-emerald-500")}
                                    style={{ width: `${Math.max(10, 100 - (meta.criticalCount * 20))}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-[#42526E]">{meta.criticalCount > 2 ? 'At Risk' : 'Stable'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between py-2">
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative group w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B778C]" />
                        <input
                            placeholder="Search issues"
                            className="w-full bg-white border border-[#DFE1E6] rounded-sm py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#0052CC] transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <select
                            value={filters.project}
                            onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                            className="flex-1 sm:flex-none bg-white border border-[#DFE1E6] rounded-sm px-3 py-2 text-xs font-bold text-[#172B4D] focus:outline-none focus:border-[#0052CC] sm:min-w-[140px] shadow-sm"
                        >
                            <option value="all">All Projects</option>
                            {meta?.projectDistribution?.map((p: any) => (
                                <option key={p.name} value={issues.find(i => i.project?.name === p.name)?.projectId || 'none'}>
                                    {p.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.severity}
                            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                            className="flex-1 sm:flex-none bg-white border border-[#DFE1E6] rounded-sm px-3 py-2 text-xs font-bold text-[#172B4D] focus:outline-none focus:border-[#0052CC] shadow-sm"
                        >
                            <option value="all">Severity</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="flex-1 sm:flex-none bg-white border border-[#DFE1E6] rounded-sm px-3 py-2 text-xs font-bold text-[#172B4D] focus:outline-none focus:border-[#0052CC] shadow-sm"
                        >
                            <option value="all">Status</option>
                            <option value="OPEN">Open</option>
                            <option value="RESOLVING">Resolving</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-[#6B778C] uppercase tracking-wider">
                    <span className="bg-[#DFE1E6] px-2 py-0.5 rounded-sm text-[#172B4D]">{filteredIssues.length}</span>
                    Records Found
                </div>
            </div>

            <div className="border border-[#DFE1E6] rounded-sm overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-[#F4F5F7] border-b border-[#DFE1E6] text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">
                                <th className="px-6 py-4">T Key</th>
                                <th className="px-6 py-4">Summary & Project</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Severity</th>
                                <th className="px-6 py-4">Owner</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DFE1E6]">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-[#6B778C]">Loading issues...</td></tr>
                            ) : filteredIssues.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-[#6B778C]">No issues found.</td></tr>
                            ) : (
                                filteredIssues.map(issue => (
                                    <tr key={issue.id} className="hover:bg-[#F4F5F7] transition-colors group">
                                        <td className="px-6 py-4 text-xs font-bold text-[#6B778C]">ET-{issue.id.slice(-3).toUpperCase()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span
                                                    onClick={() => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
                                                    className="text-sm font-bold text-[#172B4D] hover:text-[#0052CC] hover:underline cursor-pointer"
                                                >
                                                    {issue.title}
                                                </span>
                                                {issue.project && (
                                                    <span className="text-[10px] text-[#6B778C] font-medium flex items-center gap-1 uppercase mt-1">
                                                        <Briefcase className="w-2.5 h-2.5" /> {issue.project.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded-sm text-[10px] font-bold uppercase",
                                                issue.status === 'OPEN' ? 'bg-[#EAE6FF] text-[#403294]' :
                                                    issue.status === 'RESOLVING' ? 'bg-[#FFF0B3] text-[#172B4D]' :
                                                        'bg-[#E3FCEF] text-[#006644]'
                                            )}>
                                                {issue.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold text-white",
                                                    issue.severity === 'CRITICAL' ? 'bg-[#BF2600]' :
                                                        issue.severity === 'HIGH' ? 'bg-[#FF5630]' :
                                                            issue.severity === 'MEDIUM' ? 'bg-[#FFAB00]' : 'bg-[#00B8D9]'
                                                )}>
                                                    {issue.severity[0]}
                                                </div>
                                                <span className="text-xs font-medium text-[#42526E] uppercase tracking-tighter">{issue.severity}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-[#0052CC] flex items-center justify-center text-white text-[10px] font-bold">
                                                    {issue.owner[0]}
                                                </div>
                                                <span className="text-xs font-bold text-[#172B4D]">{issue.owner}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
                                                className="p-1.5 hover:bg-[#EBECF0] rounded text-[#6B778C] transition-colors"
                                            >
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <IssueModal
                isOpen={isIssueModalOpen}
                onClose={() => setIsIssueModalOpen(false)}
                onIssueCreated={() => {
                    fetchIssues();
                    setIsIssueModalOpen(false);
                }}
                initialData={selectedIssue}
            />
        </div>
    );
}
