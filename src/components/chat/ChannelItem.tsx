"use client";

import { Hash, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelItemProps {
    ch: any;
    selected: boolean;
    onClick: () => void;
    icon?: LucideIcon;
    badge?: number;
}

export default function ChannelItem({ ch, selected, onClick, icon: Icon = Hash, badge }: ChannelItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all group mb-1 border border-transparent",
                selected 
                    ? "bg-blue-600/10 text-blue-400 font-bold border-blue-500/10 shadow-lg shadow-blue-900/5" 
                    : "text-white/40 hover:bg-white/5 hover:text-white/60"
            )}
        >
            <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                selected ? "bg-blue-600/20" : "bg-white/5 group-hover:bg-white/10"
            )}>
                <Icon className={cn("w-4 h-4", selected ? "text-blue-400" : "text-white/20")} />
            </div>
            <span className="truncate flex-1 text-left tracking-tight font-medium">{ch.name}</span>
            {badge && badge > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-[10px] font-black text-white flex items-center justify-center animate-pulse">
                    {badge}
                </span>
            )}
        </button>
    );
}
