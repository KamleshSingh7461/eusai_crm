"use client";

import { CheckSquare, Filter, User, Calendar, Flag } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Task {
    id: string;
    title: string;
    project: string;
    assignee: {
        name: string;
        role: string;
        avatar?: string;
    };
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    dueDate: string;
}

interface TaskTrackerProps {
    tasks: Task[];
}

export default function TaskTracker({ tasks }: TaskTrackerProps) {
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');

    const priorityColors: Record<string, string> = {
        LOW: 'bg-gray-100 text-gray-700',
        MEDIUM: 'bg-blue-100 text-blue-700',
        HIGH: 'bg-orange-100 text-orange-700',
        CRITICAL: 'bg-red-100 text-red-700'
    };

    const statusColors: Record<string, string> = {
        TODO: 'bg-gray-100 text-gray-700',
        IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
        COMPLETED: 'bg-green-100 text-green-700'
    };

    const filteredTasks = tasks.filter(t => {
        if (filterRole !== 'all' && t.assignee.role !== filterRole) return false;
        if (filterStatus !== 'all' && t.status !== filterStatus) return false;
        if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
        return true;
    });

    const tasksByStatus = {
        TODO: filteredTasks.filter(t => t.status === 'TODO'),
        IN_PROGRESS: filteredTasks.filter(t => t.status === 'IN_PROGRESS'),
        COMPLETED: filteredTasks.filter(t => t.status === 'COMPLETED')
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
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
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                </select>

                <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="bg-white border border-[#DFE1E6] rounded-sm py-2 px-3 text-sm text-subheading focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                >
                    <option value="all">All Priority</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                </select>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatusCard title="To Do" count={tasksByStatus.TODO.length} icon={<CheckSquare className="w-5 h-5" />} color="gray" />
                <StatusCard title="In Progress" count={tasksByStatus.IN_PROGRESS.length} icon={<CheckSquare className="w-5 h-5" />} color="yellow" />
                <StatusCard title="Completed" count={tasksByStatus.COMPLETED.length} icon={<CheckSquare className="w-5 h-5" />} color="green" />
            </div>

            {/* Tasks Table */}
            <div className="bg-white border border-[#DFE1E6] rounded-sm shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#FAFBFC] border-b border-[#DFE1E6]">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-body uppercase tracking-wider">
                                Task
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-body uppercase tracking-wider">
                                Assignee
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-body uppercase tracking-wider">
                                Priority
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-body uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-body uppercase tracking-wider">
                                Due Date
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFE1E6]">
                        {filteredTasks.map((task) => (
                            <tr key={task.id} className="hover:bg-[#F4F5F7] transition-colors">
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-bold text-sm text-subheading">{task.title}</div>
                                        <div className="text-xs text-body">{task.project}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#DEEBFF] flex items-center justify-center text-xs font-bold text-[#0052CC]">
                                            {task.assignee.avatar || task.assignee.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-subheading">{task.assignee.name}</div>
                                            <div className="text-xs text-body">{task.assignee.role}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn("px-2 py-1 rounded-sm text-xs font-bold uppercase flex items-center gap-1 w-fit", priorityColors[task.priority])}>
                                        <Flag className="w-3 h-3" />
                                        {task.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn("px-2 py-1 rounded-sm text-xs font-bold uppercase", statusColors[task.status])}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-subheading">
                                    {task.dueDate}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatusCard({ title, count, icon, color }: any) {
    const colors: Record<string, string> = {
        gray: 'bg-gray-50 text-gray-600 border-gray-200',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        green: 'bg-green-50 text-green-600 border-green-200'
    };

    return (
        <div className={cn("border rounded-sm p-4", colors[color])}>
            <div className="flex items-center justify-between mb-2">
                {icon}
                <span className="text-2xl font-bold">{count}</span>
            </div>
            <h3 className="text-sm font-bold">{title}</h3>
        </div>
    );
}
