"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TONES, type Tone } from './tones';

/** Animated bar. Tone defaults by value: green >= 75, amber >= 40, rose below. */
export function ProgressBar({ value, tone, className, glow }: { value: number; tone?: Tone; className?: string; glow?: boolean }) {
    const pct = Math.max(0, Math.min(100, Math.round(value || 0)));
    const t = TONES[tone ?? (pct >= 75 ? 'emerald' : pct >= 40 ? 'amber' : 'rose')];
    return (
        <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]', className)}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${t.stroke}99, ${t.stroke})`, boxShadow: glow ? `0 0 12px ${t.stroke}99` : undefined }}
            />
        </div>
    );
}

/** Circular progress with a label in the middle. */
export function ProgressRing({ value, size = 160, stroke = 14, label, from = '#34D399', to = '#22D3EE' }: {
    value: number; size?: number; stroke?: number; label?: React.ReactNode; from?: string; to?: string;
}) {
    const pct = Math.max(0, Math.min(100, Math.round(value || 0)));
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const gid = `ring-${from.slice(1)}-${to.slice(1)}`;
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
                <defs>
                    <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={from} /><stop offset="100%" stopColor={to} /></linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    style={{ filter: `drop-shadow(0 0 8px ${from}73)` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="font-display text-4xl font-bold text-white tabular-nums">{pct}%</p>
                {label && <p className="text-xs text-slate-400">{label}</p>}
            </div>
        </div>
    );
}
