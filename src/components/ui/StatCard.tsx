"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Card from './Card';
import Sparkline from './Sparkline';
import { TONES, type Tone } from './tones';

interface StatCardProps {
    label: string;
    value: React.ReactNode;
    icon: React.ElementType;
    tone?: Tone;
    /** e.g. "+3" or "-12%" */
    delta?: string;
    /** whether the delta is good news (green) or bad (red) */
    deltaPositive?: boolean;
    note?: string;
    trend?: number[];
    href?: string;
    onClick?: () => void;
    delay?: number;
}

export default function StatCard({ label, value, icon: Icon, tone = 'blue', delta, deltaPositive = true, note, trend, href, onClick, delay }: StatCardProps) {
    const t = TONES[tone];
    const clickable = !!(href || onClick);

    const body = (
        <Card delay={delay} interactive={clickable} onClick={onClick} padding="none" className="group h-full overflow-hidden p-4 sm:p-5">
            <div className="flex items-start justify-between">
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset', t.tile)}>
                    <Icon className="h-[18px] w-[18px]" />
                </span>
                {clickable && <ChevronRight className="h-4 w-4 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300" />}
            </div>
            <p className="mt-4 truncate text-xs font-medium text-zinc-400 sm:mt-5 sm:text-sm">{label}</p>
            <div className="mt-1 flex items-end justify-between gap-3">
                <p className="font-display text-2xl sm:text-[28px] leading-none font-semibold truncate tracking-[-0.03em] text-white tabular-nums">{value}</p>
                {trend && <Sparkline data={trend} color={t.stroke} className="-mb-1 hidden h-10 w-24 shrink-0 sm:block" />}
            </div>
            {(delta || note) && (
                <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:mt-4">
                    {delta && (
                        <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium ring-1 ring-inset', deltaPositive ? TONES.emerald.chip : TONES.rose.chip)}>
                            {deltaPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{delta}
                        </span>
                    )}
                    {note && <span className="truncate text-zinc-500">{note}</span>}
                </div>
            )}
        </Card>
    );

    return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}
