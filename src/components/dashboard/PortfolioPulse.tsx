'use client';

import React from 'react';
import { Layout, CheckSquare, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpace } from '@/context/SpaceContext';

interface Stat {
    label: string;
    value: string;
    trend: string;
    color: string;
    icon: React.ElementType;
}

interface PortfolioPulseProps {
    data?: any[];
}

export default function PortfolioPulse({ data }: PortfolioPulseProps) {
    const { activeSpace } = useSpace();

    // Default to mock if no data provided (e.g. on specific space pages)
    const stats: Stat[] = data ? data.slice(0, 3).map(item => ({
        label: item.name,
        value: item.projectCount.toString(),
        trend: 'Active',
        color: 'text-[#0052CC]',
        icon: Layout
    })) : [];

    return (
        <div className="space-y-4">
            {activeSpace && !data && (
                <div className="mb-3 flex items-center gap-2">
                    <div
                        className="w-4 h-4 rounded-sm flex items-center justify-center text-white text-[8px] font-bold"
                        style={{ backgroundColor: activeSpace.color }}
                    >
                        {activeSpace.name.split(' ').map((word: string) => word[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs text-[#42526E]">Showing data for <span className="font-bold text-[#0052CC]">{activeSpace.name}</span></span>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.length === 0 ? (
                    <div className="col-span-1 md:col-span-3 py-12 text-center bg-white border border-dashed border-[#DFE1E6] rounded-sm">
                        <p className="text-[#6B778C] text-sm">No space intelligence available yet.</p>
                    </div>
                ) : (
                    stats.map((stat) => (
                        <div key={stat.label} className="card-eusai group border-[#DFE1E6] hover:border-[#0052CC]/30 transition-all cursor-default bg-white p-5">
                            <div className="flex items-start justify-between mb-2">
                                <div className={cn("p-2 rounded-sm bg-slate-50", stat.color)}>
                                    <stat.icon className="w-4 h-4" />
                                </div>
                                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100",
                                    stat.trend.includes('+') || stat.trend === 'Active' ? 'text-green-600' : 'text-red-500')}>
                                    {stat.trend}
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-[#172B4D]">{stat.value}</div>
                            <div className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider truncate">{stat.label}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
