'use client';

import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkspaceHealthWidgetProps {
    stats?: {
        critical: number;
        total: number;
    };
}

export default function WorkspaceHealthWidget({ stats }: WorkspaceHealthWidgetProps) {
    const hasIssues = stats && stats.total > 0;

    return (
        <div className="card-eusai bg-[#FAFBFC] border-[#4C9AFF]/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#0052CC]" />
            <h3 className="text-sm font-bold text-[#172B4D] mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0052CC]" />
                {stats ? 'Organization Health' : 'AI Workspace Health'}
            </h3>
            <div className="space-y-4">
                {stats ? (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white border border-[#DFE1E6] rounded-sm text-center">
                            <div className="text-xl font-bold text-[#FF5630]">{stats.critical}</div>
                            <div className="text-[9px] font-bold text-[#6B778C] uppercase tracking-tighter">Critical Issues</div>
                        </div>
                        <div className="p-3 bg-white border border-[#DFE1E6] rounded-sm text-center">
                            <div className="text-xl font-bold text-[#0052CC]">{stats.total}</div>
                            <div className="text-[9px] font-bold text-[#6B778C] uppercase tracking-tighter">Open Issues</div>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-white border border-[#DFE1E6] rounded-sm">
                        <p className="text-xs text-[#172B4D] font-medium leading-relaxed">
                            Project <span className="text-[#0052CC] font-bold">SmartGrid</span> is at risk due to resource bottlenecks.
                        </p>
                    </div>
                )}

                <div className={cn("p-3 border rounded-sm",
                    hasIssues ? "bg-[#FFFAE6] border-[#FFAB00]/20" : "bg-[#E3F2FD] border-[#0052CC]/10")}>
                    <p className="text-[10px] text-[#0052CC] font-bold uppercase tracking-wider mb-1">
                        {(stats?.critical ?? 0) > 0 ? 'Urgent Action' : (hasIssues ? 'Attention Required' : 'Organization Status')}
                    </p>
                    <p className="text-xs text-[#172B4D]">
                        {(stats?.critical ?? 0) > 0
                            ? `Resolve ${stats?.critical} critical bottlenecks in the portfolio to maintain annual velocity.`
                            : (hasIssues
                                ? `Manage ${stats?.total} pending issues to prevent portfolio-wide delays.`
                                : "The organization is currently operating within healthy parameters with no outstanding issues.")}
                    </p>
                </div>

                <button className="w-full py-2 text-xs font-bold text-[#0052CC] hover:bg-[#DEEBFF] transition-colors rounded-sm border border-transparent hover:border-[#0052CC]/20">
                    {stats ? 'View Impact Analysis' : 'View Full AI Analysis'}
                </button>
            </div>
        </div>
    );
}
