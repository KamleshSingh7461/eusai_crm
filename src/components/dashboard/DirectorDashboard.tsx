"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/ui/Avatar';
import {
    Users,
    Globe,
    Building2,
    Loader2,
    Briefcase,
    Award,
    ArrowUpRight,
    Bug,
    Target,
    AlertTriangle,
    CheckCircle2,
    Activity,
    Clock,
    TrendingUp,
    ShieldAlert,
    ChevronRight,
    Search,
    Filter,
    BarChart3,
    Table,
    PieChart as PieIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
// import UserProfileModal from '@/components/modals/UserProfileModal';
import { NotionButton } from '@/components/notion';
import DashboardAISummary from '@/components/dashboard/DashboardAISummary';
import {
    XAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

// --- DATA INTERFACES ---

interface ChartData {
    name: string;
    value: number;
    tasks?: number;
}

interface DirectorData {
    stats: {
        partnerCount: number;
        staffCount: number;
        marketCoverage: number;
        criticalIssues: number;
        totalOpenIssues: number;
        taskCompletionRate: number;
        activeProjects: number;
        missingReports: number;
    };
    employees: any[];
    topPerformers: {
        id: string;
        name: string;
        image: string | null;
        role: string;
        score: number;
    }[];
    projects: any[];
    spaceDistribution: any[];
    recentMilestones: any[];
    globalActivity: any[];
    charts: {
        weeklyProductivity: { day: string; tasks: number }[];
        monthlyProductivity: { name: string; tasks: number }[];
        taskStatus: ChartData[];
        projectStatus: ChartData[];
        issueSeverity: ChartData[];
    };
}

// --- COLORS ---
const COLORS = {
    blue: '#0052CC',
    green: '#36B37E',
    red: '#FF5630',
    yellow: '#FFAB00',
    purple: '#6554C0',
    teal: '#00B8D9',
    darkBg: '#191919',
    glassBg: 'rgba(25,25,25,0.6)',
    glassBorder: 'rgba(255,255,255,0.08)',
    textPrimary: 'rgba(255,255,255,0.95)',
    textSecondary: 'rgba(255,255,255,0.7)',
    textTertiary: 'rgba(255,255,255,0.4)'
};

const PIE_COLORS = [COLORS.blue, COLORS.green, COLORS.yellow, COLORS.red, COLORS.purple];

export default function DirectorDashboard() {
    const router = useRouter();
    const [data, setData] = useState<DirectorData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'overview' | 'team' | 'projects'>('overview');

    // Profile Modal State - Deprecated for new profile page
    // const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    // const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    useEffect(() => {
        const fetchDirectorData = async () => {
            try {
                const response = await fetch('/api/dashboard/director');
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                } else {
                    const err = await response.json();
                    setError(err.details || err.error || "Failed to load data");
                }
            } catch (error: any) {
                console.error("Failed to fetch director dashboard data:", error);
                setError(error.message || "Connection failed");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDirectorData();
    }, []);

    const openProfile = (id: string) => {
        router.push(`/team/${id}`);
    };

    if (isLoading) {
        return (
            <div className="flex bg-[#191919] h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#0052CC]" />
                    <p className="text-sm font-medium text-[rgba(255,255,255,0.7)] animate-pulse">Gathering organizational intelligence...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="p-4 rounded-full bg-red-500/10 text-red-500">
                    <Bug className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Dashboard Unavailable</h3>
                <p className="text-[rgba(255,255,255,0.5)] max-w-md">
                    {error || "We couldn't load the command center data. This might be due to a connection issue or missing permissions."}
                </p>
                {error && (
                    <div className="p-2 bg-black/30 rounded text-xs text-mono text-red-400 max-w-lg overflow-auto">
                        {JSON.stringify(error)}
                    </div>
                )}
                <Button variant="primary" onClick={() => window.location.reload()}>
                    Reload Dashboard
                </Button>
            </div>
        );
    }

    const { stats, employees, topPerformers, projects, charts } = data;

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight font-display">Director Master Hub</h1>
                    <p className="text-[rgba(255,255,255,0.6)] text-sm md:text-lg font-medium">Real-time command center for organizational intelligence.</p>
                </div>
                <div className="flex items-center gap-3">
                    <NotionButton variant="ghost" className="bg-white/5 border border-white/10 hover:bg-white/10">
                        <Filter className="w-4 h-4 mr-2" /> Global Filter
                    </NotionButton>
                    <NotionButton variant="primary" className="bg-[#0052CC] hover:bg-[#0747A6] shadow-lg shadow-[#0052CC]/20">
                        <Activity className="w-4 h-4 mr-2" /> Analytics Report
                    </NotionButton>
                </div>
            </div>

            {/* AI Summary Section */}
            <DashboardAISummary role="DIRECTOR" contextData={data} />

            {/* Navigation Tabs */}
            <div className="flex border-b border-[rgba(255,255,255,0.08)] overflow-x-auto no-scrollbar">
                {[
                    { id: 'overview', label: 'Organization Pulse', icon: Globe },
                    { id: 'team', label: `Staff Analytics (${employees.length})`, icon: Users },
                    { id: 'projects', label: `Project Portfolio (${projects.length})`, icon: Briefcase },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id as any)}
                        className={cn(
                            "px-8 py-5 text-sm font-bold flex items-center gap-2.5 transition-all relative whitespace-nowrap group",
                            activeSection === tab.id
                                ? "text-[#0052CC]"
                                : "text-[rgba(255,255,255,0.5)] hover:text-white"
                        )}
                    >
                        <tab.icon className={cn("w-4.5 h-4.5", activeSection === tab.id ? "text-[#0052CC]" : "text-[rgba(255,255,255,0.4)] group-hover:text-white")} />
                        {tab.label}
                        {activeSection === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0052CC] shadow-[0_0_10px_rgba(0,82,204,0.5)]" />
                        )}
                    </button>
                ))}
            </div>

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeSection === 'overview' && (
                    <div className="space-y-8">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Link href="/reports?activeTab=TEAM" className="block">
                                <MetricCard
                                    icon={AlertTriangle}
                                    label="Missing Reports"
                                    value={stats.missingReports || 0}
                                    color={stats.missingReports > 0 ? "red" : "green"}
                                    subtitle={stats.missingReports > 0 ? "Urgent Action Required" : "All submissions received"}
                                />
                            </Link>
                            <Link href="/projects" className="block">
                                <MetricCard
                                    icon={Briefcase}
                                    label="Active Projects"
                                    value={stats.activeProjects}
                                    color="blue"
                                    subtitle={`${stats.taskCompletionRate}% Operational Efficiency`}
                                />
                            </Link>
                            <Link href="/team" className="block">
                                <MetricCard
                                    icon={Users}
                                    label="Total Staff"
                                    value={stats.staffCount}
                                    color="purple"
                                    subtitle="Active reporting personnel"
                                />
                            </Link>
                            <Link href="/issues?status=CRITICAL" className="block">
                                <MetricCard
                                    icon={ShieldAlert}
                                    label="Critical Risks"
                                    value={stats.criticalIssues}
                                    color="red"
                                    subtitle="Threats requiring immediate focus"
                                />
                            </Link>
                        </div>

                        {/* Main Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Monthly Progress Chart - Taking 2 Cols */}
                            <div className="lg:col-span-2 bg-[#191919]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <div>
                                        <h3 className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-[#36B37E]" /> Velocity Tracking
                                        </h3>
                                        <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1 font-medium">Monthly organizational throughput trend</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#36B37E]/20 border border-[#36B37E]/50" />
                                        <div className="w-3 h-3 rounded-full bg-[#36B37E]/20 border border-[#36B37E]/50" />
                                    </div>
                                </div>
                                <div className="h-[320px] w-full relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={charts.monthlyProductivity}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={10} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                                contentStyle={{ backgroundColor: '#191919', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                                                itemStyle={{ color: '#36B37E', fontWeight: 'bold' }}
                                            />
                                            <Bar dataKey="tasks" fill={COLORS.green} radius={[6, 6, 0, 0]} barSize={32} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Recent Activity Feed - Taking 1 Col */}
                            <div className="bg-[#191919]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col h-[460px] relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-400" /> Operational Intel
                                    </h3>
                                    <Link href="/recent" className="text-[10px] font-bold text-blue-400 hover:underline uppercase">Full Feed</Link>
                                </div>
                                <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                    {data.globalActivity?.slice(0, 8).map((activity: any) => (
                                        <div key={activity.id} className="flex gap-4 items-start p-3 hover:bg-white/5 rounded-xl transition-all group/item cursor-pointer border border-transparent hover:border-white/5">
                                            <div className="mt-1 flex-shrink-0">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover/item:scale-110",
                                                    activity.status === 'DONE' ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
                                                )}>
                                                    {activity.status === 'DONE' ? (
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    ) : (
                                                        <Clock className="w-4 h-4" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover/item:text-blue-400 transition-colors">{activity.title}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] font-bold text-[rgba(255,255,255,0.4)] uppercase truncate max-w-[80px] px-1.5 py-0.5 rounded bg-white/5">{activity.assignedTo || 'Unassigned'}</span>
                                                    <span className="text-[10px] text-[rgba(255,255,255,0.4)] font-medium">{new Date(activity.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!data.globalActivity || data.globalActivity.length === 0) && (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <Activity className="w-12 h-12 text-white/5 mb-3" />
                                            <p className="text-sm text-[rgba(255,255,255,0.3)] font-medium">No activity intelligence available.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Top Performers Widget */}
                            <div className="bg-[#191919]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                        <Award className="w-5 h-5 text-yellow-500" /> Executive Ranking
                                    </h3>
                                    <Link href="/reports/performance" className="text-[10px] font-bold text-blue-400 hover:underline uppercase">All Analytics</Link>
                                </div>
                                <div className="flex-1 space-y-5 relative z-10">
                                    {topPerformers.map((user, index) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group/item cursor-pointer"
                                            onClick={() => openProfile(user.id)}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div className="w-12 h-12 rounded-xl bg-[#1D2125] flex items-center justify-center text-white font-bold overflow-hidden border border-white/10 shadow-lg">
                                                    <Avatar src={user.image} alt={user.name} fallback={user.name.charAt(0)} className="w-full h-full object-cover" />
                                                </div>
                                                {index < 3 && (
                                                    <div className={cn(
                                                        "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-[#191919] shadow-lg",
                                                        index === 0 ? "bg-yellow-500 text-black" :
                                                            index === 1 ? "bg-gray-300 text-black" :
                                                                "bg-amber-700 text-white"
                                                    )}>
                                                        {index + 1}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-bold text-white text-sm truncate group-hover/item:text-blue-400 transition-colors tracking-tight">{user.name}</h4>
                                                    <span className="text-[11px] font-black text-[#36B37E] bg-[#36B37E]/20 px-2 py-0.5 rounded-lg border border-[#36B37E]/30">{user.score}</span>
                                                </div>
                                                <p className="text-xs text-[rgba(255,255,255,0.4)] font-bold uppercase tracking-tight truncate">{user.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {topPerformers.length === 0 && <p className="text-sm text-[rgba(255,255,255,0.3)] text-center py-10 font-medium">No performance analytics established.</p>}
                                </div>
                            </div>

                            {/* Project Status Pie Chart */}
                            <div className="bg-[#191919]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                                    <PieIcon className="w-4 h-4 text-purple-400" /> Strategic Distribution
                                </h3>
                                <div className="h-[240px] w-full flex items-center justify-center relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={charts.projectStatus}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={95}
                                                paddingAngle={6}
                                                dataKey="value"
                                            >
                                                {charts.projectStatus.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(0,0,0,0)" />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#191919', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', backdropFilter: 'blur(10px)' }} />
                                            <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Issue Severity breakdown */}
                            <div className="bg-[#191919]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group flex flex-col">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-between relative z-10">
                                    Risk Exposure <span className="text-[10px] font-bold text-white/30 tracking-tighter">Total Active: {stats.totalOpenIssues}</span>
                                </h3>
                                <div className="space-y-6 relative z-10 flex-1">
                                    {charts.issueSeverity.map((item, index) => (
                                        <div key={index} className="space-y-2">
                                            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                                                <span className="text-[rgba(255,255,255,0.5)]">{item.name}</span>
                                                <span className="text-white">{item.value}</span>
                                            </div>
                                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000",
                                                        item.name === 'CRITICAL' ? 'bg-[#FF5630] shadow-[0_0_10px_rgba(255,86,48,0.5)]' :
                                                            item.name === 'HIGH' ? 'bg-[#FFAB00] shadow-[0_0_10px_rgba(255,171,0,0.5)]' :
                                                                'bg-[#0052CC] shadow-[0_0_10px_rgba(0,82,204,0.5)]'
                                                    )}
                                                    style={{ width: `${(item.value / (stats.totalOpenIssues || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {charts.issueSeverity.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-6 text-center">
                                            <CheckCircle2 className="w-10 h-10 text-green-500/20 mb-2" />
                                            <p className="text-xs text-[rgba(255,255,255,0.4)] font-bold uppercase">Zero Threats Detected</p>
                                        </div>
                                    )}
                                    <div className="mt-auto pt-6 border-t border-white/10 text-center">
                                        <div className="flex items-center justify-center gap-4 mb-4">
                                            <div>
                                                <div className="text-3xl font-black text-white">{stats.criticalIssues}</div>
                                                <div className="text-[9px] text-red-400 font-black uppercase tracking-wider">Critical</div>
                                            </div>
                                            <div className="w-px h-8 bg-white/10" />
                                            <div>
                                                <div className="text-2xl font-black text-white/60">{stats.totalOpenIssues - stats.criticalIssues}</div>
                                                <div className="text-[9px] text-white/30 font-black uppercase tracking-wider">Total</div>
                                            </div>
                                        </div>
                                        <Link href="/issues" className="block w-full">
                                            <Button className="w-full bg-red-500 hover:bg-red-600 border-none shadow-lg shadow-red-500/20 text-white font-black uppercase tracking-widest text-[10px]" size="sm" onClick={() => (window as any).location.href = '/issues'}>
                                                Initiate Counter-Measures
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Team Tab Content */}
                {activeSection === 'team' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {employees.map((emp: any) => (
                            <div
                                key={emp.id}
                                className="bg-[#191919]/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl hover:shadow-[#0052CC]/5 hover:border-[#0052CC]/40 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                    <Users className="w-20 h-20" />
                                </div>
                                <div className="relative z-10 flex items-center gap-6 mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-[#1D2125] flex items-center justify-center text-white font-bold text-2xl overflow-hidden border border-white/10 shadow-xl group-hover:scale-105 transition-transform">
                                        <Avatar src={emp.image} alt={emp.name} fallback={emp.name.charAt(0)} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors truncate tracking-tight">{emp.name}</h3>
                                        <p className="text-xs text-[rgba(255,255,255,0.4)] font-black uppercase tracking-widest truncate">{emp.role}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10 relative z-10">
                                    <div className="space-y-1">
                                        <div className="text-2xl font-black text-white tracking-tighter">{emp.pendingTasks}</div>
                                        <div className="text-[10px] text-[rgba(255,255,255,0.3)] font-black uppercase tracking-widest">Active Ops</div>
                                    </div>
                                    <div className="space-y-1 border-l border-white/10 pl-6">
                                        <div className="text-2xl font-black text-[#0052CC] tracking-tighter">{emp.pendingMilestones}</div>
                                        <div className="text-[10px] text-[rgba(255,255,255,0.3)] font-black uppercase tracking-widest">Key Goals</div>
                                    </div>
                                </div>
                                <div className="mt-8 flex gap-3 relative z-10">
                                    <Button
                                        variant="primary"
                                        className="h-10 text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 flex-1 border-none shadow-lg shadow-blue-600/20"
                                        onClick={() => openProfile(emp.id)}
                                    >
                                        Execute Profile deep-dive
                                    </Button>
                                    <Link href={`/reports?type=team&q=${emp.name}`} className="h-10 w-10 shrink-0">
                                        <Button variant="ghost" className="h-full w-full p-0 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl flex items-center justify-center">
                                            <Table className="w-4 h-4 text-white" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Projects Tab Content */}
                {activeSection === 'projects' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="bg-[#191919]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/2 to-transparent pointer-events-none" />
                            <table className="w-full text-left border-collapse relative z-10">
                                <thead>
                                    <tr className="bg-white/2 border-b border-white/10">
                                        <th className="px-8 py-6 text-[10px] font-black text-[rgba(255,255,255,0.4)] uppercase tracking-widest">Project Mission</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-[rgba(255,255,255,0.4)] uppercase tracking-widest">Manager</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-[rgba(255,255,255,0.4)] uppercase tracking-widest">Tactical Status</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-[rgba(255,255,255,0.4)] uppercase tracking-widest text-center">Ops</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-[rgba(255,255,255,0.4)] uppercase tracking-widest text-center">Milestones</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-[rgba(255,255,255,0.4)] uppercase tracking-widest">Completion</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {projects.map((proj: any) => (
                                        <tr
                                            key={proj.id}
                                            className="hover:bg-white/[0.03] transition-all cursor-pointer group"
                                            onClick={() => (window as any).location.href = `/projects/${proj.id}`}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="font-bold text-white group-hover:text-blue-400 transition-colors text-base tracking-tight">{proj.name}</div>
                                                <div className="text-[10px] text-[rgba(255,255,255,0.3)] font-bold mt-1 tracking-widest uppercase truncate max-w-[200px]">ID: {proj.id.substring(0, 8)}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 text-[10px] font-black">
                                                        {proj.managerName?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="text-sm font-bold text-[rgba(255,255,255,0.7)] group-hover:text-white transition-colors">{proj.managerName}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                    proj.status === 'ACTIVE' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                        proj.status === 'INITIATION' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                                            "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                                )}>
                                                    {proj.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="font-black text-white text-base">{proj.taskCount}</div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="font-black text-[#0052CC] text-base">{proj.milestoneCount}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                                                    <div
                                                        className={cn("h-full transition-all duration-1000", proj.progress > 70 ? "bg-[#36B37E] shadow-[0_0_8px_rgba(54,179,126,0.3)]" : "bg-[#0052CC] shadow-[0_0_8px_rgba(0,82,204,0.3)]")}
                                                        style={{ width: `${proj.progress}%` }}
                                                    />
                                                </div>
                                                <div className="text-right text-[11px] font-black text-white/40 mt-2 tracking-tighter">{proj.progress}%</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {projects.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-20 text-center">
                                                <Briefcase className="w-16 h-16 text-white/5 mx-auto mb-4" />
                                                <p className="text-sm text-[rgba(255,255,255,0.3)] font-bold uppercase tracking-widest">No active project missions</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Profile Modal - Deprecated
                <UserProfileModal
                    userId={selectedUserId}
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                /> */}
            </div>
        </div>
    );
}

// --- HELPER COMPONENTS ---

function MetricCard({ icon: Icon, label, value, color, trend, subtitle }: any) {
    const colors: any = {
        blue: "text-[#0052CC] bg-[#0052CC]/10 border-[#0052CC]/30",
        green: "text-[#36B37E] bg-[#36B37E]/10 border-[#36B37E]/30",
        red: "text-[#FF5630] bg-[#FF5630]/10 border-[#FF5630]/30",
        purple: "text-[#6554C0] bg-[#6554C0]/10 border-[#6554C0]/30",
    };

    return (
        <div className="group bg-[#191919]/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl hover:border-white/30 transition-all relative overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={cn("p-3 rounded-xl transition-all group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] border", colors[color])}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#36B37E] bg-[#36B37E]/20 px-3 py-1 rounded-full border border-[#36B37E]/30">
                        <ArrowUpRight className="w-3.5 h-3.5" /> {trend}
                    </div>
                )}
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1" />
            </div>

            <div className="relative z-10">
                <div className="text-4xl font-black text-white tracking-tighter mb-1 font-display group-hover:text-blue-400 transition-colors">{value}</div>
                <div className="text-[10px] text-[rgba(255,255,255,0.4)] font-black uppercase tracking-[0.2em] mb-3">{label}</div>
                {subtitle && (
                    <div className="text-[9px] text-[rgba(255,255,255,0.3)] font-black tracking-wider uppercase leading-relaxed border-t border-white/5 pt-3 group-hover:text-white/60 transition-colors">
                        {subtitle}
                    </div>
                )}
            </div>

            {/* Background glow effect */}
            <div className={cn(
                "absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-all duration-700",
                color === 'blue' ? 'bg-[#0052CC]' : color === 'green' ? 'bg-[#36B37E]' : color === 'red' ? 'bg-[#FF5630]' : 'bg-[#6554C0]'
            )} />
        </div>
    );
}
