"use client";

import { useEffect, useState } from 'react';
import {
    Users,
    Shield,
    MoreVertical,
    Trash2,
    CheckCircle2,
    Loader2,
    Search,
    UserPlus,
    Mail,
    UserCog,
    X,
    UserRound,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import Modal, { ModalIcon } from '@/components/ui/Modal';

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const { showToast } = useToast();

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            showToast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole })
            });

            if (res.ok) {
                showToast('User role updated', 'success');
                fetchUsers();
            } else {
                showToast('Failed to update role', 'error');
            }
        } catch (error) {
            showToast('Error updating user', 'error');
        }
    };

    const handleUpdateDepartment = async (userId: string, department: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, department })
            });

            if (res.ok) {
                showToast('Department updated', 'success');
                fetchUsers();
            }
        } catch (error) {
            showToast('Error updating department', 'error');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you absolutely sure? This will delete the user and all their associated data.')) return;

        try {
            const res = await fetch(`/api/admin/users?userId=${userId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                showToast('User deleted permanently', 'success');
                fetchUsers();
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to delete user', 'error');
            }
        } catch (error) {
            showToast('Error deleting user', 'error');
        }
    };

    const generateInviteLink = () => {
        const baseUrl = window.location.origin;
        const inviteLink = `${baseUrl}/login`;
        navigator.clipboard.writeText(inviteLink);
        showToast('Invite link copied to clipboard!', 'success');
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const roles = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER', 'EMPLOYEE', 'INTERN'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">User Management</h1>
                    <p className="mt-2 max-w-2xl text-base text-zinc-400">Manage accounts, roles and access</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B94A5]" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white/[0.03] border border-[#FFFFFF14] rounded-md text-sm focus:ring-2 focus:ring-[#3B82F6] outline-none w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="glass overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left border-collapse">
                    <thead>
                        <tr className="bg-[#FFFFFF08] border-b border-[#FFFFFF14]">
                            <th className="px-6 py-4 text-xs font-semibold text-[#8B94A5]">User</th>
                            <th className="px-6 py-4 text-xs font-semibold text-[#8B94A5]">Role</th>
                            <th className="px-6 py-4 text-xs font-semibold text-[#8B94A5]">Department</th>
                            <th className="px-6 py-4 text-xs font-semibold text-[#8B94A5] text-center">Activity</th>
                            <th className="px-6 py-4 text-xs font-semibold text-[#8B94A5] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FFFFFF14]">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 sm:py-12 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] mx-auto" />
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 sm:py-12 text-center text-[#8B94A5]">No users found matching your search.</td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/[0.03]/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-[#3B82F6] font-semibold text-sm">
                                                {user.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-[#E6EAF0]">{user.name || 'No Name'}</span>
                                                <span className="text-xs text-[#8B94A5]">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                            disabled={user.email === 'admin@eusaiteam.com'}
                                            className={cn(
                                                "text-[11px] font-semibold   px-2 py-1 rounded border border-transparent focus:border-[#3B82F6] bg-transparent hover:bg-white/[0.03] cursor-pointer transition-all",
                                                user.role === 'DIRECTOR' ? "bg-amber-500/10 text-amber-300" :
                                                    user.role === 'MANAGER' ? "bg-blue-500/10 text-blue-300" :
                                                        "bg-white/[0.03] text-fg-muted"
                                            )}
                                        >
                                            {roles.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="text"
                                            defaultValue={user.department || ''}
                                            onBlur={(e) => handleUpdateDepartment(user.id, e.target.value)}
                                            className="text-xs text-[#A0A9B8] bg-transparent border-b border-transparent hover:border-[#FFFFFF14] focus:border-[#3B82F6] focus:outline-none py-0.5 px-1 transition-all"
                                            placeholder="Set department..."
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-4 text-xs font-medium text-[#8B94A5]">
                                            <div className="flex flex-col items-center" title="Projects">
                                                <span className="text-[#E6EAF0] font-semibold">{user._count?.managedProjects || 0}</span>
                                                <span className="scale-75">PRJ</span>
                                            </div>
                                            <div className="flex flex-col items-center" title="Tasks">
                                                <span className="text-[#E6EAF0] font-semibold">{user._count?.tasks || 0}</span>
                                                <span className="scale-75">TSK</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-wrap items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setIsDetailModalOpen(true);
                                                }}
                                                title="View Details"
                                                className="p-1.5 text-[#A0A9B8] hover:bg-white/[0.03] hover:shadow-sm rounded transition-all"
                                            >
                                                <UserCog className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={user.email === 'admin@eusaiteam.com'}
                                                className="p-1.5 text-red-300 hover:bg-red-500/10 rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                                title="Delete User"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-600 p-6 rounded-xl text-white shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                            <Mail className="w-6 h-6 text-blue-100" />
                        </div>
                        <h3 className="text-xl font-semibold">Invite New Team Member</h3>
                    </div>
                    <p className="text-blue-100/80 text-sm mb-6 leading-relaxed">
                        Send a secure invitation link to new employees. They can then sign in and automatically join the workspace.
                    </p>
                    <button
                        onClick={generateInviteLink}
                        className="bg-white text-[#3B82F6] px-6 py-2 rounded-md font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm"
                    >
                        Generate Invite Link
                    </button>
                </div>

                <div className="bg-white/[0.03] border border-line p-6 rounded-xl shadow-sm border-l-4 border-l-amber-500">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-amber-300" />
                        </div>
                        <h3 className="text-xl font-semibold text-[#E6EAF0]">Platform Security Role</h3>
                    </div>
                    <p className="text-[#8B94A5] text-sm mb-6 leading-relaxed">
                        The <strong>Director</strong> role is the highest privilege. It can delete any data on the platform.
                        Ensure that only trusted executive members are ever assigned to this role.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-md w-fit">
                        <CheckCircle2 className="w-4 h-4" />
                        ENFORCED SYSTEM-WIDE
                    </div>
                </div>
            </div>

            {/* User Details Modal */}
            {isDetailModalOpen && selectedUser && (
                <Modal open onClose={() => setIsDetailModalOpen(false)} size="md" title="User details" description={selectedUser.email} icon={<ModalIcon><UserRound /></ModalIcon>} bodyClassName="p-0 sm:p-0">
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-[#3B82F6] font-semibold text-xl">
                                    {selectedUser.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-[#E6EAF0]">{selectedUser.name || 'No Name'}</h3>
                                    <p className="text-sm text-[#8B94A5]">{selectedUser.email}</p>
                                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-md bg-[#A78BFA1F] text-[#8B5CF6] text-[11px] font-semibold">
                                        {selectedUser.role}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <span className="text-[11px] font-semibold text-[#8B94A5]">Reports To</span>
                                    <div className="text-sm text-[#E6EAF0] flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                        {selectedUser.reportingManagers?.length ? (
                                            selectedUser.reportingManagers.map((m: any) => (
                                                <span key={m.id} className="flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-[#1F1F23] flex items-center justify-center text-[10px] font-semibold text-zinc-300">
                                                        {m.name?.charAt(0)}
                                                    </span>
                                                    {m.name || m.email}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[#8B94A5] italic">No direct manager</span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[11px] font-semibold text-[#8B94A5]">Department</span>
                                    <div className="text-sm text-[#E6EAF0]">
                                        {selectedUser.department || <span className="text-[#8B94A5] italic">Unassigned</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[11px] font-semibold text-[#8B94A5]">Subordinates</span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedUser.reportingSubordinates && selectedUser.reportingSubordinates.length > 0 ? (
                                        selectedUser.reportingSubordinates.map((sub: any) => (
                                            <div key={sub.id} className="flex items-center gap-2 px-2 py-1 bg-[#FFFFFF0A] rounded text-xs text-[#E6EAF0] border border-[#FFFFFF14]">
                                                <div className="w-4 h-4 rounded-full bg-[#1F1F23] flex items-center justify-center text-[10px] font-semibold text-zinc-300 border border-[#FFFFFF14]">
                                                    {sub.name?.charAt(0)}
                                                </div>
                                                {sub.name}
                                                <span className="text-[11px] text-[#8B94A5]">({sub.role})</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-xs text-[#8B94A5] italic">No subordinates assigned</div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[#FFFFFF14]">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-3 bg-white/[0.03] rounded-lg border border-[#FFFFFF14]">
                                        <div className="text-xl font-semibold text-[#3B82F6]">{selectedUser._count?.managedProjects || 0}</div>
                                        <div className="text-[11px] font-semibold text-[#8B94A5]">Projects</div>
                                    </div>
                                    <div className="p-3 bg-white/[0.03] rounded-lg border border-[#FFFFFF14]">
                                        <div className="text-xl font-semibold text-[#34D399]">{selectedUser._count?.tasks || 0}</div>
                                        <div className="text-[11px] font-semibold text-[#8B94A5]">Tasks</div>
                                    </div>
                                    <div className="p-3 bg-white/[0.03] rounded-lg border border-[#FFFFFF14]">
                                        <div className="text-xl font-semibold text-[#FB7185]">{selectedUser._count?.dailyReports || 0}</div>
                                        <div className="text-[11px] font-semibold text-[#8B94A5]">Reports</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    
                </Modal>
            )}
        </div>
    );
}
