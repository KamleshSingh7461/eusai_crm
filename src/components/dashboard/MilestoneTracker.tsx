"use client";

import { Target, Filter, Search, User, Calendar, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Milestone {
    id: string;
    title: string;
    project: string;
    assignee: {
        name: string;
        role: string;
        avatar?: string;
    };
    status: 'ON_TRACK' | 'AT_RISK' | 'DELAYED' | 'COMPLETED';
    dueDate: string;
    progress: number;
}

interface MilestoneTrackerProps {
    milestones: Milestone[];
}

export default function MilestoneTracker({ milestones }: MilestoneTrackerProps) {
    const [view, setView] = useState<'table' | 'kanban'>('table');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const statusColors: Record<string, string> = {
        ON_TRACK: 'bg-green-100 text-green-700',
        AT_RISK: 'bg-yellow-100 text-yellow-700',
        DELAYED: 'bg-red-100 text-red-700',
        COMPLETED: 'bg-blue-100 text-blue-700'
    };

    const filteredMilestones = milestones.filter(m => {
        if (filterRole !== 'all' && m.assignee.role !== filterRole) return false;
        if (filterStatus !== 'all' && m.status !== filterStatus) return false;
        return true;
    });

    return (
        <div className="space-y-4">
            {/* Header and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant={view === 'table' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setView('table')}
                    >
                        Table
                    </Button>
                    <Button
                        variant={view === 'kanban' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setView('kanban')}
                    >
                        Kanban
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="bg-white border border-[#DFE1E6] rounded-sm py-2 px-3 text-sm text-subheading focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                    >
                        <option value="all">All Roles</option>
                        <option value="DIRECTOR">Director</option>
                        <option value="MANAGER">Manager</option>
                        <option value="TEAM_LEADER">Team Leader</option>
                        <option value="EMPLOYEE">Employee</option>
                        <option value="INTERN">Intern</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-white border border-[#DFE1E6] rounded-sm py-2 px-3 text-sm text-subheading focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                    >
                        <option value="all">All Status</option>
                        <option value="ON_TRACK">On Track</option>
                        <option value="AT_RISK">At Risk</option>
                        <option value="DELAYED">Delayed</option>
                        <option value="COMPLETED">Completed</option>
                    </select>
                </div>
            </div>

            {/* Table View */}
            {view === 'table' && (
                <div className="bg-white border border-[#DFE1E6] rounded-sm shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#FAFBFC] border-b border-[#DFE1E6]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-body uppercase tracking-wider">
                                    Milestone
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-body uppercase tracking-wider">
                                    Assignee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-body uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-body uppercase tracking-wider">
                                    Due Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-body uppercase tracking-wider">
                                    Progress
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DFE1E6]">
                            {filteredMilestones.map((milestone) => (
                                <tr key={milestone.id} className="hover:bg-[#F4F5F7] transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-bold text-sm text-subheading">{milestone.title}</div>
                                            <div className="text-xs text-body">{milestone.project}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#DEEBFF] flex items-center justify-center text-xs font-bold text-[#0052CC]">
                                                {milestone.assignee.avatar || milestone.assignee.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-subheading">{milestone.assignee.name}</div>
                                                <div className="text-xs text-body">{milestone.assignee.role}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn("px-2 py-1 rounded-sm text-xs font-bold uppercase", statusColors[milestone.status])}>
                                            {milestone.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-subheading">
                                        {milestone.dueDate}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-[#DFE1E6] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#0052CC]"
                                                    style={{ width: `${milestone.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-body">{milestone.progress}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Kanban View */}
            {view === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {['ON_TRACK', 'AT_RISK', 'DELAYED', 'COMPLETED'].map((status) => (
                        <div key={status} className="bg-[#F4F5F7] rounded-sm p-4">
                            <h3 className="text-xs font-bold text-body uppercase tracking-wider mb-3">
                                {status.replace('_', ' ')} ({filteredMilestones.filter(m => m.status === status).length})
                            </h3>
                            <div className="space-y-2">
                                {filteredMilestones
                                    .filter(m => m.status === status)
                                    .map((milestone) => (
                                        <div key={milestone.id} className="bg-white border border-[#DFE1E6] rounded-sm p-3 hover:shadow-md transition-all cursor-pointer">
                                            <h4 className="font-bold text-sm text-heading mb-1">{milestone.title}</h4>
                                            <p className="text-xs text-body mb-2">{milestone.project}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-6 h-6 rounded-full bg-[#DEEBFF] flex items-center justify-center text-xs font-bold text-[#0052CC]">
                                                        {milestone.assignee.name.charAt(0)}
                                                    </div>
                                                    <span className="text-xs text-body">{milestone.assignee.role}</span>
                                                </div>
                                                <span className="text-xs text-[#97A0AF]">{milestone.progress}%</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
