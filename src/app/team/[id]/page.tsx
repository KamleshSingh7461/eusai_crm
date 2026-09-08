"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    User as UserIcon,
    Mail,
    Briefcase,
    Activity,
    TrendingUp,
    TrendingDown,
    Minus,
    Calendar,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Briefcase as BriefcaseIcon,
    Shield,
    GitMerge,
    ChevronRight,
    Loader2,
    FileText,
    Target,
    BarChart3,
    Award,
    FileSpreadsheet,
    Download,
    X
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

// --- DATA INTERFACES ---

interface UserDetails {
    id: string;
    name: string | null;
    email: string;
    role: string;
    department: string | null;
    image: string | null;
    performanceScore?: number;
    performanceTrend?: 'UP' | 'DOWN' | 'NEUTRAL';
    rank?: number | null;
    reportingManagers: any[];
    reportingSubordinates: any[];
    dailyReports: any[];
    weeklyReports: any[];
    tasks: any[];
    milestones: any[];
    activeTasks: any[];
    activeMilestones: any[];
    managedProjects: any[];
}

// --- HELPER COMPONENTS ---

function ProfileMetricCard({ icon: Icon, label, value, color, description }: any) {
    const colors: any = {
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5",
        green: "text-green-400 bg-green-500/10 border-green-500/20 shadow-green-500/5",
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5",
        yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shadow-yellow-500/5",
    };

    return (
        <div className="bg-[#191919]/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={cn("p-2.5 rounded-xl border transition-transform group-hover:scale-110", colors[color])}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tighter mb-1 relative z-10">{value}</div>
            <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] relative z-10">{label}</div>
            {description && <div className="mt-4 text-[10px] font-bold text-white/20 uppercase tracking-tighter relative z-10 border-t border-white/5 pt-3">{description}</div>}
        </div>
    );
}

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<UserDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'LOGS' | 'PERFORMANCE' | 'MISSIONS'>('LOGS');
    const todayStr = new Date().toISOString().split('T')[0];
    const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState<string>(thirtyDaysAgoStr);
    const [endDate, setEndDate] = useState<string>(todayStr);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
    const [selectedReportForView, setSelectedReportForView] = useState<any | null>(null);

    const renderTruncatedCell = (text: string | null, limit: number, report: any, textColorClass: string = "text-white/80") => {
        if (!text) return <span className="text-white/20 italic">-</span>;
        if (text.length <= limit) return <p className={textColorClass}>{text}</p>;
        return (
            <div className="space-y-1">
                <p className={cn("line-clamp-2", textColorClass)} title={text}>
                    {text}
                </p>
                <button
                    type="button"
                    onClick={() => setSelectedReportForView(report)}
                    className="text-[10px] font-black text-blue-400 hover:text-blue-300 hover:underline uppercase tracking-wider inline-flex items-center gap-1"
                >
                    Read more →
                </button>
            </div>
        );
    };

    const handleExportCsv = () => {
        if (!user || !user.dailyReports || user.dailyReports.length === 0) return;

        const filtered = user.dailyReports.filter((r: any) => {
            if (!r.date) return true;
            const d = new Date(r.date).toISOString().split('T')[0];
            return d >= startDate && d <= endDate;
        });

        const reportsToExport = filtered.length > 0 ? filtered : user.dailyReports;

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

        reportsToExport.forEach((r: any) => {
            const row = [
                `"${r.date ? new Date(r.date).toLocaleDateString() : ''}"`,
                `"${(user.name || '').replace(/"/g, '""')}"`,
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
        link.setAttribute("download", `${user.name || 'Employee'}_Daily_Reports_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        if (params.id) {
            fetchUserDetails();
        }
    }, [params.id]);

    const fetchUserDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/users/${params.id}`);
            if (res.ok) {
                const data = await res.json();

                // Calculate score and trend clientside if not provided or to reinforce
                const weeklyScores = data.weeklyReports
                    .filter((r: any) => r.performanceScore !== null)
                    .map((r: any) => r.performanceScore);

                const totalMissions = data.tasks.length + data.milestones.length;
                const completedMissions = data.tasks.filter((t: any) => t.status === 'DONE').length +
                    data.milestones.filter((m: any) => m.status === 'COMPLETED').length;

                const liveCompletionRate = totalMissions > 0
                    ? Math.round((completedMissions / totalMissions) * 100)
                    : 0;

                const avgScore = weeklyScores.length > 0
                    ? Math.round(weeklyScores.reduce((a: number, b: number) => a + b, 0) / weeklyScores.length)
                    : liveCompletionRate;

                let trend: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
                if (weeklyScores.length >= 2) {
                    if (weeklyScores[0] > weeklyScores[1]) trend = 'UP';
                    else if (weeklyScores[0] < weeklyScores[1]) trend = 'DOWN';
                } else if (weeklyScores.length === 1) {
                    // Compare single report to live data if available
                    if (weeklyScores[0] > liveCompletionRate) trend = 'DOWN';
                    else if (weeklyScores[0] < liveCompletionRate) trend = 'UP';
                }

                setUser({
                    ...data,
                    performanceScore: avgScore,
                    performanceTrend: trend
                });
            }
        } catch (error) {
            console.error('Failed to fetch user details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex bg-[#0A0A0A] h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
                        <div className="absolute inset-0 blur-2xl bg-blue-500/20 animate-pulse" />
                    </div>
                    <p className="text-sm font-black text-white/40 uppercase tracking-[0.3em] animate-pulse">Decrypting Personnel Intelligence...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex bg-[#0A0A0A] h-screen items-center justify-center">
                <div className="text-center space-y-4">
                    <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto" />
                    <h2 className="text-2xl font-black text-white tracking-tighter">Access Denied: Subject Not Found</h2>
                    <Button onClick={() => router.back()}>Return to Headquarters</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10 bg-[#0A0A0A] min-h-screen text-white">
            {/* Nav Breadcrumb */}
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
                <Link href="/dashboard" className="hover:text-white transition-colors">Commander</Link>
                <ChevronRight className="w-3 h-3" />
                <Link href="/team" className="hover:text-white transition-colors">Garrison</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-blue-400">Tactical Profile</span>
            </div>

            {/* Profile Header */}
            <div className="flex flex-col lg:flex-row gap-10 items-start">
                <div className="flex-shrink-0 relative group">
                    <div className="w-40 h-40 rounded-3xl bg-[#191919]/60 border border-white/10 flex items-center justify-center text-6xl font-black shadow-2xl relative z-10 overflow-hidden">
                        {user.image ? <img src={user.image} alt={user.name || ''} className="w-full h-full object-cover" /> : user.name?.charAt(0)}
                    </div>
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl group-hover:bg-blue-500/40 transition-all rounded-3xl" />
                </div>

                <div className="flex-1 space-y-6">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-5xl font-black tracking-tighter italic bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">{user.name}</h1>
                            <span className={cn(
                                "px-4 py-1 rounded-xl text-xs font-black uppercase tracking-[0.2em] border",
                                user.role === 'DIRECTOR' ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                                    user.role === 'MANAGER' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                                        "bg-white/10 text-white/60 border-white/20"
                            )}>
                                {user.role}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-6 text-[10px] font-black text-white/40 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-blue-400" />
                                {user.email}
                            </div>
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                                {user.department || 'Tactical Operations'}
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5 text-green-400" />
                                Status: Active Combatant
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ProfileMetricCard
                            icon={TrendingUp}
                            label="Efficacy Rating"
                            value={`${user.performanceScore || 0}%`}
                            color="green"
                            description={`${user.performanceTrend === 'UP' ? 'Trending Positive' : user.performanceTrend === 'DOWN' ? 'Delta Negative' : 'Stable'}`}
                        />
                        <ProfileMetricCard
                            icon={Award}
                            label="Tactical Rank"
                            value={`#${user.rank || 'N/A'}`}
                            color="blue"
                            description="Garrison Standing"
                        />
                        <ProfileMetricCard
                            icon={Target}
                            label="Active Missions"
                            value={(user as any).activeTasks.length + (user as any).activeMilestones.length}
                            color="purple"
                            description="Current Workload"
                        />
                        <ProfileMetricCard
                            icon={BriefcaseIcon}
                            label="Resource Yield"
                            value={user.tasks.length + user.milestones.length}
                            color="yellow"
                            description="Historical Total"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 pt-10 border-t border-white/5">
                {/* Sidebar Navigation Context */}
                <div className="lg:col-span-1 space-y-10">
                    <div>
                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-6">Alignment Chain</h4>
                        <div className="space-y-4">
                            {user.reportingManagers.map((mgr: any) => (
                                <div key={mgr.id} className="flex items-center gap-4 p-4 rounded-2xl bg-[#191919]/40 border border-white/5 group hover:border-blue-500/30 transition-all cursor-pointer">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-xs border border-blue-500/20">
                                        {mgr.name?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{mgr.name}</p>
                                        <p className="text-[9px] font-black text-white/30 uppercase tracking-tighter">Commanding Officer</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-6">Tactical Contacts ({user.reportingSubordinates.length})</h4>
                        <div className="grid grid-cols-5 gap-2">
                            {user.reportingSubordinates.map((sub: any) => (
                                <div key={sub.id} title={sub.name} className="w-10 h-10 rounded-xl bg-[#191919]/60 border border-white/10 flex items-center justify-center text-[10px] font-black hover:border-blue-500 transition-all cursor-pointer">
                                    {sub.name?.[0]}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Intel Tabs */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="flex items-center gap-2 p-1 bg-[#191919]/60 backdrop-blur-xl border border-white/10 rounded-2xl w-fit">
                        <button
                            onClick={() => setActiveTab('LOGS')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'LOGS' ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-white/40 hover:text-white"
                            )}
                        >
                            Tactical Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('MISSIONS')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'MISSIONS' ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-white/40 hover:text-white"
                            )}
                        >
                            Active Missions
                        </button>
                        <button
                            onClick={() => setActiveTab('PERFORMANCE')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'PERFORMANCE' ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-white/40 hover:text-white"
                            )}
                        >
                            Performance
                        </button>
                    </div>

                    {activeTab === 'LOGS' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {/* Controls & Export Bar */}
                            <div className="bg-[#191919]/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2 text-xs">
                                        <Calendar className="w-4 h-4 text-blue-400" />
                                        <span className="font-bold text-white/60">Range:</span>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                        <span className="text-white/40">to</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>

                                    <div className="h-4 w-px bg-white/10 hidden sm:block" />

                                    {/* Presets */}
                                    <div className="flex items-center gap-1 text-[10px] font-black uppercase">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const now = new Date();
                                                const start = new Date();
                                                start.setDate(now.getDate() - 7);
                                                setStartDate(start.toISOString().split('T')[0]);
                                                setEndDate(now.toISOString().split('T')[0]);
                                            }}
                                            className="px-2.5 py-1 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
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
                                            className="px-2.5 py-1 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
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
                                            className="px-2.5 py-1 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                        >
                                            This Month
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5">
                                        <button
                                            onClick={() => setViewMode('table')}
                                            className={cn("px-3 py-1 text-[10px] font-black uppercase rounded", viewMode === 'table' ? "bg-blue-600 text-white" : "text-white/40")}
                                        >
                                            Table
                                        </button>
                                        <button
                                            onClick={() => setViewMode('cards')}
                                            className={cn("px-3 py-1 text-[10px] font-black uppercase rounded", viewMode === 'cards' ? "bg-blue-600 text-white" : "text-white/40")}
                                        >
                                            Cards
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleExportCsv}
                                        className="bg-[#36B37E] hover:bg-[#00875A] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg active:scale-95"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                        Export CSV Sheet
                                    </button>
                                </div>
                            </div>

                            {user.dailyReports.length === 0 ? (
                                <div className="p-20 border border-white/5 border-dashed rounded-3xl text-center">
                                    <p className="text-sm font-black text-white/20 uppercase tracking-widest">No intelligence logs recorded</p>
                                </div>
                            ) : viewMode === 'table' ? (
                                <div className="border border-white/10 rounded-2xl overflow-x-auto shadow-2xl bg-[#191919]/40 backdrop-blur-xl">
                                    <table className="w-full text-left border-collapse min-w-[700px]">
                                        <thead>
                                            <tr className="bg-white/[0.03] border-b border-white/10">
                                                <th className="px-5 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Date</th>
                                                <th className="px-5 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Tasks</th>
                                                <th className="px-5 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Hours</th>
                                                <th className="px-5 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Utilization</th>
                                                <th className="px-5 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Accomplishments</th>
                                                <th className="px-5 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Challenges</th>
                                                <th className="px-5 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Next Plan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-xs">
                                            {user.dailyReports
                                                .filter((r: any) => {
                                                    if (!r.date) return true;
                                                    const d = new Date(r.date).toISOString().split('T')[0];
                                                    return d >= startDate && d <= endDate;
                                                })
                                                .map((report: any) => (
                                                    <tr key={report.id} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-5 py-4 font-black text-white whitespace-nowrap">
                                                            {new Date(report.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-5 py-4 text-center font-black text-blue-400">
                                                            {report.tasksCompleted || 0}
                                                        </td>
                                                        <td className="px-5 py-4 text-center font-bold text-white/60">
                                                            {report.hoursWorked || 0}h
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <span className={cn(
                                                                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase",
                                                                (report.utilization || 0) >= 80 ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                                                                    (report.utilization || 0) >= 50 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                                                            )}>
                                                                {report.utilization || 0}%
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-white/80 max-w-[240px]">
                                                            {renderTruncatedCell(report.accomplishments, 75, report, "text-white/80")}
                                                        </td>
                                                        <td className="px-5 py-4 text-red-400/90 max-w-[200px]">
                                                            {renderTruncatedCell(report.challenges, 60, report, "text-red-400/90")}
                                                        </td>
                                                        <td className="px-5 py-4 text-white/60 max-w-[200px]">
                                                            {renderTruncatedCell(report.tomorrowPlan, 60, report, "text-white/60")}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {user.dailyReports
                                        .filter((r: any) => {
                                            if (!r.date) return true;
                                            const d = new Date(r.date).toISOString().split('T')[0];
                                            return d >= startDate && d <= endDate;
                                        })
                                        .map((report: any) => (
                                            <div key={report.id} className="bg-[#191919]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-white/20 transition-all group">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-black text-white tracking-widest uppercase">Report: Cycle {new Date(report.date).toLocaleDateString('en-GB')}</h5>
                                                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{report.project?.name || 'General Operations'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-[10px] font-black text-white/20 uppercase tracking-widest">
                                                        <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {report.hoursWorked}h Cycle</span>
                                                        <span className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> {report.tasksCompleted} Completed</span>
                                                        {report.utilization !== undefined && report.utilization !== null && (
                                                            <span className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-purple-400" /> {report.utilization}% Util</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest mb-1.5">Accomplishments</p>
                                                        <p className="text-sm text-white/80 leading-relaxed font-medium">{report.accomplishments}</p>
                                                    </div>
                                                    {report.challenges && (
                                                        <div>
                                                            <p className="text-[9px] font-black text-red-400/60 uppercase tracking-widest mb-1.5">Blocking Maneuvers</p>
                                                            <p className="text-sm text-white/60 italic leading-relaxed">{report.challenges}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'MISSIONS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] pl-2">Assigned Milestones</h4>
                                {user.activeMilestones.length === 0 ? (
                                    <p className="text-xs font-black text-white/10 uppercase italic p-6 border border-white/5 rounded-2xl">No critical milestones assigned</p>
                                ) : (
                                    user.activeMilestones.map((ms: any) => (
                                        <div key={ms.id} className="p-6 rounded-3xl bg-[#191919]/40 border border-white/5 hover:border-blue-500/30 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-[8px] font-black text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-sm uppercase tracking-widest">{ms.priority}</span>
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.1em]">{ms.progress}% Complete</span>
                                            </div>
                                            <h5 className="text-sm font-black text-white mb-2 uppercase tracking-tight">{ms.title}</h5>
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{ms.project?.name || 'GENERAL'}</span>
                                            </div>
                                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: `${ms.progress}%` }} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] pl-2">Active Tasks</h4>
                                {user.activeTasks.length === 0 ? (
                                    <p className="text-xs font-black text-white/10 uppercase italic p-6 border border-white/5 rounded-2xl">Task buffer empty</p>
                                ) : (
                                    user.activeTasks.map((task: any) => (
                                        <div key={task.id} className="p-6 rounded-3xl bg-[#191919]/40 border border-white/5 flex items-center justify-between group hover:bg-[#191919]/60 transition-all">
                                            <div>
                                                <h5 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{task.title}</h5>
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-1.5">{task.project?.name || 'GENERAL'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Deadline</p>
                                                <p className="text-[10px] font-black text-white/60">{new Date(task.deadline).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'PERFORMANCE' && (
                        <div className="bg-[#191919]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 space-y-10 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Lifecycle Performance Scoring</h4>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="text-[9px] font-black text-white/30 uppercase">Efficiency Delta</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {user.weeklyReports.map((report: any, idx: number) => (
                                    <div key={report.id} className="relative">
                                        <div className="flex justify-between items-end mb-3">
                                            <div>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Cycle Beginning {new Date(report.weekStartDate).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-black italic text-white tracking-tighter">{report.performanceScore}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-1000",
                                                    report.performanceScore >= 80 ? 'bg-green-500' : report.performanceScore >= 60 ? 'bg-blue-500' : 'bg-red-500'
                                                )}
                                                style={{ width: `${report.performanceScore}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {user.weeklyReports.length === 0 && (
                                    <p className="text-sm font-black text-white/10 uppercase text-center py-20">Insufficient performance data for predictive analysis</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Report Full Text Detail Modal */}
            {selectedReportForView && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200" onClick={() => setSelectedReportForView(null)}>
                    <div className="bg-[#1D2125] border border-[rgba(255,255,255,0.15)] rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                        Daily Report ({new Date(selectedReportForView.date).toLocaleDateString()})
                                    </h3>
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                        {selectedReportForView.user?.name || user?.name}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedReportForView(null)}
                                className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div>
                                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">Accomplishments</h4>
                                <div className="bg-[#141414] border border-white/5 p-4 rounded-xl text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                                    {selectedReportForView.accomplishments || "No details provided."}
                                </div>
                            </div>

                            {selectedReportForView.challenges && (
                                <div>
                                    <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1.5">Challenges & Impediments</h4>
                                    <div className="bg-[#141414] border border-red-500/20 p-4 rounded-xl text-sm text-red-200/90 whitespace-pre-wrap leading-relaxed">
                                        {selectedReportForView.challenges}
                                    </div>
                                </div>
                            )}

                            {selectedReportForView.tomorrowPlan && (
                                <div>
                                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5">Next Cycle Plan</h4>
                                    <div className="bg-[#141414] border border-emerald-500/20 p-4 rounded-xl text-sm text-emerald-200/90 whitespace-pre-wrap leading-relaxed">
                                        {selectedReportForView.tomorrowPlan}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.08)] pt-4 text-xs font-bold text-white/40">
                            <div className="flex items-center gap-4">
                                <span>Tasks: <strong className="text-blue-400 font-black">{selectedReportForView.tasksCompleted}</strong></span>
                                <span>Hours: <strong className="text-white font-black">{selectedReportForView.hoursWorked}h</strong></span>
                                <span>Utilization: <strong className="text-purple-400 font-black">{selectedReportForView.utilization}%</strong></span>
                            </div>
                            <button
                                onClick={() => setSelectedReportForView(null)}
                                className="px-5 py-2 bg-[#2f3437] hover:bg-[#3b4045] text-white rounded-lg text-xs font-black uppercase transition-all shadow-md active:scale-95"
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
