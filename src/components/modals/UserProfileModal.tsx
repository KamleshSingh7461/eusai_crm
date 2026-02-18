'use client';

import React, { useEffect, useState } from 'react';
import {
    X,
    Mail,
    Shield,
    Briefcase,
    TrendingUp,
    TrendingDown,
    Minus,
    CheckCircle2,
    Clock,
    User as UserIcon,
    GitMerge,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface UserProfileModalProps {
    userId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchUserDetails();
        }
    }, [isOpen, userId]);

    const fetchUserDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/team');
            if (res.ok) {
                const data = await res.json();
                const foundUser = data.users.find((u: any) => u.id === userId);
                setUser(foundUser);
            }
        } catch (error) {
            console.error('Failed to fetch user details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'DIRECTOR': return 'bg-[#EAE6FF] text-[#403294]';
            case 'MANAGER': return 'bg-[#DEEBFF] text-[#0052CC]';
            case 'TEAM_LEADER': return 'bg-[#E3FCEF] text-[#006644]';
            case 'EMPLOYEE': return 'bg-[#DFE1E6] text-[#172B4D]';
            default: return 'bg-[#EBECF0] text-[#172B4D]';
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-[#DFE1E6]">
                {/* Header */}
                <div className="p-6 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0052CC] flex items-center justify-center text-white">
                            <UserIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#172B4D]">Team Member Profile</h3>
                            <p className="text-xs text-[#6B778C]">Strategic performance and workload overview</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-[#EBECF0] rounded-sm text-[#6B778C] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-0 overflow-y-auto max-h-[70vh]">
                    {isLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[#0052CC]" />
                            <p className="text-sm font-medium text-[#6B778C]">Synchronizing profile data...</p>
                        </div>
                    ) : user ? (
                        <div className="divide-y divide-[#DFE1E6]">
                            {/* Identity Section */}
                            <div className="p-8 bg-white flex flex-col md:flex-row gap-8">
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 rounded-full bg-[#DEEBFF] border-4 border-white shadow-md flex items-center justify-center text-[#0052CC] text-3xl font-bold overflow-hidden">
                                        {user.image ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" /> : user.name?.charAt(0)}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-2xl font-bold text-[#172B4D]">{user.name}</h2>
                                            <span className={cn("px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase", getRoleColor(user.role))}>
                                                {user.role}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm text-[#6B778C] font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Mail className="w-4 h-4" />
                                                {user.email}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Briefcase className="w-4 h-4" />
                                                {user.department || 'General Operations'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-sm border border-[#DFE1E6] bg-[#FAFBFC]">
                                            <div className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-2 flex items-center justify-between">
                                                Performance
                                                {user.performanceTrend === 'UP' && <TrendingUp className="w-3 h-3 text-[#36B37E]" />}
                                                {user.performanceTrend === 'DOWN' && <TrendingDown className="w-3 h-3 text-[#FF5630]" />}
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-bold text-[#172B4D]">{user.performanceScore}%</span>
                                                <span className="text-xs font-bold text-[#36B37E]">Active</span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-sm border border-[#DFE1E6] bg-[#FAFBFC]">
                                            <div className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-2">Rank</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-bold text-[#0052CC]">#{user.rank || 'N/A'}</span>
                                                <span className="text-xs font-bold text-[#6B778C]">Company Wide</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hierarchy Section */}
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#FAFBFC]/50">
                                <div>
                                    <h4 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <GitMerge className="w-3.5 h-3.5" />
                                        Reporting Line
                                    </h4>
                                    {user.manager ? (
                                        <div className="flex items-center gap-3 p-3 bg-white border border-[#DFE1E6] rounded-sm group hover:border-[#0052CC] transition-colors cursor-default">
                                            <div className="w-8 h-8 rounded-full bg-[#EBECF0] flex items-center justify-center text-[10px] font-bold">
                                                {user.manager.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-[#172B4D]">{user.manager.name}</div>
                                                <div className="text-[10px] text-[#6B778C]">Direct Supervisor</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-[#6B778C] italic p-3 border border-dashed border-[#DFE1E6] rounded-sm text-center">
                                            Reports directly to Board
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5" />
                                        Direct Reports ({user.subordinates?.length || 0})
                                    </h4>
                                    <div className="space-y-2">
                                        {user.subordinates?.length > 0 ? (
                                            user.subordinates.slice(0, 3).map((sub: any) => (
                                                <div key={sub.id} className="flex items-center justify-between p-2 bg-white border border-[#DFE1E6] rounded-sm">
                                                    <span className="text-xs font-bold text-[#42526E]">{sub.name}</span>
                                                    <span className="text-[9px] font-bold text-[#0052CC] uppercase">{sub.role}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-[#6B778C] italic p-3 border border-dashed border-[#DFE1E6] rounded-sm text-center">
                                                No direct reports assigned
                                            </div>
                                        )}
                                        {user.subordinates?.length > 3 && (
                                            <div className="text-[10px] text-center text-[#0052CC] font-bold">+ {user.subordinates.length - 3} more members</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Workload Section */}
                            <div className="p-8">
                                <h4 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-widest mb-6">Current Workload Matrix</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#0052CC]" />
                                                <span className="text-sm font-bold text-[#172B4D]">Active Missions</span>
                                            </div>
                                            <span className="text-lg font-bold text-[#0052CC]">{user._count?.milestones || 0}</span>
                                        </div>
                                        <div className="w-full bg-[#EBECF0] h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-[#0052CC] h-full" style={{ width: `${Math.min((user._count?.milestones || 0) * 10, 100)}%` }} />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#36B37E]" />
                                                <span className="text-sm font-bold text-[#172B4D]">Tactical Tasks</span>
                                            </div>
                                            <span className="text-lg font-bold text-[#172B4D]">{user.activeTasks || 0}</span>
                                        </div>
                                        <div className="w-full bg-[#EBECF0] h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-[#36B37E] h-full" style={{ width: `${Math.min((user.activeTasks || 0) * 5, 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-20 text-center">
                            <p className="text-[#6B778C]">User intelligence not found. They may have been unassigned.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#DFE1E6] bg-[#FAFBFC] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Close Intelligence</Button>
                    <Button variant="primary" leftIcon={<Briefcase className="w-4 h-4" />}>Assign Strategy</Button>
                </div>
            </div>
        </div>
    );
}
