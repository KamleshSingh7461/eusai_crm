'use client';

import React from 'react';
import { TrendingUp, Radio } from 'lucide-react';

const newsItems: any[] = [];

export default function NewsFeed() {
    return (
        <div className="card-eusai bg-white border-[#DFE1E6]">
            <h3 className="text-sm font-bold text-[#172B4D] mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#36B37E]" />
                    News & Updates
                </div>
                <Radio className="w-3 h-3 text-[#FF5630] animate-pulse" />
            </h3>
            <div className="space-y-4">
                {newsItems.length === 0 ? (
                    <div className="py-8 text-center">
                        <p className="text-[11px] text-[#6B778C] italic">Everything is running smooth. You're up to date.</p>
                    </div>
                ) : (
                    newsItems.map(item => (
                        <div key={item.id} className={`border-l-2 ${item.color} pl-3 py-1 group cursor-pointer hover:bg-slate-50 transition-colors rounded-r-sm`}>
                            <p className="text-xs font-bold text-[#172B4D] group-hover:text-[#0052CC] transition-colors">{item.title}</p>
                            <p className="text-[10px] text-[#6B778C]">{item.summary}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
