"use client";

import React, { useEffect, useState } from 'react';
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
    Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import UserProfileModal from '@/components/modals/UserProfileModal';
import { NotionButton } from '@/components/notion';
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
    darkBg: '#2f3437',
    darkBorder: 'rgba(255,255,255,0.08)',
    textPrimary: 'rgba(255,255,255,0.9)',
    textSecondary: 'rgba(255,255,255,0.6)'
};

const PIE_COLORS = [COLORS.blue, COLORS.green, COLORS.yellow, COLORS.red, COLORS.purple];

export default function DirectorDashboard() {
    const [data, setData] = useState<DirectorData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'overview' | 'team' | 'projects'>('overview');

    // Profile Modal State
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
        setSelectedUserId(id);
        setIsProfileModalOpen(true);
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
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[rgba(255,255,255,0.9)] mb-1 md:mb-2 tracking-tight">Director Master Hub</h1>
                    <p className="text-[rgba(255,255,255,0.7)] text-sm md:text-lg">Real-time command center for organizational performance.</p>
                </div>
                <div className="hidden md:block">
                    {/* Placeholder for future actions if needed, or remove completely */}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[rgba(255,255,255,0.09)] overflow-x-auto">
                {[
                    { id: 'overview', label: 'Organization Overview', icon: Globe },
                    { id: 'team', label: `Team Analytics (${employees.length})`, icon: Users },
                    { id: 'projects', label: `Project Portfolio (${projects.length})`, icon: Briefcase },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id as any)}
                        className={cn(
                            "px-6 py-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 relative whitespace-nowrap",
                            activeSection === tab.id
                                ? "text-[#0052CC] border-[#0052CC]"
                                : "text-[rgba(255,255,255,0.6)] border-transparent hover:text-[rgba(255,255,255,0.9)] hover:bg-[#2f3437]"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeSection === 'overview' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <MetricCard
                                icon={AlertTriangle}
                                label="Missing Reports"
                                value={stats.missingReports || 0}
                                color={stats.missingReports > 0 ? "red" : "green"}
                                subtitle={stats.missingReports > 0 ? "Action Required" : "All Clear"}
                            />
                            <MetricCard icon={Briefcase} label="Active Projects" value={stats.activeProjects} color="blue" subtitle={`${stats.taskCompletionRate}% Task Completion`} />
                            <MetricCard icon={Users} label="Total Staff" value={stats.staffCount} color="purple" subtitle="Active Personnel" />
                        </div>

                        {/* Main Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Monthly Progress Chart - Taking 2 Cols */}
                            <div className="lg:col-span-2 bg-[#2f3437] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-[rgba(255,255,255,0.9)] uppercase tracking-wider">Monthly Trajectory</h3>
                                        <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">6-Month Task Completion Trend</p>
                                    </div>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={charts.monthlyProductivity}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} dy={10} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{ backgroundColor: '#1D2125', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Bar dataKey="tasks" fill={COLORS.green} radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Recent Activity Feed - Taking 1 Col */}
                            <div className="bg-[#2f3437] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 shadow-sm flex flex-col h-[400px]">
                                <h3 className="text-sm font-bold text-[rgba(255,255,255,0.9)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-400" /> Recent Intel
                                </h3>
                                <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                    {data.globalActivity?.slice(0, 10).map((activity: any) => (
                                        <div key={activity.id} className="flex gap-3 items-start p-2 hover:bg-[rgba(255,255,255,0.03)] rounded-md transition-colors">
                                            <div className="mt-1">
                                                {activity.status === 'DONE' ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Clock className="w-4 h-4 text-orange-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-[rgba(255,255,255,0.9)] leading-tight line-clamp-2">{activity.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-[rgba(255,255,255,0.5)] uppercase truncate max-w-[80px]">{activity.assignedTo || 'Unassigned'}</span>
                                                    <span className="text-[10px] text-[rgba(255,255,255,0.3)]">•</span>
                                                    <span className="text-[10px] text-[rgba(255,255,255,0.4)]">{new Date(activity.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!data.globalActivity || data.globalActivity.length === 0) && (
                                        <p className="text-sm text-[rgba(255,255,255,0.5)] text-center py-4">No recent activity recorded.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Top Performers Widget */}
                            <div className="bg-[#2f3437] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-bold text-[rgba(255,255,255,0.9)] uppercase tracking-wider flex items-center gap-2">
                                        <Award className="w-4 h-4 text-yellow-500" /> Top Performers
                                    </h3>
                                    <NotionButton variant="ghost" size="sm">View All</NotionButton>
                                </div>
                                <div className="flex-1 space-y-4">
                                    {topPerformers.map((user, index) => (
                                        <div key={user.id} className="flex items-center gap-3 p-3 rounded-md hover:bg-[rgba(255,255,255,0.03)] transition-colors group cursor-pointer" onClick={() => openProfile(user.id)}>
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-[#1D2125] flex items-center justify-center text-[rgba(255,255,255,0.9)] font-bold overflow-hidden border border-[rgba(255,255,255,0.1)]">
                                                    {user.image ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                                                </div>
                                                {index < 3 && (
                                                    <div className={cn(
                                                        "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#2f3437]",
                                                        index === 0 ? "bg-yellow-500 text-black" :
                                                            index === 1 ? "bg-gray-300 text-black" :
                                                                "bg-amber-700 text-white"
                                                    )}>
                                                        {index + 1}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <h4 className="font-medium text-[rgba(255,255,255,0.9)] text-sm truncate group-hover:text-[#0052CC] transition-colors">{user.name}</h4>
                                                    <span className="text-xs font-bold text-[#36B37E] bg-[#36B37E]/10 px-1.5 py-0.5 rounded-full">{user.score} pts</span>
                                                </div>
                                                <p className="text-xs text-[rgba(255,255,255,0.5)] truncate">{user.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {topPerformers.length === 0 && <p className="text-sm text-[rgba(255,255,255,0.5)] text-center py-4">No performance data yet.</p>}
                                </div>
                            </div>

                            {/* Project Status Pie Chart */}
                            <div className="bg-[#2f3437] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-[rgba(255,255,255,0.9)] uppercase tracking-wider mb-2">Project Portfolio Status</h3>
                                <div className="h-[200px] w-full flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={charts.projectStatus}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {charts.projectStatus.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(0,0,0,0)" />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1D2125', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }} />
                                            <Legend verticalAlign="bottom" align="center" iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Issue Severity breakdown */}
                            <div className="bg-[#2f3437] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-[rgba(255,255,255,0.9)] uppercase tracking-wider mb-4 flex items-center justify-between">
                                    Issue Severity <span className="text-xs text-[rgba(255,255,255,0.5)]">Total: {stats.totalOpenIssues}</span>
                                </h3>
                                <div className="space-y-4">
                                    {charts.issueSeverity.map((item, index) => (
                                        <div key={index} className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-[rgba(255,255,255,0.7)]">{item.name}</span>
                                                <span className="text-[rgba(255,255,255,0.9)]">{item.value}</span>
                                            </div>
                                            <div className="w-full bg-[rgba(255,255,255,0.05)] h-2 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        item.name === 'CRITICAL' ? 'bg-[#FF5630]' :
                                                            item.name === 'HIGH' ? 'bg-[#FFAB00]' :
                                                                'bg-[#0052CC]'
                                                    )}
                                                    style={{ width: `${(item.value / stats.totalOpenIssues) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {charts.issueSeverity.length === 0 && <p className="text-xs text-[rgba(255,255,255,0.5)]">No open issues.</p>}
                                    <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)] text-center">
                                        <div className="text-2xl font-bold text-white">{stats.criticalIssues}</div>
                                        <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Critical Issues</div>
                                        <Button className="mt-3 w-full" variant="secondary" size="sm" onClick={() => (window as any).location.href = '/reports'}>Resolve Now</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Team Tab Content */}
                {activeSection === 'team' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {employees.map((emp: any) => (
                            <div key={emp.id} className="bg-[#2f3437] border border-[rgba(255,255,255,0.08)] p-5 rounded-lg hover:shadow-lg hover:border-[#0052CC]/50 transition-all group">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-[#1D2125] flex items-center justify-center text-[rgba(255,255,255,0.9)] font-bold text-lg overflow-hidden border border-[rgba(255,255,255,0.1)]">
                                        {emp.image ? <img src={emp.image} alt={emp.name} className="w-full h-full object-cover" /> : emp.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-[rgba(255,255,255,0.9)] group-hover:text-[#0052CC] transition-colors truncate">{emp.name}</h3>
                                        <p className="text-xs text-[rgba(255,255,255,0.6)] font-medium truncate">{emp.role}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-[rgba(255,255,255,0.9)]">{emp.pendingTasks}</div>
                                        <div className="text-[10px] text-[rgba(255,255,255,0.5)] font-bold uppercase tracking-wider">Open Tasks</div>
                                    </div>
                                    <div className="text-center border-l border-[rgba(255,255,255,0.08)]">
                                        <div className="text-lg font-bold text-[#0052CC]">{emp.pendingMilestones}</div>
                                        <div className="text-[10px] text-[rgba(255,255,255,0.5)] font-bold uppercase tracking-wider">Milestones</div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="w-full mt-4 h-8 text-xs bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.05)]"
                                    onClick={() => openProfile(emp.id)}
                                >
                                    View Full Profile
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Projects Tab Content */}
                {activeSection === 'projects' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-[#2f3437] border border-[rgba(255,255,255,0.08)] rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#2b3033] border-b border-[rgba(255,255,255,0.08)]">
                                        <th className="px-6 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Project Name</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Manager</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.6)] uppercase tracking-wider text-center">Tasks</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.6)] uppercase tracking-wider text-center">Milestones</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.6)] uppercase tracking-wider w-48">Progress</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                                    {projects.map((proj: any) => (
                                        <tr key={proj.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-[rgba(255,255,255,0.9)] group-hover:text-[#0052CC]">{proj.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[rgba(255,255,255,0.6)]">{proj.managerName}</td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-sm text-[10px] font-bold uppercase",
                                                    proj.status === 'ACTIVE' ? "bg-[#36B37E]/20 text-[#36B37E]" :
                                                        proj.status === 'INITIATION' ? "bg-[#FFAB00]/20 text-[#FFAB00]" :
                                                            "bg-[#0052CC]/20 text-[#0052CC]"
                                                )}>
                                                    {proj.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium text-[rgba(255,255,255,0.9)]">{proj.taskCount}</td>
                                            <td className="px-6 py-4 text-center font-medium text-[#0052CC]">{proj.milestoneCount}</td>
                                            <td className="px-6 py-4">
                                                <div className="w-full bg-[rgba(255,255,255,0.1)] h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full transition-all duration-1000", proj.progress > 70 ? "bg-[#36B37E]" : "bg-[#0052CC]")}
                                                        style={{ width: `${proj.progress}%` }}
                                                    />
                                                </div>
                                                <div className="text-right text-[10px] text-[rgba(255,255,255,0.5)] mt-1">{proj.progress}%</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Profile Modal */}
                <UserProfileModal
                    userId={selectedUserId}
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                />
            </div>
        </div>
    );
}

// --- HELPER COMPONENTS ---

function MetricCard({ icon: Icon, label, value, color, trend, subtitle }: any) {
    const colors: any = {
        blue: "text-[#0052CC] bg-[#0052CC]/10",
        green: "text-[#36B37E] bg-[#36B37E]/10",
        indigo: "text-[#6554C0] bg-[#6554C0]/10",
        purple: "text-[#998DD9] bg-[#998DD9]/10"
    };

    return (
        <div className="group bg-[#2f3437] p-6 rounded-lg border border-[rgba(255,255,255,0.08)] shadow-sm hover:shadow-md hover:border-[#0052CC]/30 transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2.5 rounded-lg transition-transform group-hover:scale-110 duration-200", colors[color])}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-xs font-bold text-[#36B37E] bg-[#36B37E]/10 px-2 py-0.5 rounded-full">
                        <ArrowUpRight className="w-3 h-3" /> {trend}
                    </div>
                )}
            </div>
            <div>
                <div className="text-2xl font-bold text-[rgba(255,255,255,0.9)] tracking-tight">{value}</div>
                <div className="text-xs text-[rgba(255,255,255,0.5)] font-medium uppercase tracking-wider mt-1">{label}</div>
                {subtitle && <div className="text-[10px] text-[rgba(255,255,255,0.4)] mt-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">{subtitle}</div>}
            </div>
        </div>
    );
}
