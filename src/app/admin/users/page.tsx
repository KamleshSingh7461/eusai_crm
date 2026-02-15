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
    X
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';

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
                    <h1 className="text-2xl font-bold text-[#172B4D]">User Management</h1>
                    <p className="text-[#6B778C]">Oversee all platform accounts and permissions</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B778C]" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-[#DFE1E6] rounded-md text-sm focus:ring-2 focus:ring-[#0052CC] outline-none w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white border border-[#DFE1E6] rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#FAFBFC] border-b border-[#DFE1E6]">
                            <th className="px-6 py-4 text-xs font-bold text-[#6B778C] uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#6B778C] uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#6B778C] uppercase tracking-wider">Department</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#6B778C] uppercase tracking-wider text-center">Activity</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#6B778C] uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFE1E6]">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#0052CC] mx-auto" />
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-[#6B778C]">No users found matching your search.</td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#0052CC] font-bold text-sm">
                                                {user.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-[#172B4D]">{user.name || 'No Name'}</span>
                                                <span className="text-xs text-[#6B778C]">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                            disabled={user.email === 'admin@eusaiteam.com'}
                                            className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-transparent focus:border-[#0052CC] bg-transparent hover:bg-white cursor-pointer transition-all",
                                                user.role === 'DIRECTOR' ? "bg-amber-50 text-amber-700" :
                                                    user.role === 'MANAGER' ? "bg-blue-50 text-blue-700" :
                                                        "bg-slate-100 text-slate-700"
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
                                            className="text-xs text-[#42526E] bg-transparent border-b border-transparent hover:border-[#DFE1E6] focus:border-[#0052CC] focus:outline-none py-0.5 px-1 transition-all"
                                            placeholder="Set department..."
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-4 text-xs font-medium text-[#6B778C]">
                                            <div className="flex flex-col items-center" title="Projects">
                                                <span className="text-[#172B4D] font-bold">{user._count?.projects || 0}</span>
                                                <span className="scale-75 uppercase">PRJ</span>
                                            </div>
                                            <div className="flex flex-col items-center" title="Tasks">
                                                <span className="text-[#172B4D] font-bold">{user._count?.tasks || 0}</span>
                                                <span className="scale-75 uppercase">TSK</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setIsDetailModalOpen(true);
                                                }}
                                                title="View Details"
                                                className="p-1.5 text-[#42526E] hover:bg-white hover:shadow-sm rounded transition-all"
                                            >
                                                <UserCog className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={user.email === 'admin@eusaiteam.com'}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent"
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

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-[#0747A6] p-6 rounded-xl text-white shadow-lg shadow-blue-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                            <Mail className="w-6 h-6 text-blue-100" />
                        </div>
                        <h3 className="text-xl font-bold">Invite New Team Member</h3>
                    </div>
                    <p className="text-blue-100/80 text-sm mb-6 leading-relaxed">
                        Send a secure invitation link to new employees. They can then sign in and automatically join the workspace.
                    </p>
                    <button
                        onClick={generateInviteLink}
                        className="bg-white text-[#0052CC] px-6 py-2 rounded-md font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm"
                    >
                        Generate Invite Link
                    </button>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm border-l-4 border-l-amber-500">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold text-[#172B4D]">Platform Security Role</h3>
                    </div>
                    <p className="text-[#6B778C] text-sm mb-6 leading-relaxed">
                        The <strong>Director</strong> role is the highest privilege. It can delete any data on the platform.
                        Ensure that only trusted executive members are ever assigned to this role.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md w-fit">
                        <CheckCircle2 className="w-4 h-4" />
                        ENFORCED SYSTEM-WIDE
                    </div>
                </div>
            </div>

            {/* User Details Modal */}
            {isDetailModalOpen && selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#091E42]/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-lg rounded-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-[#DFE1E6]">
                            <h2 className="text-lg font-bold text-[#172B4D]">User Details</h2>
                            <button onClick={() => setIsDetailModalOpen(false)} className="text-[#6B778C] hover:text-[#172B4D]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-[#0052CC] font-bold text-xl">
                                    {selectedUser.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#172B4D]">{selectedUser.name || 'No Name'}</h3>
                                    <p className="text-sm text-[#6B778C]">{selectedUser.email}</p>
                                    <div className="mt-1 inline-flex items-center px-2 py-0.5 roundedElement bg-[#EAE6FF] text-[#403294] text-[10px] font-bold uppercase tracking-wider">
                                        {selectedUser.role}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider">Reports To</span>
                                    <div className="text-sm text-[#172B4D] flex items-center gap-2">
                                        {selectedUser.manager ? (
                                            <>
                                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                                                    {selectedUser.manager.name?.charAt(0)}
                                                </div>
                                                {selectedUser.manager.name}
                                            </>
                                        ) : (
                                            <span className="text-[#6B778C] italic underline decoration-dotted">No direct manager</span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider">Department</span>
                                    <div className="text-sm text-[#172B4D]">
                                        {selectedUser.department || <span className="text-[#6B778C] italic">Unassigned</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider">Subordinates</span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedUser.subordinates && selectedUser.subordinates.length > 0 ? (
                                        selectedUser.subordinates.map((sub: any) => (
                                            <div key={sub.id} className="flex items-center gap-2 px-2 py-1 bg-[#F4F5F7] rounded text-xs text-[#172B4D] border border-[#DFE1E6]">
                                                <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[9px] font-bold border border-[#DFE1E6]">
                                                    {sub.name?.charAt(0)}
                                                </div>
                                                {sub.name}
                                                <span className="text-[9px] text-[#6B778C]">({sub.role})</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-xs text-[#6B778C] italic">No subordinates assigned</div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[#DFE1E6]">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-3 bg-slate-50 rounded-lg border border-[#DFE1E6]">
                                        <div className="text-xl font-bold text-[#0052CC]">{selectedUser._count?.projects || 0}</div>
                                        <div className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider">Projects</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-[#DFE1E6]">
                                        <div className="text-xl font-bold text-[#36B37E]">{selectedUser._count?.tasks || 0}</div>
                                        <div className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider">Tasks</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-[#DFE1E6]">
                                        <div className="text-xl font-bold text-[#FF5630]">{selectedUser._count?.dailyReports || 0}</div>
                                        <div className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider">Reports</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
