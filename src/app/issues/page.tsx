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
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
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

    // /issues?new=1 (from the Create menu) opens the report-issue dialog.
    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('new') === '1') {
            setIsIssueModalOpen(true);
            window.history.replaceState(null, '', '/issues');
        }
    }, []);
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
            showToast('Could not load data', 'error');
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
            <div className="flex h-screen items-center justify-center bg-[#07090D]">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-t-[#F43F5E] border-[rgba(255,255,255,0.05)] animate-spin" />
                        <ShieldAlert className="absolute inset-0 m-auto w-6 h-6 text-[#F43F5E] animate-pulse" />
                    </div>
                    <p className="text-[rgba(255,255,255,0.4)] text-[11px] font-bold uppercase tracking-[0.12em] animate-pulse">Loading issues…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Work"
                title="Issues"
                description="Blockers and risks across your projects, from report to resolution."
                actions={<Button variant="danger" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setSelectedIssue(null); setIsIssueModalOpen(true); }}>Report an issue</Button>}
            />

            <div className="space-y-8">
                {/* Manager Dashboard Cards */}
                {isManager && meta && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                        <MetricCard
                            label="Open issues"
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
                        <div className="bg-[#131720] border border-[rgba(255,255,255,0.08)] p-5 sm:p-6 rounded-lg shadow-xl relative overflow-hidden">
                            <span className="text-[11px] sm:text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.12em] mb-2 block">Portfolio Health</span>
                            <div className="flex items-center gap-2 mt-4">
                                <div className="flex-1 h-2 bg-[#07090D] rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full transition-all duration-1000", meta.criticalCount > 2 ? "bg-red-500" : "bg-emerald-500")}
                                        style={{ width: `${Math.max(10, 100 - (meta.criticalCount * 20))}%` }}
                                    />
                                </div>
                                <span className="text-[11px] font-bold text-[rgba(255,255,255,0.6)]">{meta.criticalCount > 2 ? 'AT RISK' : 'STABLE'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters & Control Deck */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-[#131720] p-4 lg:p-3 rounded-lg border border-[rgba(255,255,255,0.08)] shadow-lg sticky top-0 z-30 backdrop-blur-md bg-opacity-95">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.3)] group-focus-within:text-[#F43F5E] transition-colors" />
                        <input
                            placeholder="Search by title, project or owner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none text-sm pl-12 focus:ring-0 placeholder-[rgba(255,255,255,0.3)] text-[rgba(255,255,255,0.8)] font-bold tracking-tight py-2 sm:py-1 outline-none"
                        />
                    </div>

                    <div className="h-px w-full lg:h-8 lg:w-px bg-[rgba(255,255,255,0.08)]" />

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:items-center gap-3 lg:gap-4 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                        {/* Project Filter */}
                        <div className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-3">
                            <span className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.15em] lg:tracking-wider">Project:</span>
                            <select
                                value={filters.project}
                                onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                                className="bg-[#07090D] border border-[rgba(255,255,255,0.1)] text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.7)] focus:ring-1 focus:ring-[#F43F5E] cursor-pointer hover:bg-[#1A1F2A] rounded-md px-2 py-1.5 transition-all outline-none h-8 lg:h-9 w-full lg:w-32"
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
                            <span className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.15em] lg:tracking-wider">Severity:</span>
                            <select
                                value={filters.severity}
                                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                                className="bg-[#07090D] border border-[rgba(255,255,255,0.1)] text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.7)] focus:ring-1 focus:ring-[#F43F5E] cursor-pointer hover:bg-[#1A1F2A] rounded-md px-2 py-1.5 transition-all outline-none h-8 lg:h-9 w-full lg:w-32"
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
                            <span className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.15em] lg:tracking-wider">Status:</span>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="bg-[#07090D] border border-[rgba(255,255,255,0.1)] text-[11px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.7)] focus:ring-1 focus:ring-[#F43F5E] cursor-pointer hover:bg-[#1A1F2A] rounded-md px-2 py-1.5 transition-all outline-none h-8 lg:h-9 w-full lg:w-32"
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
                    <div className="bg-[#131720] border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-xl py-32 flex flex-col items-center justify-center text-center px-4 sm:px-8">
                        <SearchX className="w-16 h-16 text-[rgba(255,255,255,0.1)] mb-6" />
                        <h3 className="text-xl font-bold text-[rgba(255,255,255,0.9)] tracking-tight">No issues found</h3>
                        <p className="text-[rgba(255,255,255,0.4)] text-sm mt-3 max-w-sm font-medium">System is clear or filters are too restrictive.</p>
                        <NotionButton
                            variant="default"
                            className="mt-8 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.08)] text-[11px] font-bold uppercase tracking-wider"
                            onClick={() => {
                                setFilters({ project: 'all', severity: 'all', status: 'all' });
                                setSearchQuery('');
                            }}
                        >
                            Reset Filters
                        </NotionButton>
                    </div>
                ) : (
                    <div className="bg-[#131720] border border-[rgba(255,255,255,0.09)] rounded-lg overflow-hidden shadow-2xl">
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[rgba(0,0,0,0.2)] border-b border-[rgba(255,255,255,0.08)]">
                                        <th className="px-5 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.12em]">T-Key</th>
                                        <th className="px-5 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.12em] w-1/3">Summary & Project</th>
                                        <th className="px-5 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.12em]">Status</th>
                                        <th className="px-5 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.12em]">Severity</th>
                                        <th className="px-5 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.12em]">Reporter/Owner</th>
                                        <th className="px-5 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.12em] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
                                    {filteredIssues.map(issue => (
                                        <tr key={issue.id} className="hover:bg-[rgba(255,255,255,0.04)] transition-all duration-300 group">
                                            <td className="px-5 py-5 text-[11px] font-bold font-mono text-[rgba(255,255,255,0.15)] group-hover:text-[#F43F5E] transition-colors">
                                                ET-{issue.id.slice(-3).toUpperCase()}
                                            </td>
                                            <td className="px-5 py-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <span
                                                        onClick={() => { setSelectedIssue(issue); setIsIssueModalOpen(true); }}
                                                        className="text-[13px] font-bold tracking-tight text-[rgba(255,255,255,0.9)] group-hover:text-[#F43F5E] transition-colors cursor-pointer hover:underline"
                                                    >
                                                        {issue.title}
                                                    </span>
                                                    {issue.project && (
                                                        <div className="flex items-center gap-2">
                                                            <Briefcase className="w-3 h-3 text-[#F43F5E]" />
                                                            <span className="text-[11px] text-[rgba(255,255,255,0.4)] font-bold uppercase tracking-wider">{issue.project.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-5">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider",
                                                    issue.status === 'OPEN' ? 'bg-[#F43F5E]/10 text-orange-400 border border-[#F43F5E]/20' :
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
                                                        issue.severity === 'CRITICAL' ? 'bg-[#E11D48] animate-pulse' :
                                                            issue.severity === 'HIGH' ? 'bg-[#FB7185]' :
                                                                issue.severity === 'MEDIUM' ? 'bg-[#FBBF24]' : 'bg-[#22D3EE]'
                                                    )} />
                                                    <span className="text-[11px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-tighter">{issue.severity}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded bg-[#0D1016] border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-bold text-white text-[11px] shadow-inner shrink-0">
                                                        {issue.owner[0]}
                                                    </div>
                                                    <span className="text-xs font-bold text-[rgba(255,255,255,0.9)] tracking-tight">{issue.owner}</span>
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

function MetricCard({ label, value, subtext, icon, color, onClick }: any) {
    const tone = ({ blue: 'blue', red: 'rose', orange: 'amber', emerald: 'emerald', green: 'emerald', purple: 'violet' } as const)[color as 'blue'] || 'blue';
    return <StatCard label={label} value={value} note={subtext} icon={icon} tone={tone} onClick={onClick} />;
}
