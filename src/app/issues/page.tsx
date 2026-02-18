"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
    Briefcase,
    Edit,
    Activity,
    SearchX,
    BarChart3,
    TrendingUp,
    Shield
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import IssueModal from '@/components/modals/IssueModal';
import { NotionButton } from '@/components/notion';

export default function IssuesLogPage() {
    const { data: session } = useSession();
    const [issues, setIssues] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ project: 'all', severity: 'all', status: 'all' });
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
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
            showToast('Strategic uplink failure', 'error');
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

    const filteredIssues = useMemo(() => {
        return issues.filter(issue => {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                issue.title.toLowerCase().includes(query) ||
                issue.project?.name?.toLowerCase().includes(query) ||
                issue.owner?.toLowerCase().includes(query);

            const projectMatch = filters.project === 'all' || issue.projectId === filters.project;
            const severityMatch = filters.severity === 'all' || issue.severity === filters.severity;
            const statusMatch = filters.status === 'all' || issue.status === filters.status;
            return matchesSearch && projectMatch && severityMatch && statusMatch;
        });
    }, [issues, searchQuery, filters]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#191919]">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-t-[#DE350B] border-[rgba(255,255,255,0.05)] animate-spin" />
                        <ShieldAlert className="absolute inset-0 m-auto w-6 h-6 text-[#DE350B] animate-pulse" />
                    </div>
                    <p className="text-[rgba(255,255,255,0.4)] text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Scanning Impediments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#191919] text-[rgba(255,255,255,0.9)] pb-20">
            {/* Header / Command Center */}
            <div className="bg-[#1D2125] border-b border-[rgba(255,255,255,0.08)] shadow-xl relative z-20">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#DE350B]/10 flex items-center justify-center border border-[#DE350B]/20 shadow-[0_0_15px_rgba(222,53,11,0.2)] shrink-0">
                                <AlertTriangle className="w-6 h-6 text-[#DE350B]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-[rgba(255,255,255,0.4)] text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                                    <Activity className="w-3 h-3 text-[#DE350B]" />
                                    Risk Mitigation
                                </div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-[rgba(255,255,255,0.95)]">Issue Command Center</h1>
                                <p className="hidden sm:block text-[rgba(255,255,255,0.5)] text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mt-1">
                                    Project impediments and blockades registry
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <NotionButton
                                onClick={() => { setSelectedIssue(null); setIsIssueModalOpen(true); }}
                                className="bg-[#DE350B] hover:bg-[#BF2600] text-white shadow-xl shadow-red-900/20 px-6 font-black uppercase tracking-[0.15em] text-[10px] h-11"
                                leftIcon={Plus}
                            >
                                Report Impediment
                            </NotionButton>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-2 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Manager Dashboard Cards */}
                {isManager && meta && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <MetricCard
                            label="Active Impediments"
                            value={meta.activeCount}
                            subtext="Pending resolution"
                            icon={ShieldAlert}
                            color="orange"
                            onClick={() => setFilters({ ...filters, status: 'OPEN' })}
                        />
                        <MetricCard
                            label="Critical Risk"
                            value={meta.criticalCount}
                            subtext="Immediate action required"
                            icon={Zap}
                            color="red"
                            onClick={() => setFilters({ ...filters, severity: 'CRITICAL' })}
                        />
                        <MetricCard
                            label="Avg Resolution"
                            value={`${meta.avgDaysOpen}d`}
                            subtext="Cycle velocity"
                            icon={Clock}
                            color="blue"
                        />
                        <div className="bg-[#2f3437] border border-[rgba(255,255,255,0.08)] p-5 sm:p-6 rounded-lg shadow-xl relative overflow-hidden">
                            <span className="text-[9px] sm:text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] mb-2 block">Portfolio Health</span>
                            <div className="flex items-center gap-2 mt-4">
                                <div className="flex-1 h-2 bg-[#191919] rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full transition-all duration-1000", meta.criticalCount > 2 ? "bg-red-500" : "bg-emerald-500")}
                                        style={{ width: `${Math.max(10, 100 - (meta.criticalCount * 20))}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-[rgba(255,255,255,0.6)]">{meta.criticalCount > 2 ? 'AT RISK' : 'STABLE'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters & Control Deck */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-[#2f3437] p-4 lg:p-3 rounded-lg border border-[rgba(255,255,255,0.08)] shadow-lg sticky top-0 z-30 backdrop-blur-md bg-opacity-95">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.3)] group-focus-within:text-[#DE350B] transition-colors" />
                        <input
                            placeholder="Interrogate data... (Title, Project, Owner)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none text-sm pl-12 focus:ring-0 placeholder-[rgba(255,255,255,0.3)] text-[rgba(255,255,255,0.8)] font-bold tracking-tight py-2 sm:py-1 outline-none"
                        />
                    </div>

                    <div className="h-px w-full lg:h-8 lg:w-px bg-[rgba(255,255,255,0.08)]" />

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:items-center gap-3 lg:gap-4 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                        {/* Project Filter */}
                        <div className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-3">
                            <span className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.15em] lg:tracking-widest">Project:</span>
                            <select
                                value={filters.project}
                                onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                                className="bg-[#191919] border border-[rgba(255,255,255,0.1)] text-[10px] font-black uppercase tracking-wider text-[rgba(255,255,255,0.7)] focus:ring-1 focus:ring-[#DE350B] cursor-pointer hover:bg-[#3b4045] rounded-md px-2 py-1.5 transition-all outline-none h-8 lg:h-9 w-full lg:w-32"
                            >
                                <option value="all">ALL PROJECTS</option>
                                {meta?.projectDistribution?.map((p: any) => (
                                    <option key={p.name} value={issues.find(i => i.project?.name === p.name)?.projectId || 'none'}>
                                        {p.name.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* Severity Filter */}
                        <div className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-3">
                            <span className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.15em] lg:tracking-widest">Severity:</span>
                            <select
                                value={filters.severity}
                                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                                className="bg-[#191919] border border-[rgba(255,255,255,0.1)] text-[10px] font-black uppercase tracking-wider text-[rgba(255,255,255,0.7)] focus:ring-1 focus:ring-[#DE350B] cursor-pointer hover:bg-[#3b4045] rounded-md px-2 py-1.5 transition-all outline-none h-8 lg:h-9 w-full lg:w-32"
                            >
                                <option value="all">ALL</option>
                                <option value="CRITICAL">Critical</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>
                        {/* Status Filter */}
                        <div className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-3">
                            <span className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.15em] lg:tracking-widest">Status:</span>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="bg-[#191919] border border-[rgba(255,255,255,0.1)] text-[10px] font-black uppercase tracking-wider text-[rgba(255,255,255,0.7)] focus:ring-1 focus:ring-[#DE350B] cursor-pointer hover:bg-[#3b4045] rounded-md px-2 py-1.5 transition-all outline-none h-8 lg:h-9 w-full lg:w-32"
                            >
                                <option value="all">ALL</option>
                                <option value="OPEN">Open</option>
                                <option value="RESOLVING">Resolving</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Issue Table */}
                {filteredIssues.length === 0 ? (
                    <div className="bg-[#2f3437] border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-xl py-32 flex flex-col items-center justify-center text-center px-8">
                        <SearchX className="w-16 h-16 text-[rgba(255,255,255,0.1)] mb-6" />
                        <h3 className="text-xl font-black text-[rgba(255,255,255,0.9)] tracking-tight">No Impediments Found</h3>
                        <p className="text-[rgba(255,255,255,0.4)] text-sm mt-3 max-w-sm font-medium">System is clear or filters are too restrictive.</p>
                        <NotionButton
                            variant="default"
                            className="mt-8 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.08)] text-[10px] font-black uppercase tracking-widest"
                            onClick={() => {
                                setFilters({ project: 'all', severity: 'all', status: 'all' });
                                setSearchQuery('');
                            }}
                        >
                            Reset Filters
                        </NotionButton>
                    </div>
                ) : (
                    <div className="bg-[#2f3437] border border-[rgba(255,255,255,0.09)] rounded-lg overflow-hidden shadow-2xl">
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[rgba(0,0,0,0.2)] border-b border-[rgba(255,255,255,0.08)]">
                                        <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em]">T-Key</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] w-1/3">Summary & Project</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em]">Severity</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em]">Reporter/Owner</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
                                    {filteredIssues.map(issue => (
                                        <tr key={issue.id} className="hover:bg-[rgba(255,255,255,0.04)] transition-all duration-300 group">
                                            <td className="px-5 py-5 text-[10px] font-black font-mono text-[rgba(255,255,255,0.15)] group-hover:text-[#DE350B] transition-colors">
                                                ET-{issue.id.slice(-3).toUpperCase()}
                                            </td>
                                            <td className="px-5 py-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <span
                                                        onClick={() => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
                                                        className="text-[13px] font-black tracking-tight text-[rgba(255,255,255,0.9)] group-hover:text-[#DE350B] transition-colors cursor-pointer hover:underline"
                                                    >
                                                        {issue.title}
                                                    </span>
                                                    {issue.project && (
                                                        <div className="flex items-center gap-2">
                                                            <Briefcase className="w-3 h-3 text-[#DE350B]" />
                                                            <span className="text-[10px] text-[rgba(255,255,255,0.4)] font-bold uppercase tracking-wider">{issue.project.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-5">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider",
                                                    issue.status === 'OPEN' ? 'bg-[#DE350B]/10 text-orange-400 border border-[#DE350B]/20' :
                                                        issue.status === 'RESOLVING' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                )}>
                                                    {issue.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        issue.severity === 'CRITICAL' ? 'bg-[#BF2600] animate-pulse' :
                                                            issue.severity === 'HIGH' ? 'bg-[#FF5630]' :
                                                                issue.severity === 'MEDIUM' ? 'bg-[#FFAB00]' : 'bg-[#00B8D9]'
                                                    )} />
                                                    <span className="text-[10px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-tighter">{issue.severity}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded bg-[#1D2125] border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-black text-white text-[10px] shadow-inner shrink-0">
                                                        {issue.owner[0]}
                                                    </div>
                                                    <span className="text-xs font-black text-[rgba(255,255,255,0.9)] tracking-tight">{issue.owner}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-5 text-right">
                                                <button
                                                    onClick={() => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
                                                    className="p-2 hover:bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.3)] hover:text-white rounded transition-colors"
                                                    title="Edit Issue"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
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

function MetricCard({ label, value, subtext, icon: Icon, color, onClick }: any) {
    const colorStyles: any = {
        blue: "text-blue-400 border-blue-500/20",
        emerald: "text-emerald-400 border-emerald-500/20",
        orange: "text-orange-400 border-orange-500/20",
        red: "text-red-400 border-red-500/20"
    };

    return (
        <div
            onClick={onClick}
            className="bg-[#2f3437] border border-[rgba(255,255,255,0.08)] p-5 sm:p-6 rounded-lg flex items-center gap-4 sm:gap-6 shadow-xl relative overflow-hidden group hover:bg-[#32393d] transition-all duration-500 cursor-pointer hover:border-[rgba(255,255,255,0.2)] active:scale-[0.98]"
        >
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-700">
                <Icon className="w-12 h-12 sm:w-16 sm:h-16 transform rotate-12" />
            </div>

            <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500", colorStyles[color])}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="flex flex-col min-w-0">
                <span className="text-[9px] sm:text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] mb-1 truncate">{label}</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-none">{value}</span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-bold text-[rgba(255,255,255,0.25)] tracking-wide mt-2 truncate">{subtext}</span>
            </div>
        </div>
    );
}
