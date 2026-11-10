"use client";

import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TabItem {
    id: string;
    label: React.ReactNode;
    icon?: React.ElementType;
    count?: number;
}

interface TabsProps {
    items: TabItem[];
    value: string;
    onChange: (id: string) => void;
    size?: 'sm' | 'md';
    className?: string;
}

/** Segmented pill tabs with a sliding highlight. Scrolls sideways on narrow screens. */
export default function Tabs({ items, value, onChange, size = 'md', className }: TabsProps) {
    const layoutId = useId();
    return (
        <div className={cn('max-w-full overflow-x-auto [scrollbar-width:none]', className)}>
            <div role="tablist" className="inline-flex items-center gap-0.5 rounded-lg border border-[#232327] bg-[#111113] p-1">
                {items.map(item => {
                    const active = item.id === value;
                    return (
                        <button
                            key={item.id}
                            role="tab"
                            aria-selected={active}
                            onClick={() => onChange(item.id)}
                            className={cn(
                                'relative flex items-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors',
                                size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
                                active ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                            )}
                        >
                            {active && (
                                <motion.span layoutId={layoutId} className="absolute inset-0 rounded-md bg-[#27272A]" transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />
                            )}
                            {item.icon && <item.icon className={cn('relative h-4 w-4', active ? 'text-zinc-100' : '')} />}
                            <span className="relative">{item.label}</span>
                            {item.count !== undefined && (
                                <span className={cn('relative rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums', active ? 'bg-blue-500/20 text-blue-200' : 'bg-white/[0.06] text-zinc-400')}>
                                    {item.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
