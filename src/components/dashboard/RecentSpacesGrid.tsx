'use client';

import React from 'react';
import { MoreHorizontal, Layout, Users, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const recentSpaces = [
    {
        name: 'EUSAI TEAM',
        type: 'Product Discovery',
        icon: Layout,
        color: 'bg-[#0052CC]',
        views: '124 views'
    },
    {
        name: 'HR Strategy',
        type: 'Resource Management',
        icon: Users,
        color: 'bg-[#FF5630]',
        views: '42 views'
    },
    {
        name: 'Financial Audit',
        type: 'Project Finance',
        icon: Target,
        color: 'bg-[#36B37E]',
        views: '18 views'
    }
];

export default function RecentSpacesGrid() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-widest">Recent Spaces</h3>
                <MoreHorizontal className="w-4 h-4 text-[#6B778C] cursor-pointer" />
            </div>
            <div className="space-y-2">
                {recentSpaces.map(space => (
                    <div key={space.name} className="card-eusai p-3 hover:bg-[#F4F5F7] cursor-pointer transition-colors flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-sm flex items-center justify-center text-white text-[10px] font-bold shadow-sm", space.color)}>
                            {space.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-[#172B4D]">{space.name}</h4>
                            <p className="text-[10px] text-[#6B778C]">{space.views}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
