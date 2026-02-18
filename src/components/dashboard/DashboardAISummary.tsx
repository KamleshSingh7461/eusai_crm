"use client";

import { useState, useEffect } from 'react';
import { Sparkles, Bot, Loader2, RefreshCcw } from 'lucide-react';

interface DashboardAISummaryProps {
    role: string;
    contextData: any;
}

export default function DashboardAISummary({ role, contextData }: DashboardAISummaryProps) {
    return (
        <div className="relative group overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#191919]/60 backdrop-blur-xl p-6 shadow-2xl transition-all hover:bg-[#191919]/80">
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <div className="relative z-10 flex gap-4">
                <div className="shrink-0 pt-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0052CC]/20 to-purple-500/20 border border-[#0052CC]/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,82,204,0.15)]">
                        <Sparkles className="w-4 h-4 text-[#0052CC]" />
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-200 flex items-center gap-3">
                            EUSAI Insight Engine
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold tracking-widest uppercase">Coming Soon</span>
                        </h3>
                    </div>

                    <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-4xl">
                        Advanced predictive modeling and performance intelligence are currently being synchronized with your dataset.
                    </p>
                </div>
            </div>

            {/* Background sparkle effect */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />
        </div>
    );
}
