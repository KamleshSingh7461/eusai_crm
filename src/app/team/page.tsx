"use client";

import React, { useState, useEffect } from 'react';
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
    Briefcase
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
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
    manager: { id: string; name: string | null } | null;
    subordinates: { id: string; name: string | null }[];
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
        name: '',
        role: 'EMPLOYEE',
        department: '',
        managerId: ''
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

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({
            email: user.email,
            name: user.name || '',
            role: user.role,
            department: user.department || '',
            managerId: user.manager?.id || ''
        });
        setIsEditModalOpen(true);
    };

    const resetForm = () => {
        setFormData({ email: '', name: '', role: 'EMPLOYEE', department: '', managerId: '' });
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
                                                <div className="w-9 h-9 rounded-full bg-[#DEEBFF] flex items-center justify-center text-[#0052CC] font-bold text-xs border-2 border-white shadow-sm overflow-hidden shrink-0">
                                                    {user.image ? <img src={user.image} alt={user.name || ''} className="w-full h-full object-cover" /> : (user.name?.charAt(0) || user.email.charAt(0)).toUpperCase()}
                                                </div>
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
                                            {user.manager ? (
                                                <div className="flex items-center gap-2 text-subheading text-xs">
                                                    <div className="w-5 h-5 rounded-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] flex items-center justify-center text-[8px] font-bold">
                                                        {user.manager.name?.charAt(0) || 'M'}
                                                    </div>
                                                    <span className="truncate max-w-[80px]">{user.manager.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-body italic text-[10px]">Independent</span>
                                            )}
                                        </td>
                                        {['DIRECTOR', 'MANAGER'].includes(userRole) && (
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-1.5 hover:bg-[var(--notion-bg-tertiary)] rounded-sm text-subheading transition-colors"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
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
                    <div className="card-eusai w-full max-w-lg bg-[var(--notion-bg-primary)] rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-[var(--notion-border-default)] flex items-center justify-between bg-[var(--notion-bg-secondary)]">
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
                        <form onSubmit={isEditModalOpen ? handleUpdate : handleInvite} className="p-6 space-y-4">
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
                                    <label className="text-xs font-bold text-body uppercase">System Role</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
                                        <select
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full pl-9 pr-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#0052CC] outline-none cursor-pointer"
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

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-body uppercase">Reports To (Manager)</label>
                                <div className="relative">
                                    <GitMerge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
                                    <select
                                        value={formData.managerId}
                                        onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm text-sm focus:border-[#0052CC] outline-none cursor-pointer"
                                    >
                                        <option value="">-- No Manager --</option>
                                        {users
                                            .filter(u => u.id !== selectedUser?.id) // Can't report to self
                                            .filter(u => ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(u.role)) // Only leaders can be managers
                                            .map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name || u.email} ({u.role})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
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
                    </div>
                </div>
            )}
        </div>
    );
}
