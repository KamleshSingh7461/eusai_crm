"use client";

import { useEffect, useState } from 'react';
import {
    Users,
    Briefcase,
    CheckSquare,
    Shield,
    ArrowRight,
    TrendingUp,
    Database,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // We'll use the existing stats API but augment it if needed
                const res = await fetch('/api/stats');
                const data = await res.json();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch admin stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
            </div>
        );
    }

    const adminCards = [
        {
            title: 'User Management',
            desc: 'Control accounts, roles, and permissions',
            icon: Users,
            href: '/admin/users',
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            title: 'System Logs',
            desc: 'View recent administrative actions',
            icon: Database,
            href: '#',
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        },
        {
            title: 'Platform Health',
            desc: 'Check database and server status',
            icon: Shield,
            href: '#',
            color: 'text-green-600',
            bg: 'bg-green-50'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#172B4D]">System Administration</h1>
                    <p className="text-[#6B778C]">Advanced control panel for the EUSAI CRM platform</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Super Admin Mode</span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg border border-[#DFE1E6] shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="w-5 h-5 text-[#42526E]" />
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">+12%</span>
                    </div>
                    <div className="text-2xl font-bold text-[#172B4D]">{stats?.totalUsers || 0}</div>
                    <div className="text-xs text-[#6B778C]">Total Active Users</div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-[#DFE1E6] shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <Briefcase className="w-5 h-5 text-[#42526E]" />
                    </div>
                    <div className="text-2xl font-bold text-[#172B4D]">{stats?.activeProjects || 0}</div>
                    <div className="text-xs text-[#6B778C]">Managed Projects</div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-[#DFE1E6] shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <CheckSquare className="w-5 h-5 text-[#42526E]" />
                    </div>
                    <div className="text-2xl font-bold text-[#172B4D]">{stats?.totalTasks || 0}</div>
                    <div className="text-xs text-[#6B778C]">Tasks Tracked</div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-[#DFE1E6] shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-5 h-5 text-[#42526E]" />
                    </div>
                    <div className="text-2xl font-bold text-[#172B4D]">{stats?.kpiScore || 84}%</div>
                    <div className="text-xs text-[#6B778C]">Global KPI Score</div>
                </div>
            </div>

            {/* Management Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {adminCards.map((card) => (
                    <Link
                        key={card.title}
                        href={card.href}
                        className="group bg-white p-6 rounded-xl border border-[#DFE1E6] shadow-sm hover:border-[#0052CC] hover:shadow-md transition-all"
                    >
                        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110", card.bg)}>
                            <card.icon className={cn("w-6 h-6", card.color)} />
                        </div>
                        <h3 className="text-lg font-bold text-[#172B4D] mb-1">{card.title}</h3>
                        <p className="text-sm text-[#6B778C] mb-4">{card.desc}</p>
                        <div className="flex items-center text-sm font-bold text-[#0052CC] group-hover:gap-2 transition-all">
                            Manage <ArrowRight className="w-4 h-4" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Security Notice */}
            <div className="bg-[#172B4D] p-6 rounded-xl text-white">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h4 className="font-bold mb-1">Administrative Safety Notice</h4>
                        <p className="text-sm text-blue-100/80 leading-relaxed">
                            You are in the Super Admin zone. Actions performed here affect the entire database directly.
                            Always double-check user IDs and roles before submitting changes. For data recovery, refer to RDS Snapshots on AWS.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
