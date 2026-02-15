'use client';

import React, { useState } from 'react';
import {
    FileText,
    TrendingUp,
    AlertCircle,
    BookOpen,
    Kanban,
    CheckSquare,
    Users,
    Layout,
    CheckCircle2,
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const tabs = ['Achievements', 'Portfolio Activity', 'Executive Actions', 'Portfolios'];

interface WorkActivityFeedProps {
    data?: {
        milestones?: any[];
        actions?: any[];
        activity?: any[];
    };
}

export default function WorkActivityFeed({ data }: WorkActivityFeedProps) {
    const [activeTab, setActiveTab] = useState(data ? 'Achievements' : 'Worked on');

    const mockWorkItems: Record<string, any[]> = {
        'Worked on': [
            { id: '1', title: 'SmartGrid Modernization Plan', type: 'Design Document', icon: FileText, time: '2h ago' },
            { id: '2', title: 'Q1 Resource Allocation', type: 'Analytics Report', icon: TrendingUp, time: '4h ago' },
        ],
        'Assigned to me': [
            { id: '6', title: 'Review Smart Contract B', type: 'Decision Task', icon: CheckSquare, time: 'Due Today', priority: 'High' },
        ],
        'Boards': [
            { id: '9', title: 'Engineering Sprint 24', type: 'Software Board', icon: Layout, time: 'Active' },
        ]
    };

    let renderData: any[] = [];
    if (data) {
        if (activeTab === 'Achievements') {
            renderData = (data.milestones || []).map(m => ({
                id: m.id,
                title: m.title,
                type: m.projectName,
                icon: CheckCircle2,
                time: m.completedAt ? formatDistanceToNow(new Date(m.completedAt)) + ' ago' : 'Recently',
                owner: m.ownerName
            }));
        } else if (activeTab === 'Portfolio Activity') {
            renderData = (data.activity || []).map(p => ({
                id: p.id,
                title: p.title,
                type: 'New Project Created',
                icon: TrendingUp,
                time: formatDistanceToNow(new Date(p.createdAt)) + ' ago'
            }));
        } else if (activeTab === 'Executive Actions') {
            renderData = (data.actions || []).map(t => ({
                id: t.id,
                title: t.title,
                type: 'Priority: ' + t.priority,
                icon: CheckSquare,
                time: t.dueDate ? 'Due ' + formatDistanceToNow(new Date(t.dueDate)) : 'No Due Date',
                priority: t.priority
            }));
        } else if (activeTab === 'Portfolios') {
            renderData = (data.activity || []).map(s => ({ // Reusing activity if mapped or passing spaces
                id: s.id,
                title: s.title,
                type: 'Active Portfolio',
                icon: Layout,
                time: 'Operational'
            }));
        } else {
            renderData = [];
        }
    } else {
        renderData = mockWorkItems[activeTab] || [];
    }

    return (
        <div className="space-y-6">
            <div className="flex border-b border-[#DFE1E6] overflow-x-auto no-scrollbar">
                {tabs.filter(t => t !== 'Organization Milestones' || data).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-4 py-3 text-sm font-bold transition-all relative whitespace-nowrap",
                            activeTab === tab
                                ? "text-[#0052CC] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-[#0052CC]"
                                : "text-[#42526E] hover:text-[#172B4D] hover:bg-[#F4F5F7]"
                        )}
                    >
                        {tab}
                        {tab === 'Assigned to me' && !data && (
                            <span className="ml-2 bg-[#FF5630] text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">2</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {renderData.length === 0 ? (
                    <div className="p-10 text-center">
                        <Calendar className="w-8 h-8 text-[#DFE1E6] mx-auto mb-3" />
                        <p className="text-sm text-[#6B778C]">No recent activity found in this segment.</p>
                    </div>
                ) : (
                    renderData.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 hover:bg-[#F4F5F7] rounded-sm cursor-pointer group transition-colors">
                            <div className={cn("p-2 border border-[#DFE1E6] rounded-sm bg-white shadow-sm border-l-2",
                                item.priority === 'High' ? 'border-l-[#FF5630]' : 'border-l-[#0052CC]')}>
                                <item.icon className={cn("w-4 h-4", activeTab === 'Organization Milestones' ? "text-[#36B37E]" : "text-[#42526E]")} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 md:gap-4">
                                    <span className="text-sm font-bold text-[#172B4D] group-hover:text-[#0052CC] truncate md:whitespace-nowrap">{item.title}</span>
                                    <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider flex-shrink-0">{item.time}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[11px] text-[#6B778C] font-medium">{item.type}</span>
                                    {item.owner && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-[#DFE1E6]" />
                                            <span className="text-[10px] text-[#0052CC] font-bold">{item.owner}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
