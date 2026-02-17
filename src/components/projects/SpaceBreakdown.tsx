'use client';

import React from 'react';
import { Layout, Briefcase, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpaceBreakdownProps {
    projects: any[];
}

export default function SpaceBreakdown({ projects }: SpaceBreakdownProps) {
    const spaceData = projects.reduce((acc: any, p: any) => {
        const spaceName = p.space?.name || 'Unassigned';
        const spaceColor = p.space?.color || '#6B778C';

        if (!acc[spaceName]) {
            acc[spaceName] = {
                name: spaceName,
                color: spaceColor,
                count: 0,

            };
        }

        acc[spaceName].count += 1;
        acc[spaceName].count += 1;

        return acc;
    }, {});

    const breakdown = Object.values(spaceData).sort((a: any, b: any) => b.count - a.count);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {breakdown.map((item: any) => (
                <div key={item.name} className="bg-white p-4 rounded-sm border border-[#DFE1E6] shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: item.color }} />
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Layout className="w-4 h-4" style={{ color: item.color }} />
                            <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider truncate max-w-[120px]">
                                {item.name}
                            </span>
                        </div>
                        <span className="text-xs font-bold text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded-full">
                            {item.count} Proj
                        </span>
                    </div>

                    <div className="space-y-3">

                    </div>
                </div>
            ))}
        </div>
    );
}
