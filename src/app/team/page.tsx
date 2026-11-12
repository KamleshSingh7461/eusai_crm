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
    Edit2,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import Modal, { ModalIcon } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

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
    isSuspended: boolean;
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
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeletingUser, setIsDeletingUser] = useState(false);
    const [spaces, setSpaces] = useState<{ id: string; name: string; color: string; managerId?: string }[]>([]);

    // Form States
    const [formData, setFormData] = useState({
        email: '',
        ccEmails: [] as string[],
        name: '',
        role: 'EMPLOYEE',
        spaceIds: [] as string[],
        managerIds: [] as string[]
    });

    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    useEffect(() => {
        if (session) {
            fetchTeam();
            fetchSpaces();
        }
    }, [session]);

    const fetchSpaces = async () => {
        try {
            const res = await fetch('/api/spaces');
            if (res.ok) {
                const data = await res.json();
                setSpaces(data);
            }
        } catch {}
    };

    const fetchTeam = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/team?includeSuspended=true');
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

    const handleConfirmDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeletingUser(true);
        try {
            const res = await fetch(`/api/team?id=${userToDelete.id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`User ${userToDelete.name || userToDelete.email} permanently deleted`, 'success');
                setUserToDelete(null);
                fetchTeam();
            } else {
                showToast(data.message || data.error || 'Failed to delete user', 'error');
            }
        } catch (error) {
            showToast('Network error while deleting user', 'error');
        } finally {
            setIsDeletingUser(false);
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
 
    const handleToggleSuspension = async (user: User) => {
        try {
            const res = await fetch('/api/team', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id, isSuspended: !user.isSuspended })
            });
 
            if (res.ok) {
                showToast(`User ${user.isSuspended ? 'activated' : 'suspended'} successfully`, 'success');
                fetchTeam();
            } else {
                showToast('Failed to update user status', 'error');
            }
        } catch (error) {
            showToast('Error toggling suspension', 'error');
        }
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({
            email: user.email,
            ccEmails: [],
            name: user.name || '',
            role: user.role,
            spaceIds: (user as any).memberSpaces?.map((s: any) => s.id) || [],
            managerIds: user.reportingManagers?.map(m => m.id) || []
        });
        setIsEditModalOpen(true);
    };

    const resetForm = () => {
        setFormData({ email: '', ccEmails: [], name: '', role: 'EMPLOYEE', spaceIds: [], managerIds: [] });
        setSelectedUser(null);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'DIRECTOR': return 'bg-[#A78BFA1F] text-[#8B5CF6]';    // Purple
            case 'MANAGEMENT': return 'bg-[#FFF7D6] text-[#974F0C]';  // Gold (read-only)
            case 'MANAGER': return 'bg-[#3B82F61F] text-[#3B82F6]';     // Blue
            case 'TEAM_LEADER': return 'bg-[#34D3991F] text-[#059669]'; // Green
            case 'EMPLOYEE': return 'bg-[#FFFFFF14] text-heading';       // Gray
            case 'INTERN': return 'bg-[#FB71851F] text-[#E11D48]';       // Red/Orange
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
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Team</h1>
                    <p className="mt-2 max-w-2xl text-base text-zinc-400">
                        {userRole === 'TEAM_LEADER'
                            ? "See what your team has been working on."
                            : userRole === 'MANAGEMENT'
                            ? "Read-only view of all team data, reports, and KPIs."
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
            {['DIRECTOR', 'MANAGEMENT', 'MANAGER', 'TEAM_LEADER'].includes(userRole) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="card-jira p-5 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#A78BFA1F] flex items-center justify-center text-[#8B5CF6]">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-semibold text-body">Team Size</h3>
                                <div className="text-xl font-semibold text-heading">{users.length} Members</div>
                            </div>
                        </div>
                    </div>

                    <div className="card-jira p-5 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#3B82F61F] flex items-center justify-center text-[#3B82F6]">
                                <PieChart className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-semibold text-body">Dept Count</h3>
                                <div className="text-xl font-semibold text-heading">
                                    {meta?.departments ? Object.keys(meta.departments).length : 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-jira p-5 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#34D3991F] flex items-center justify-center text-[#059669]">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-semibold text-body">Active Tasks</h3>
                                <div className="text-xl font-semibold text-heading">
                                    {meta?.totalTasks || 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-jira p-5 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#FBBF2433] flex items-center justify-center text-[#974F0C]">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-semibold text-body">Avg Efficiency</h3>
                                <div className="text-xl font-semibold text-heading">
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
                            className="w-full bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm py-2 pl-10 pr-4 text-sm text-heading focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Shield className="w-4 h-4 text-body shrink-0" />
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="w-full sm:w-auto bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm px-2 py-1.5 text-xs font-semibold text-subheading focus:outline-none"
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
                                className="w-full sm:w-auto bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm px-2 py-1.5 text-xs font-semibold text-subheading focus:outline-none"
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
                    <div className="p-6 sm:p-12 flex flex-col items-center justify-center gap-3 text-body">
                        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
                        <p className="text-sm">Loading team performance directory...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[1000px]">
                            <thead className="bg-[var(--notion-bg-secondary)] border-b border-[var(--notion-border-default)]">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-body">Rank</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-body">Team Member</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-body">Role</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-body text-center">Efficiency</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-body text-center">Activity</th>
                                    <th className="px-6 py-4 text-[11px] font-semibold text-body">Managed By</th>
                                    {['DIRECTOR', 'MANAGER'].includes(userRole) && (
                                        <th className="px-6 py-4"></th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#FFFFFF14]">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-[var(--notion-bg-secondary)] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${[1, 2, 3].includes(user.rank || 0) ? 'text-[#3B82F6]' : 'text-body'}`}>
                                                    {user.rank ? getRankIcon(user.rank) : '-'}
                                                </span>
                                                {user.rank === 1 && (
                                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#34D399] bg-[#34D3991F] px-1.5 py-0.5 rounded-sm tracking-tighter">
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
                                                    className="w-9 h-9 rounded-full bg-[#3B82F61F] flex items-center justify-center text-[#3B82F6] font-semibold text-xs border-2 border-white shadow-sm overflow-hidden shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-heading text-sm flex items-center gap-2">
                                                        {user.name || 'No Name'}
                                                        {user.rank && user.rank <= 3 && <Award className={`w-3.5 h-3.5 ${user.rank === 1 ? 'text-[#FBBF24]' : 'text-body'}`} />}
                                                        {user.isSuspended && (
                                                            <span className="bg-[#FB71851F] text-[#E11D48] text-[11px] px-1.5 py-0.5 rounded-sm font-semibold tracking-tighter">Suspended</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-body truncate">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center w-fit px-2 py-0.5 roundedElement text-[11px] font-semibold  tracking-wide ${getRoleColor(user.role)}`}>
                                                    {user.role.replace('_', ' ')}
                                                </span>
                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                    {(user as any).memberSpaces?.length > 0
                                                        ? (user as any).memberSpaces.map((s: any) => (
                                                            <span key={s.id} className="text-[11px] font-semibold px-1.5 py-0.5 rounded-sm text-white tracking-tight" style={{ backgroundColor: s.color || '#3B82F6' }}>
                                                                {s.name}
                                                            </span>
                                                        ))
                                                        : <span className="text-[11px] font-semibold text-body">{user.department || 'No Dept'}</span>
                                                    }
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-1">
                                                        <span className={`text-sm font-semibold ${user.performanceScore && user.performanceScore >= 80 ? 'text-[#34D399]' : user.performanceScore && user.performanceScore >= 60 ? 'text-[#FBBF24]' : 'text-[#FB7185]'}`}>
                                                            {user.performanceScore || 0}%
                                                        </span>
                                                        {user.performanceTrend === 'UP' && <TrendingUp className="w-3 h-3 text-[#34D399]" />}
                                                        {user.performanceTrend === 'DOWN' && <TrendingDown className="w-3 h-3 text-[#FB7185]" />}
                                                        {user.performanceTrend === 'NEUTRAL' && <Minus className="w-3 h-3 text-body" />}
                                                    </div>
                                                    <div className="w-16 h-1 bg-[var(--notion-bg-tertiary)] rounded-full mt-1 overflow-hidden">
                                                        <div
                                                            className={`h-full ${user.performanceScore && user.performanceScore >= 80 ? 'bg-[#34D399]' : user.performanceScore && user.performanceScore >= 60 ? 'bg-[#FBBF24]' : 'bg-[#FB7185]'}`}
                                                            style={{ width: `${user.performanceScore || 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-heading">{user.activeTasks || 0}</span>
                                                    <span className={`px-1.5 py-0.5 rounded-sm text-[11px] font-semibold  ${(user.activeTasks || 0) > 10 ? 'bg-[#FB71851F] text-[#E11D48]' : (user.activeTasks || 0) > 5 ? 'bg-[#FBBF2433] text-[#974F0C]' : 'bg-[#34D3991F] text-[#059669]'}`}>
                                                        {(user.activeTasks || 0) > 10 ? 'High' : (user.activeTasks || 0) > 5 ? 'Optimal' : 'Low'}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-body">{user._count?.milestones || 0} Milestones</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.reportingManagers && user.reportingManagers.length > 0 ? (
                                                <div className="flex -space-x-2 overflow-hidden">
                                                    {user.reportingManagers.map((mgr) => (
                                                        <div
                                                            key={mgr.id}
                                                            title={mgr.name || 'Manager'}
                                                            className="w-6 h-6 rounded-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] flex items-center justify-center text-[11px] font-semibold shrink-0"
                                                        >
                                                            {mgr.name?.charAt(0) || 'M'}
                                                        </div>
                                                    ))}
                                                    {user.reportingManagers.length > 2 && (
                                                        <div className="w-6 h-6 rounded-full bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] flex items-center justify-center text-[11px] font-semibold shrink-0">
                                                            +{user.reportingManagers.length - 2}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-body italic text-[11px]">Independent</span>
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
                                                        onClick={() => handleToggleSuspension(user)}
                                                        className={cn(
                                                            "p-1.5 rounded-sm transition-colors",
                                                            user.isSuspended ? "hover:bg-[#34D3991F] text-[#059669]" : "hover:bg-[#FB71851F] text-[#E11D48]"
                                                        )}
                                                        title={user.isSuspended ? "Activate User" : "Suspend User"}
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-1.5 hover:bg-[var(--notion-bg-tertiary)] rounded-sm text-subheading transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {userRole === 'DIRECTOR' && user.id !== userId && (
                                                        <button
                                                            onClick={() => setUserToDelete(user)}
                                                            className="p-1.5 hover:bg-[#FB71851F] text-[#E11D48] rounded-sm transition-colors"
                                                            title="Permanently Delete User"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
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
                <Modal open onClose={() => { setIsInviteModalOpen(false); setIsEditModalOpen(false); }} size={!isEditModalOpen && formData.email ? 'xl' : 'md'} title={isEditModalOpen ? 'Edit member' : 'Invite a member'} description={isEditModalOpen ? 'Change their role, departments and reporting line.' : 'They get an email invite to join EUSAI.'} icon={<ModalIcon><UserPlus /></ModalIcon>}
                    onSubmit={isEditModalOpen ? handleUpdate : handleInvite}
                    footer={<>
                        <Button type="button" variant="ghost" onClick={() => { setIsInviteModalOpen(false); setIsEditModalOpen(false); }}>Cancel</Button>
                        <Button type="submit" leftIcon={<CheckCircle2 className="h-4 w-4" />}>{isEditModalOpen ? 'Save changes' : 'Send invite'}</Button>
                    </>}
                >
                            <div className={cn(!isEditModalOpen && formData.email ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : "")}>
                                {/* Left Column: Form */}
                                <div className="space-y-4 flex flex-col h-full">
                                    {!isEditModalOpen && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-body">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full pl-9 pr-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none"
                                                    placeholder="name@eusaiteam.com or @aumniindia.com"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-body">Full Name</label>
                                        <input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none"
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-body">Departments (Spaces)</label>
                                        <div className="p-3 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm overflow-y-auto space-y-2 min-h-[5rem] max-h-[8rem]">
                                            {(() => {
                                                const visibleSpaces = userRole === 'DIRECTOR'
                                                    ? spaces
                                                    : spaces.filter(s => s.managerId === userId);
                                                return visibleSpaces.length > 0 ? visibleSpaces.map(s => (
                                                    <label key={s.id} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--notion-bg-tertiary)] p-1 rounded-sm transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.spaceIds.includes(s.id)}
                                                            onChange={(e) => {
                                                                const newIds = e.target.checked
                                                                    ? [...formData.spaceIds, s.id]
                                                                    : formData.spaceIds.filter(id => id !== s.id);
                                                                setFormData({ ...formData, spaceIds: newIds });
                                                            }}
                                                            className="rounded-sm border-[var(--notion-border-default)] text-[#3B82F6] focus:ring-[#3B82F6] shrink-0"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color || '#3B82F6' }} />
                                                            <span className="text-xs text-heading font-medium">{s.name}</span>
                                                        </div>
                                                    </label>
                                                )) : (
                                                    <p className="text-[11px] text-body italic">No spaces available. Create a space first.</p>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-body flex items-center gap-2">
                                                System Role
                                                {userRole !== 'DIRECTOR' && (
                                                    <span className="text-[11px] lowercase font-normal text-body opacity-60">(Director only)</span>
                                                )}
                                            </label>
                                            <div className="relative">
                                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
                                                <select
                                                    disabled={userRole !== 'DIRECTOR'}
                                                    value={formData.role}
                                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                    className={`w-full pl-9 pr-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#3B82F6] outline-none ${userRole !== 'DIRECTOR' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                                                >
                                                    <option value="EMPLOYEE">Employee</option>
                                                    <option value="INTERN">Intern</option>
                                                    <option value="TEAM_LEADER">Team Leader</option>
                                                    <option value="MANAGER">Manager</option>
                                                    <option value="DIRECTOR">Director</option>
                                                    <option value="MANAGEMENT">Management (Read-only)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={cn("gap-4 flex-1 min-h-0", !isEditModalOpen ? "grid grid-cols-2" : "flex flex-col")}>
                                        <div className="space-y-1.5 flex flex-col h-full min-h-0">
                                            <label className="text-xs font-semibold text-body truncate">Reports To</label>
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
                                                                className="rounded-sm border-[var(--notion-border-default)] text-[#3B82F6] focus:ring-[#3B82F6] shrink-0"
                                                            />
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <div className="w-5 h-5 rounded-full bg-[var(--notion-bg-tertiary)] flex items-center justify-center text-[11px] font-semibold shrink-0">
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
                                                    <p className="text-[11px] text-body italic">No eligible managers found.</p>
                                                )}
                                            </div>
                                        </div>

                                        {!isEditModalOpen && (
                                            <div className="space-y-1.5 flex flex-col h-full min-h-0">
                                                <label className="text-xs font-semibold text-body truncate">CC (Optional)</label>
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
                                                                    className="rounded-sm border-[var(--notion-border-default)] text-[#3B82F6] focus:ring-[#3B82F6] shrink-0"
                                                                />
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    <div className="w-5 h-5 rounded-full bg-[var(--notion-bg-tertiary)] flex items-center justify-center text-[11px] font-semibold shrink-0">
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

                                </div>

                                {/* Right Column: Email Preview */}
                                {!isEditModalOpen && formData.email && (
                                    <div className="border-t lg:border-t-0 lg:border-l border-[var(--notion-border-default)] pt-6 lg:pt-0 lg:pl-8 flex flex-col h-full">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Mail className="w-4 h-4 text-[#3B82F6]" />
                                            <h4 className="text-xs font-semibold text-heading">Email preview</h4>
                                        </div>
                                        <div className="bg-[#09090B] border border-[#131720] rounded-md p-4 space-y-4 shadow-inner flex-1">
                                            {/* Email Header */}
                                            <div className="flex items-start justify-between border-b border-[#131720] pb-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-[#888] w-12">From:</span>
                                                        <span className="text-white font-medium">EUSAI Alert System <span className="text-[#666]">&lt;alert@eusaiteam.com&gt;</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-[#888] w-12">To:</span>
                                                        <span className="text-[#22D3EE] font-medium">{formData.email}</span>
                                                    </div>
                                                    {formData.ccEmails && formData.ccEmails.length > 0 && (
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="text-[#888] w-12">Cc:</span>
                                                            <span className="text-[#22D3EE] font-medium truncate max-w-[200px]" title={formData.ccEmails.join(', ')}>{formData.ccEmails.join(', ')}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-[#888] w-12">Subject:</span>
                                                        <span className="text-white font-medium tracking-wide">Your EUSAI workspace access is ready</span>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded bg-[#111] flex items-center justify-center border border-[#333] shrink-0">
                                                    <img src="/EUSAI-LOGO.png" alt="EU" className="w-5 h-5 object-contain opacity-80" />
                                                </div>
                                            </div>

                                            {/* Email Body */}
                                            <div className="space-y-4 text-sm text-[#CCCCCC] leading-relaxed">
                                                <p>Hi {formData.name || 'there'},</p>

                                                <p>You now have access to the EUSAI workspace. Your role: <span className="text-[#34D399] font-semibold">[{formData.role}]</span>.</p>

                                                <div className="bg-[#111] border border-[#333] p-3 rounded space-y-2">
                                                    <p className="text-xs text-[#888]">GETTING STARTED</p>
                                                    <ol className="list-decimal pl-4 space-y-1 text-xs">
                                                        <li>Sign in using the link below.</li>
                                                        <li>Use your registered Google Workspace account.</li>
                                                        <li>Open tasks and milestones that need attention.</li>
                                                        <li>Daily reports are accepted between 5:00 PM and 11:59 PM IST.</li>
                                                    </ol>
                                                </div>

                                                <div className="py-2 flex justify-center">
                                                    <div className="bg-[#3B82F6] text-white px-6 py-2 rounded font-sans font-medium opacity-90 cursor-not-allowed">
                                                        Sign in
                                                    </div>
                                                </div>

                                                <p className="text-xs text-[#666]">
                                                    Sent by EUSAI
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                </Modal>
            )}

            {/* Delete Confirmation Modal (Director Only) */}
            {userToDelete && (
                <Modal open onClose={() => setUserToDelete(null)} size="sm" title="Delete user permanently" description="This can't be undone." icon={<ModalIcon tone="rose"><AlertTriangle /></ModalIcon>}
                    footer={<>
                        <Button type="button" variant="ghost" onClick={() => setUserToDelete(null)} disabled={isDeletingUser}>Cancel</Button>
                        <Button type="button" variant="danger" onClick={handleConfirmDeleteUser} isLoading={isDeletingUser} leftIcon={<Trash2 className="h-4 w-4" />}>Delete permanently</Button>
                    </>}
                >
                        <div className="space-y-4">
                            <p className="text-sm text-[var(--notion-text-primary)] leading-relaxed">
                                Are you sure you want to permanently delete <strong className="font-semibold text-heading">{userToDelete.name || userToDelete.email}</strong>?
                            </p>
                            <div className="p-3 bg-[var(--notion-bg-secondary)] rounded-md border border-[var(--notion-border-default)] text-xs text-[var(--notion-text-secondary)] space-y-1.5">
                                <p className="font-semibold text-heading flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]"></span>
                                    The following will happen:
                                </p>
                                <ul className="list-disc pl-4 space-y-1 text-[var(--notion-text-tertiary)]">
                                    <li>User credentials, sessions, and mobile access will be erased.</li>
                                    <li>Unfinished tasks assigned to them will be unassigned.</li>
                                    <li>All department, project, and channel memberships will be removed.</li>
                                    <li>Historical milestones will be safely transferred to your director account.</li>
                                </ul>
                            </div>
                        </div>
                    
                </Modal>
            )}

        </div>
    );
}
