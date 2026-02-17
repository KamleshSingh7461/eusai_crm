"use client";

import React, { useEffect, useState } from 'react';
import PortfolioPulse from './PortfolioPulse';
import WorkspaceHealthWidget from './WorkspaceHealthWidget';
import WorkActivityFeed from './WorkActivityFeed';
import {
    Users,
    TrendingUp,
    Globe,
    Building2,
    Loader2,
    CheckCircle2,
    Clock,
    Target,
    Layout,
    Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import UserProfileModal from '@/components/modals/UserProfileModal';
import { TemplateCard, StatusBadge, NotionButton, EmptyState } from '@/components/notion';
import { FileText, Bug, ListTodo, Rocket } from 'lucide-react';

interface DirectorData {
    stats: {
        partnerCount: number;
        totalRevenue: number;
        staffCount: number;
        marketCoverage: number;
        criticalIssues: number;
        totalOpenIssues: number;
        taskCompletionRate: number;
        activeProjects: number;
    };
    employees: any[];
    projects: any[];
    spaceDistribution: any[];
    recentMilestones: any[];
    globalActivity: any[];
}

export default function DirectorDashboard() {
    const [data, setData] = useState<DirectorData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
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
                }
            } catch (error) {
                console.error("Failed to fetch director dashboard data:", error);
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
            <div className="flex bg-[#3b4045] h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#0052CC]" />
                    <p className="text-sm font-medium text-[rgba(255,255,255,0.7)] animate-pulse">Gathering organizational intelligence...</p>
                </div>
            </div>
        );
    }

    const { stats, employees, projects, spaceDistribution, recentMilestones, globalActivity } = data || {
        stats: {
            partnerCount: 0,
            totalRevenue: 0,
            staffCount: 0,
            marketCoverage: 0,
            criticalIssues: 0,
            totalOpenIssues: 0,
            taskCompletionRate: 0,
            activeProjects: 0
        },
        employees: [],
        projects: [],
        spaceDistribution: [],
        recentMilestones: [],
        globalActivity: []
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[rgba(255,255,255,0.9)] mb-1 md:mb-2 tracking-tight">Director Master Hub</h1>
                    <p className="text-[rgba(255,255,255,0.7)] text-sm md:text-lg">Consolidated view of team performance and project health.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" leftIcon={<Globe className="w-4 h-4" />}>
                        Org Map
                    </Button>
                    <Button variant="primary" size="sm" leftIcon={<Target className="w-4 h-4" />}>
                        Set Targets
                    </Button>
                </div>
            </div>

            {/* 🎨 NOTION COMPONENTS DEMO SECTION */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 style={{ color: 'var(--notion-text-primary)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
                            Quick Access Templates
                        </h2>
                        <p style={{ color: 'var(--notion-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                            Jump into key workflows with pre-configured views
                        </p>
                    </div>
                    <NotionButton variant="ghost" size="sm">
                        View All
                    </NotionButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <TemplateCard
                        title="Issue Tracking"
                        description="Resolve issues and feedback fast."
                        icon={Bug}
                        iconBgColor="#ef4444"
                        badges={['in-progress', 'done']}
                        preview={{
                            type: 'table',
                            items: ['Critical bug in auth', 'Performance lag', 'UI glitch']
                        }}
                        href="/issues"
                    />

                    <TemplateCard
                        title="Documentation Hub"
                        description="Organize knowledge with your team."
                        icon={FileText}
                        iconBgColor="#8b5cf6"
                        badges={['not-started', 'under-review']}
                        preview={{
                            type: 'list',
                            items: ['API Reference Guide', 'Onboarding Process', 'Architecture Overview']
                        }}
                        href="/library"
                    />

                    <TemplateCard
                        title="Tasks Tracker"
                        description="Stay organized with tasks, your way."
                        icon={ListTodo}
                        iconBgColor="#10b981"
                        badges={['done', 'in-progress']}
                        preview={{
                            type: 'table',
                            items: ['Review Q4 budget', 'Team standup', 'Client demo prep']
                        }}
                        href="/tasks"
                    />

                    <TemplateCard
                        title="Feature Requests"
                        description="Manage feature requests end-to-end."
                        icon={Rocket}
                        iconBgColor="#f59e0b"
                        badges={['planned', 'under-review']}
                        preview={{
                            type: 'list',
                            items: ['Dark mode support', 'Export to Excel', 'Mobile app']
                        }}
                        onClick={() => console.log('Feature requests clicked')}
                    />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[rgba(255,255,255,0.09)]">
                {[
                    { id: 'overview', label: 'Organization Overview', icon: Globe },
                    { id: 'team', label: `Team Analytics (${employees.length})`, icon: Users },
                    { id: 'projects', label: `Project Portfolio (${projects.length})`, icon: Briefcase },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id as any)}
                        className={cn(
                            "px-6 py-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 relative",
                            activeSection === tab.id
                                ? "text-[#0052CC] border-[#0052CC]"
                                : "text-subheading border-transparent hover:text-[rgba(255,255,255,0.9)] hover:bg-[#3b4045]"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeSection === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* High-Level Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <MetricCard icon={Building2} label="Partner Universities" value={stats.partnerCount} color="indigo" />
                        <MetricCard icon={TrendingUp} label="Total Revenue (YTD)" value={`₹${(stats.totalRevenue / 10000000).toFixed(1)}Cr`} color="green" />
                        <MetricCard icon={Users} label="Total Staff" value={stats.staffCount} color="blue" />
                        <MetricCard icon={Target} label="Market Coverage" value={`${stats.marketCoverage}%`} color="purple" />
                    </div>

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#2f3437] p-5 border border-[rgba(255,255,255,0.09)] rounded-sm shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider">Task Completion</span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">{stats.taskCompletionRate}%</div>
                            <div className="h-1.5 w-full bg-[#F4F5F7] rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${stats.taskCompletionRate}%` }} />
                            </div>
                        </div>
                        <div className="bg-[#2f3437] p-5 border border-[rgba(255,255,255,0.09)] rounded-sm shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider">Active Projects</span>
                                <Briefcase className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">{stats.activeProjects}</div>
                            <p className="text-xs text-[rgba(255,255,255,0.7)] mt-1">Currently in execution</p>
                        </div>
                        <div className="bg-[#2f3437] p-5 border border-[rgba(255,255,255,0.09)] rounded-sm shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider">Open Issues</span>
                                <Clock className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="text-2xl font-bold text-orange-600">{stats.totalOpenIssues}</div>
                            <p className="text-xs text-[rgba(255,255,255,0.7)] mt-1">{stats.criticalIssues} critical priority</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-10">
                            <section>
                                <SectionHeader title="Portfolio Pulse" badge="Per Space Breakdown" />
                                <PortfolioPulse data={spaceDistribution} />
                            </section>

                            <section>
                                <SectionHeader title="Global Activity Feed" badge="Organization Wide" />
                                <WorkActivityFeed data={{
                                    milestones: recentMilestones,
                                    activity: globalActivity,
                                    actions: [] // Could map specific director actions here
                                }} />
                            </section>
                        </div>

                        <div className="space-y-8">
                            <WorkspaceHealthWidget stats={{ critical: stats.criticalIssues, total: stats.totalOpenIssues }} />

                            {/* Revenue Trend */}
                            {(data as any)?.revenueTrend && (
                                <div className="bg-[#2f3437] p-6 border border-[rgba(255,255,255,0.09)] rounded-sm shadow-sm">
                                    <h3 className="text-xs font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Revenue Trend (3M)
                                    </h3>
                                    <div className="space-y-3">
                                        {(data as any).revenueTrend.map((item: any, i: number) => (
                                            <div key={i}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-[rgba(255,255,255,0.7)]">{item.month}</span>
                                                    <span className="font-bold text-[rgba(255,255,255,0.9)]">₹{(item.revenue / 100000).toFixed(1)}L</span>
                                                </div>
                                                <div className="h-2 bg-[#DFE1E6] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500"
                                                        style={{
                                                            width: `${Math.min(100, (item.revenue / Math.max(...(data as any).revenueTrend.map((r: any) => r.revenue))) * 100)}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Target achievement */}
                            <div className="bg-[#2f3437] p-6 border border-[rgba(255,255,255,0.09)] rounded-sm shadow-sm">
                                <h3 className="text-xs font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-widest mb-4">Target Achievement</h3>
                                <div className="space-y-4">
                                    <TargetProgress label="Annual Revenue" current={stats.totalRevenue} target={100000000} format="currency" />
                                    <TargetProgress label="New Partnerships" current={stats.partnerCount} target={50} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'team' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {employees.map((emp: any) => (
                        <div key={emp.id} className="bg-[#2f3437] border border-[rgba(255,255,255,0.09)] p-5 rounded-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-[#F4F5F7] flex items-center justify-center text-[rgba(255,255,255,0.9)] font-bold text-lg overflow-hidden border border-[rgba(255,255,255,0.09)]">
                                    {emp.image ? <img src={emp.image} alt={emp.name} className="w-full h-full object-cover" /> : emp.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-[rgba(255,255,255,0.9)] group-hover:text-[#0052CC] transition-colors">{emp.name}</h3>
                                    <p className="text-xs text-[rgba(255,255,255,0.7)] font-medium">{emp.role}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F4F5F7]">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-[rgba(255,255,255,0.9)]">{emp.pendingTasks}</div>
                                    <div className="text-[10px] text-[rgba(255,255,255,0.7)] font-bold uppercase tracking-wider">Open Tasks</div>
                                </div>
                                <div className="text-center border-l border-[#F4F5F7]">
                                    <div className="text-lg font-bold text-[#0052CC]">{emp.pendingMilestones}</div>
                                    <div className="text-[10px] text-[rgba(255,255,255,0.7)] font-bold uppercase tracking-wider">Milestones</div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full mt-4 h-8 text-xs"
                                onClick={() => openProfile(emp.id)}
                            >
                                View Full Profile
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {activeSection === 'projects' && (
                <div className="bg-[#2f3437] border border-[rgba(255,255,255,0.09)] rounded-sm shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#3b4045] border-b border-[rgba(255,255,255,0.09)]">
                                <th className="px-6 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider">Project Name</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider">Manager</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider text-center">Tasks</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider text-center">Milestones</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-wider w-48">Progress</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DFE1E6]">
                            {projects.map((proj: any) => (
                                <tr key={proj.id} className="hover:bg-[#3b4045] transition-colors cursor-pointer group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-[rgba(255,255,255,0.9)] group-hover:text-[#0052CC]">{proj.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-subheading">{proj.managerName}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded-sm text-[10px] font-bold uppercase",
                                            proj.status === 'ACTIVE' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                        )}>
                                            {proj.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium text-[rgba(255,255,255,0.9)]">{proj.taskCount}</td>
                                    <td className="px-6 py-4 text-center font-medium text-[#0052CC]">{proj.milestoneCount}</td>
                                    <td className="px-6 py-4">
                                        <div className="w-full bg-[#DFE1E6] h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-[#36B37E] h-full"
                                                style={{ width: `${proj.progress}%` }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Profile Modal */}
            <UserProfileModal
                userId={selectedUserId}
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, color }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        indigo: "bg-indigo-50 text-indigo-600",
        purple: "bg-purple-50 text-purple-600"
    };

    return (
        <div className="group bg-[#2f3437] p-6 rounded-sm border border-[rgba(255,255,255,0.09)] shadow-sm hover:shadow-md transition-all flex items-center gap-5 relative overflow-hidden">
            <div className={cn("absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full opacity-50 transition-transform group-hover:scale-110", colors[color].split(' ')[0])} />
            <div className={cn("p-3 rounded-lg relative z-10", colors[color])}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="relative z-10">
                <div className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">{value}</div>
                <div className="text-[10px] text-[rgba(255,255,255,0.7)] font-bold uppercase tracking-widest mt-0.5">{label}</div>
            </div>
        </div>
    );
}

function SectionHeader({ title, badge }: { title: string, badge: string }) {
    return (
        <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[11px] font-bold text-[rgba(255,255,255,0.7)] uppercase tracking-[0.2em]">{title}</h2>
            <span className="text-[10px] font-bold text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded-full">{badge}</span>
        </div>
    );
}

function TargetProgress({ label, current, target, format }: { label: string, current: number, target: number, format?: 'currency' }) {
    const progress = Math.min((current / target) * 100, 100);
    const displayCurrent = format === 'currency' ? `₹${(current / 10000000).toFixed(1)}Cr` : current;
    const displayTarget = format === 'currency' ? `₹${(target / 10000000).toFixed(1)}Cr` : target;

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium">
                <span className="text-subheading">{label}</span>
                <span className="text-[rgba(255,255,255,0.9)] font-bold">{displayCurrent} / {displayTarget}</span>
            </div>
            <div className="w-full bg-[#DFE1E6] h-1.5 rounded-full overflow-hidden">
                <div
                    className={cn("h-full transition-all duration-1000", progress > 70 ? "bg-[#36B37E]" : "bg-[#FFAB00]")}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
