"use client";

import React, { useState, useEffect } from 'react';
import Avatar from '@/components/ui/Avatar';
import {
    Users,
    UserPlus,
    Search,
    Filter,
    MoreVertical,
    Mail,
    Shield,
    GitMerge,
    CheckCircle2,
    X,
    Loader2,
    Award,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Minus,
    PieChart,
    Briefcase,
    Send,
    Edit2
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    department: string | null;
    image: string | null;
    performanceScore?: number;
    performanceTrend?: 'UP' | 'DOWN' | 'NEUTRAL';
    activeTasks?: number;
    rank?: number | null;
    reportingManagers: { id: string; name: string | null }[];
    reportingSubordinates: { id: string; name: string | null }[];
    _count: {
        tasks: number;
        milestones: number;
    };
}

export default function TeamPage() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [filterDept, setFilterDept] = useState('ALL');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Form States
    const [formData, setFormData] = useState({
        email: '',
        ccEmails: [] as string[],
        name: '',
        role: 'EMPLOYEE',
        department: '',
        managerIds: [] as string[]
    });

    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    useEffect(() => {
        if (session) fetchTeam();
    }, [session]);

    const fetchTeam = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/team');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setMeta(data.meta);
            } else {
                showToast('Failed to load team data', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showToast('User invited successfully', 'success');
                setIsInviteModalOpen(false);
                fetchTeam();
                resetForm();
            } else {
                showToast('Failed to invite user', 'error');
            }
        } catch (error) {
            showToast('Error sending invitation', 'error');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            const res = await fetch('/api/team', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, id: selectedUser.id })
            });

            if (res.ok) {
                showToast('User updated successfully', 'success');
                setIsEditModalOpen(false);
                fetchTeam();
                resetForm();
            } else {
                showToast('Failed to update user', 'error');
            }
        } catch (error) {
            showToast('Error updating user', 'error');
        }
    };

    const handleResendInvite = async (userId: string) => {
        try {
            const res = await fetch(`/api/team/${userId}/invite`, {
                method: 'POST'
            });

            if (res.ok) {
                showToast('Invitation resent successfully', 'success');
            } else {
                showToast('Failed to resend invitation', 'error');
            }
        } catch (error) {
            showToast('Error resending invitation', 'error');
        }
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({
            email: user.email,
            ccEmails: [],
            name: user.name || '',
            role: user.role,
            department: user.department || '',
            managerIds: user.reportingManagers?.map(m => m.id) || []
        });
        setIsEditModalOpen(true);
    };

    const resetForm = () => {
        setFormData({ email: '', ccEmails: [], name: '', role: 'EMPLOYEE', department: '', managerIds: [] });
        setSelectedUser(null);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'DIRECTOR': return 'bg-[#EAE6FF] text-[#403294]'; // Purple
            case 'MANAGER': return 'bg-[#DEEBFF] text-[#0052CC]'; // Blue
            case 'TEAM_LEADER': return 'bg-[#E3FCEF] text-[#006644]'; // Green
            case 'EMPLOYEE': return 'bg-[#DFE1E6] text-heading'; // Gray
            case 'INTERN': return 'bg-[#FFEBE6] text-[#BF2600]'; // Red/Orange
            default: return 'bg-[var(--notion-bg-tertiary)] text-heading';
        }
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return rank;
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'ALL' || user.role === filterRole;
        const matchesDept = filterDept === 'ALL' || (user.department || 'Unassigned') === filterDept;
        return matchesSearch && matchesRole && matchesDept;
    });

    return (
        <div className="space-y-6 md:space-y-8 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-heading mb-1 md:mb-2 font-display">Team Management</h1>
                    <p className="text-body text-sm md:text-base">
                        {userRole === 'TEAM_LEADER'
                            ? "View your team's tactical activity."
                            : "Manage users, roles, and hierarchy."}
                    </p>
                </div>
                {['DIRECTOR', 'MANAGER'].includes(userRole) && (
                    <button
                        onClick={() => { resetForm(); setIsInviteModalOpen(true); }}
                        className="btn-eusai-create flex items-center justify-center gap-2 px-6 py-2.5 w-full sm:w-auto"
                    >
                        <UserPlus className="w-5 h-5" />
                        Invite Member
                    </button>
                )}
            </div>

            {/* Team Overview Stats */}
            {['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="card-jira p-5 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#EAE6FF] flex items-center justify-center text-[#403294]">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-body uppercase tracking-wider">Team Size</h3>
                                <div className="text-xl font-bold text-heading">{users.length} Members</div>
                            </div>
                        </div>
                    </div>

                    <div className="card-jira p-5 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#DEEBFF] flex items-center justify-center text-[#0052CC]">
                                <PieChart className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-body uppercase tracking-wider">Dept Count</h3>
                                <div className="text-xl font-bold text-heading">
                                    {meta?.departments ? Object.keys(meta.departments).length : 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-jira p-5 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#E3FCEF] flex items-center justify-center text-[#006644]">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-body uppercase tracking-wider">Active Tasks</h3>
                                <div className="text-xl font-bold text-heading">
                                    {meta?.totalTasks || 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-jira p-5 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#FFF0B3] flex items-center justify-center text-[#974F0C]">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-body uppercase tracking-wider">Avg Efficiency</h3>
                                <div className="text-xl font-bold text-heading">
                                    {meta?.avgEfficiency || 0}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="card-jira p-0 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-[var(--notion-border-default)] flex flex-col lg:flex-row lg:items-center justify-between bg-[var(--notion-bg-secondary)] gap-4">
                    <div className="relative w-full lg:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
                        <input
                            placeholder="Search team members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm py-2 pl-10 pr-4 text-sm text-heading focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Shield className="w-4 h-4 text-body shrink-0" />
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="w-full sm:w-auto bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm px-2 py-1.5 text-xs font-bold text-subheading focus:outline-none"
                            >
                                <option value="ALL">All Roles</option>
                                <option value="DIRECTOR">Director</option>
                                <option value="MANAGER">Manager</option>
                                <option value="TEAM_LEADER">Team Leader</option>
                                <option value="EMPLOYEE">Employee</option>
                                <option value="INTERN">Intern</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Briefcase className="w-4 h-4 text-body shrink-0" />
                            <select
                                value={filterDept}
                                onChange={(e) => setFilterDept(e.target.value)}
                                className="w-full sm:w-auto bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm px-2 py-1.5 text-xs font-bold text-subheading focus:outline-none"
                            >
                                <option value="ALL">All Depts</option>
                                {meta?.departments && Object.keys(meta.departments).map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3 text-body">
                        <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
                        <p className="text-sm">Loading team performance directory...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[1000px]">
                            <thead className="bg-[var(--notion-bg-secondary)] border-b border-[var(--notion-border-default)]">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-body uppercase tracking-widest">Rank</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-body uppercase tracking-widest">Team Member</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-body uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-body uppercase tracking-widest text-center">Efficiency</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-body uppercase tracking-widest text-center">Activity</th>
                                    <th className="px-6 py-4 text-[10px] font-extrabold text-body uppercase tracking-widest">Managed By</th>
                                    {['DIRECTOR', 'MANAGER'].includes(userRole) && (
                                        <th className="px-6 py-4"></th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#DFE1E6]">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-[var(--notion-bg-secondary)] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold ${[1, 2, 3].includes(user.rank || 0) ? 'text-[#0052CC]' : 'text-body'}`}>
                                                    {user.rank ? getRankIcon(user.rank) : '-'}
                                                </span>
                                                {user.rank === 1 && (
                                                    <span className="flex items-center gap-1 text-[9px] font-bold text-[#36B37E] bg-[#E3FCEF] px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">
                                                        Top
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={user.image}
                                                    alt={user.name || 'User'}
                                                    fallback={(user.name?.charAt(0) || user.email.charAt(0)).toUpperCase()}
                                                    className="w-9 h-9 rounded-full bg-[#DEEBFF] flex items-center justify-center text-[#0052CC] font-bold text-xs border-2 border-white shadow-sm overflow-hidden shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <div className="font-bold text-heading text-sm flex items-center gap-2">
                                                        {user.name || 'No Name'}
                                                        {user.rank && user.rank <= 3 && <Award className={`w-3.5 h-3.5 ${user.rank === 1 ? 'text-[#FFAB00]' : 'text-body'}`} />}
                                                    </div>
                                                    <div className="text-[10px] text-body truncate">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center w-fit px-2 py-0.5 roundedElement text-[10px] font-bold uppercase tracking-wide ${getRoleColor(user.role)}`}>
                                                    {user.role.replace('_', ' ')}
                                                </span>
                                                <span className="text-[9px] font-bold text-body uppercase">{user.department || 'General'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-1">
                                                        <span className={`text-sm font-bold ${user.performanceScore && user.performanceScore >= 80 ? 'text-[#36B37E]' : user.performanceScore && user.performanceScore >= 60 ? 'text-[#FFAB00]' : 'text-[#FF5630]'}`}>
                                                            {user.performanceScore || 0}%
                                                        </span>
                                                        {user.performanceTrend === 'UP' && <TrendingUp className="w-3 h-3 text-[#36B37E]" />}
                                                        {user.performanceTrend === 'DOWN' && <TrendingDown className="w-3 h-3 text-[#FF5630]" />}
                                                        {user.performanceTrend === 'NEUTRAL' && <Minus className="w-3 h-3 text-body" />}
                                                    </div>
                                                    <div className="w-16 h-1 bg-[var(--notion-bg-tertiary)] rounded-full mt-1 overflow-hidden">
                                                        <div
                                                            className={`h-full ${user.performanceScore && user.performanceScore >= 80 ? 'bg-[#36B37E]' : user.performanceScore && user.performanceScore >= 60 ? 'bg-[#FFAB00]' : 'bg-[#FF5630]'}`}
                                                            style={{ width: `${user.performanceScore || 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-heading">{user.activeTasks || 0}</span>
                                                    <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold uppercase ${(user.activeTasks || 0) > 10 ? 'bg-[#FFEBE6] text-[#BF2600]' : (user.activeTasks || 0) > 5 ? 'bg-[#FFF0B3] text-[#974F0C]' : 'bg-[#E3FCEF] text-[#006644]'}`}>
                                                        {(user.activeTasks || 0) > 10 ? 'High' : (user.activeTasks || 0) > 5 ? 'Optimal' : 'Low'}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] text-body">{user._count?.milestones || 0} Milestones</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.reportingManagers && user.reportingManagers.length > 0 ? (
                                                <div className="flex -space-x-2 overflow-hidden">
                                                    {user.reportingManagers.map((mgr) => (
                                                        <div
                                                            key={mgr.id}
                                                            title={mgr.name || 'Manager'}
                                                            className="w-6 h-6 rounded-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] flex items-center justify-center text-[8px] font-bold shrink-0"
                                                        >
                                                            {mgr.name?.charAt(0) || 'M'}
                                                        </div>
                                                    ))}
                                                    {user.reportingManagers.length > 2 && (
                                                        <div className="w-6 h-6 rounded-full bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] flex items-center justify-center text-[8px] font-bold shrink-0">
                                                            +{user.reportingManagers.length - 2}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-body italic text-[10px]">Independent</span>
                                            )}
                                        </td>
                                        {['DIRECTOR', 'MANAGER'].includes(userRole) && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleResendInvite(user.id)}
                                                        className="p-1.5 hover:bg-[var(--notion-bg-tertiary)] rounded-sm text-subheading transition-colors"
                                                        title="Resend Invitation"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-1.5 hover:bg-[var(--notion-bg-tertiary)] rounded-sm text-subheading transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal (Shared for Invite & Edit) */}
            {(isInviteModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className={cn(
                        "card-eusai w-full bg-[var(--notion-bg-primary)] rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]",
                        !isEditModalOpen && formData.email ? "max-w-5xl" : "max-w-lg"
                    )}>
                        <div className="p-6 border-b border-[var(--notion-border-default)] flex items-center justify-between bg-[var(--notion-bg-secondary)] shrink-0">
                            <h3 className="text-lg font-bold text-heading">
                                {isEditModalOpen ? 'Edit Member Config' : 'Invite New Member'}
                            </h3>
                            <button
                                onClick={() => { setIsInviteModalOpen(false); setIsEditModalOpen(false); }}
                                className="p-1 hover:bg-[var(--notion-bg-tertiary)] rounded-sm text-body"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <div className={cn("p-6", !isEditModalOpen && formData.email ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : "")}>
                                {/* Left Column: Form */}
                                <form onSubmit={isEditModalOpen ? handleUpdate : handleInvite} className="space-y-4 flex flex-col h-full">
                                    {!isEditModalOpen && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-body uppercase">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full pl-9 pr-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#0052CC] outline-none"
                                                    placeholder="colleague@eusaiteam.com"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-body uppercase">Full Name</label>
                                        <input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#0052CC] outline-none"
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-body uppercase flex items-center gap-2">
                                                System Role
                                                {userRole !== 'DIRECTOR' && (
                                                    <span className="text-[10px] lowercase font-normal text-body opacity-60">(Director only)</span>
                                                )}
                                            </label>
                                            <div className="relative">
                                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
                                                <select
                                                    disabled={userRole !== 'DIRECTOR'}
                                                    value={formData.role}
                                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                    className={`w-full pl-9 pr-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#0052CC] outline-none ${userRole !== 'DIRECTOR' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                                                >
                                                    <option value="EMPLOYEE">Employee</option>
                                                    <option value="INTERN">Intern</option>
                                                    <option value="TEAM_LEADER">Team Leader</option>
                                                    <option value="MANAGER">Manager</option>
                                                    <option value="DIRECTOR">Director</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-body uppercase">Department</label>
                                            <input
                                                value={formData.department}
                                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#0052CC] outline-none"
                                                placeholder="e.g. Sales"
                                            />
                                        </div>
                                    </div>

                                    <div className={cn("gap-4 flex-1 min-h-0", !isEditModalOpen ? "grid grid-cols-2" : "flex flex-col")}>
                                        <div className="space-y-1.5 flex flex-col h-full min-h-0">
                                            <label className="text-xs font-bold text-body uppercase truncate">Reports To</label>
                                            <div className="p-3 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm flex-1 overflow-y-auto space-y-2 min-h-[8rem]">
                                                {users
                                                    .filter(u => u.id !== selectedUser?.id)
                                                    .filter(u => ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(u.role))
                                                    .map(u => (
                                                        <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--notion-bg-tertiary)] p-1 rounded-sm transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.managerIds.includes(u.id)}
                                                                onChange={(e) => {
                                                                    const newIds = e.target.checked
                                                                        ? [...formData.managerIds, u.id]
                                                                        : formData.managerIds.filter(id => id !== u.id);
                                                                    setFormData({ ...formData, managerIds: newIds });
                                                                }}
                                                                className="rounded-sm border-[var(--notion-border-default)] text-[#0052CC] focus:ring-[#0052CC] shrink-0"
                                                            />
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <div className="w-5 h-5 rounded-full bg-[var(--notion-bg-tertiary)] flex items-center justify-center text-[8px] font-bold shrink-0">
                                                                    {u.name?.charAt(0) || 'M'}
                                                                </div>
                                                                <span className="text-xs text-heading font-medium truncate">
                                                                    {u.name || u.email}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    ))
                                                }
                                                {users.filter(u => ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(u.role)).length === 0 && (
                                                    <p className="text-[10px] text-body italic">No eligible managers found.</p>
                                                )}
                                            </div>
                                        </div>

                                        {!isEditModalOpen && (
                                            <div className="space-y-1.5 flex flex-col h-full min-h-0">
                                                <label className="text-xs font-bold text-body uppercase truncate">CC (Optional)</label>
                                                <div className="p-3 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm flex-1 overflow-y-auto space-y-2 min-h-[8rem]">
                                                    {users
                                                        .filter(u => ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(u.role))
                                                        .map(u => (
                                                            <label key={`cc-${u.id}`} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--notion-bg-tertiary)] p-1 rounded-sm transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.ccEmails.includes(u.email)}
                                                                    onChange={(e) => {
                                                                        const newEmails = e.target.checked
                                                                            ? [...formData.ccEmails, u.email]
                                                                            : formData.ccEmails.filter(email => email !== u.email);
                                                                        setFormData({ ...formData, ccEmails: newEmails });
                                                                    }}
                                                                    className="rounded-sm border-[var(--notion-border-default)] text-[#0052CC] focus:ring-[#0052CC] shrink-0"
                                                                />
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    <div className="w-5 h-5 rounded-full bg-[var(--notion-bg-tertiary)] flex items-center justify-center text-[8px] font-bold shrink-0">
                                                                        {u.name?.charAt(0) || 'M'}
                                                                    </div>
                                                                    <span className="text-xs text-heading font-medium truncate">
                                                                        {u.name || u.email}
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 flex justify-end gap-2 mt-auto">
                                        <button
                                            type="button"
                                            onClick={() => { setIsInviteModalOpen(false); setIsEditModalOpen(false); }}
                                            className="px-4 py-2 hover:bg-[var(--notion-bg-tertiary)] rounded-sm text-subheading font-medium text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-eusai-create flex items-center gap-2 px-4 py-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            {isEditModalOpen ? 'Save Changes' : 'Send Invite'}
                                        </button>
                                    </div>
                                </form>

                                {/* Right Column: Email Preview */}
                                {!isEditModalOpen && formData.email && (
                                    <div className="border-t lg:border-t-0 lg:border-l border-[var(--notion-border-default)] pt-6 lg:pt-0 lg:pl-8 flex flex-col h-full">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Mail className="w-4 h-4 text-[#0052CC]" />
                                            <h4 className="text-xs font-bold text-heading uppercase tracking-wider">Email Template Preview</h4>
                                        </div>
                                        <div className="bg-[#191919] border border-[#2A2A2A] rounded-md p-4 space-y-4 shadow-inner flex-1">
                                            {/* Email Header */}
                                            <div className="flex items-start justify-between border-b border-[#2A2A2A] pb-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-[#888] w-12">From:</span>
                                                        <span className="text-white font-medium">EUSAI Recon <span className="text-[#666]">&lt;security@eusaiteam.com&gt;</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-[#888] w-12">To:</span>
                                                        <span className="text-[#00B8D9] font-medium">{formData.email}</span>
                                                    </div>
                                                    {formData.ccEmails && formData.ccEmails.length > 0 && (
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="text-[#888] w-12">Cc:</span>
                                                            <span className="text-[#00B8D9] font-medium truncate max-w-[200px]" title={formData.ccEmails.join(', ')}>{formData.ccEmails.join(', ')}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-[#888] w-12">Subject:</span>
                                                        <span className="text-white font-medium uppercase tracking-wide">Secure Access Provisioned: EUSAI Tactical Core</span>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded bg-[#111] flex items-center justify-center border border-[#333] shrink-0">
                                                    <img src="/EUSAI-LOGO.png" alt="EU" className="w-5 h-5 object-contain opacity-80" />
                                                </div>
                                            </div>

                                            {/* Email Body */}
                                            <div className="space-y-4 text-sm text-[#CCCCCC] font-mono leading-relaxed">
                                                <p>CLASSIFIED - INTERNAL USE ONLY</p>

                                                <p>Attention {formData.name || 'Operative'},</p>

                                                <p>You have been provisioned access to the EUSAI Tactical Core. Your designated role parameter is: <span className="text-[#36B37E] font-bold">[{formData.role}]</span>.</p>

                                                <div className="bg-[#111] border border-[#333] p-3 rounded space-y-2">
                                                    <p className="text-xs text-[#888]">INITIALIZATION DIRECTIVES:</p>
                                                    <ol className="list-decimal pl-4 space-y-1 text-xs">
                                                        <li>Access the secure portal via the uplink below.</li>
                                                        <li>Authenticate using your registered Google Workspace credentials.</li>
                                                        <li>Review pending tactical objectives (Tasks & Milestones).</li>
                                                        <li>Acknowledge communication protocol (Daily Submission Window: 18:00 - 20:00).</li>
                                                    </ol>
                                                </div>

                                                <div className="py-2 flex justify-center">
                                                    <div className="bg-[#0052CC] text-white px-6 py-2 rounded font-sans font-medium opacity-90 cursor-not-allowed">
                                                        Initiate Secure Uplink
                                                    </div>
                                                </div>

                                                <p className="text-xs text-[#666]">
                                                    Auth Token: {Math.random().toString(36).substring(2, 15).toUpperCase()} <br />
                                                    Transmission Origin: EUSAI Command Center
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
