"use client";

import { AlertCircle, Filter, User, Calendar, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Issue {
    id: string;
    title: string;
    description: string;
    project: string;
    reportedBy: {
        name: string;
        role: string;
        avatar?: string;
    };
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    createdAt: string;
}

interface IssuesTrackerProps {
    issues: Issue[];
}

export default function IssuesTracker({ issues }: IssuesTrackerProps) {
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterSeverity, setFilterSeverity] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const severityColors: Record<string, string> = {
        LOW: 'bg-blue-100 text-blue-700 border-blue-200',
        MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
        CRITICAL: 'bg-red-100 text-red-700 border-red-200'
    };

    const statusColors: Record<string, string> = {
        OPEN: 'bg-gray-100 text-gray-700',
        IN_PROGRESS: 'bg-purple-100 text-purple-700',
        RESOLVED: 'bg-green-100 text-green-700'
    };

    const filteredIssues = issues.filter(issue => {
        if (filterRole !== 'all' && issue.reportedBy.role !== filterRole) return false;
        if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
        if (filterStatus !== 'all' && issue.status !== filterStatus) return false;
        return true;
    });

    const issuesBySeverity = {
        CRITICAL: filteredIssues.filter(i => i.severity === 'CRITICAL'),
        HIGH: filteredIssues.filter(i => i.severity === 'HIGH'),
        MEDIUM: filteredIssues.filter(i => i.severity === 'MEDIUM'),
        LOW: filteredIssues.filter(i => i.severity === 'LOW')
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
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="bg-white border border-[#DFE1E6] rounded-sm py-2 px-3 text-sm text-subheading focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                >
                    <option value="all">All Severity</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                </select>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-white border border-[#DFE1E6] rounded-sm py-2 px-3 text-sm text-subheading focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                >
                    <option value="all">All Status</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                </select>
            </div>

            {/* Severity Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SeverityCard title="Critical" count={issuesBySeverity.CRITICAL.length} color="red" />
                <SeverityCard title="High" count={issuesBySeverity.HIGH.length} color="orange" />
                <SeverityCard title="Medium" count={issuesBySeverity.MEDIUM.length} color="yellow" />
                <SeverityCard title="Low" count={issuesBySeverity.LOW.length} color="blue" />
            </div>

            {/* Issues Table */}
            <div className="bg-white border border-[#DFE1E6] rounded-sm shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#FAFBFC] border-b border-[#DFE1E6]">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-body uppercase tracking-wider">
                                Issue
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-body uppercase tracking-wider">
                                Reported By
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-body uppercase tracking-wider">
                                Severity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-body uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-body uppercase tracking-wider">
                                Created
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFE1E6]">
                        {filteredIssues.map((issue) => (
                            <tr key={issue.id} className="hover:bg-[#F4F5F7] transition-colors">
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-bold text-sm text-subheading">{issue.title}</div>
                                        <div className="text-xs text-body line-clamp-1">{issue.description}</div>
                                        <div className="text-xs text-[#97A0AF] mt-1">{issue.project}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#DEEBFF] flex items-center justify-center text-xs font-bold text-[#0052CC]">
                                            {issue.reportedBy.avatar || issue.reportedBy.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-subheading">{issue.reportedBy.name}</div>
                                            <div className="text-xs text-body">{issue.reportedBy.role}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn("px-2 py-1 rounded-sm text-xs font-bold uppercase border flex items-center gap-1 w-fit", severityColors[issue.severity])}>
                                        <AlertCircle className="w-3 h-3" />
                                        {issue.severity}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn("px-2 py-1 rounded-sm text-xs font-bold uppercase", statusColors[issue.status])}>
                                        {issue.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-subheading">
                                    {issue.createdAt}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SeverityCard({ title, count, color }: any) {
    const colors: Record<string, string> = {
        red: 'bg-red-50 text-red-600 border-red-200',
        orange: 'bg-orange-50 text-orange-600 border-orange-200',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        blue: 'bg-blue-50 text-blue-600 border-blue-200'
    };

    return (
        <div className={cn("border rounded-sm p-4", colors[color])}>
            <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-2xl font-bold">{count}</span>
            </div>
            <h3 className="text-sm font-bold">{title}</h3>
        </div>
    );
}
