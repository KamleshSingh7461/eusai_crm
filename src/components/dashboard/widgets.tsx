"use client";

import React, { useId } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertCircle, CheckCircle2, ChevronRight, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Card, { CardHeader } from '@/components/ui/Card';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { humanize, statusTone, TONES, type Tone } from '@/components/ui/tones';

export const tooltipStyle = {
    contentStyle: { background: '#11141B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, color: '#E2E8F0', boxShadow: '0 12px 32px -8px rgba(0,0,0,0.8)' },
    labelStyle: { color: '#94A3B8', marginBottom: 4 },
    itemStyle: { color: '#E2E8F0' },
};
const axisTick = { fill: '#64748B', fontSize: 12 };

export const greeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
};
export const todayLabel = () => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
export const firstName = (name?: string | null) => (name || 'there').split(' ')[0];

export const timeAgo = (date?: string | Date | null) => {
    if (!date) return '';
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const units: [number, string][] = [[60, 'min'], [24, 'hr'], [7, 'day'], [4.35, 'wk'], [12, 'mo']];
    let value = seconds / 60;
    let label = 'min';
    for (let i = 1; i < units.length && value >= units[i][0]; i++) {
        value /= units[i][0];
        label = units[i][1];
    }
    const n = Math.floor(value);
    return `${n} ${label}${n === 1 || label === 'min' || label === 'hr' ? '' : 's'} ago`;
};

/* ---------- states ---------- */
export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-24 w-2/3" />
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-44" />)}</div>
            <div className="grid gap-5 xl:grid-cols-3"><Skeleton className="h-80 xl:col-span-2" /><Skeleton className="h-80" /></div>
        </div>
    );
}

export function DashboardError({ message, onRetry }: { message?: string; onRetry: () => void }) {
    return (
        <Card className="mx-auto mt-16 max-w-lg text-center" padding="lg">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/25"><AlertCircle className="h-6 w-6" /></span>
            <h3 className="mt-4 font-display text-lg font-bold text-white">Dashboard couldn't load</h3>
            <p className="mt-1 text-sm text-slate-400">{message || 'Check your connection and try again.'}</p>
            <Button className="mt-5" variant="secondary" onClick={onRetry} leftIcon={<RefreshCw className="h-4 w-4" />}>Try again</Button>
        </Card>
    );
}

/* ---------- charts ---------- */
export function TrendChart({ data, xKey, series, height = 256 }: {
    data: Record<string, any>[];
    xKey: string;
    series: { key: string; label: string; color: string; dashed?: boolean }[];
    height?: number;
}) {
    const id = useId().replace(/:/g, '');
    return (
        <div style={{ height }} className="-ml-3">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                        {series.map(s => (
                            <linearGradient key={s.key} id={`${id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={s.color} stopOpacity={0.45} />
                                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={axisTick} dy={8} />
                    <YAxis tickLine={false} axisLine={false} tick={axisTick} width={36} allowDecimals={false} />
                    <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.15)' }} {...tooltipStyle} />
                    {series.map(s => (
                        <Area
                            key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2.5}
                            strokeDasharray={s.dashed ? '5 5' : undefined} fill={s.dashed ? 'transparent' : `url(#${id}-${s.key})`}
                            activeDot={{ r: 5, fill: s.color, stroke: '#07090D', strokeWidth: 3 }}
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function BarTrend({ data, xKey, yKey, label, color = '#60A5FA', height = 220 }: {
    data: Record<string, any>[]; xKey: string; yKey: string; label: string; color?: string; height?: number;
}) {
    const id = useId().replace(/:/g, '');
    return (
        <div style={{ height }} className="-ml-3">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`bar-${id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.35} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={axisTick} dy={8} />
                    <YAxis tickLine={false} axisLine={false} tick={axisTick} width={36} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} {...tooltipStyle} />
                    <Bar dataKey={yKey} name={label} fill={`url(#bar-${id})`} radius={[8, 8, 0, 0]} maxBarSize={36} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

/** Donut with a centered total and a legend list. Slices pick tones from their status names. */
export function DonutBreakdown({ data, centerLabel, emptyText = 'Nothing to show yet' }: {
    data: { name: string; value: number }[]; centerLabel: string; emptyText?: string;
}) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return <p className="py-10 text-center text-sm text-slate-500">{emptyText}</p>;
    return (
        <div className="flex flex-col items-center gap-6 sm:flex-row xl:flex-col 2xl:flex-row">
            <div className="relative h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={56} outerRadius={76} paddingAngle={3} stroke="none" cornerRadius={6}>
                            {data.map(d => <Cell key={d.name} fill={TONES[statusTone(d.name)].stroke} />)}
                        </Pie>
                        <Tooltip {...tooltipStyle} formatter={(v: any, n: any) => [v, humanize(String(n))]} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-3xl font-bold text-white tabular-nums">{total}</span>
                    <span className="text-xs text-slate-400">{centerLabel}</span>
                </div>
            </div>
            <ul className="w-full space-y-2.5">
                {data.map(d => (
                    <li key={d.name} className="flex items-center gap-3 text-sm">
                        <span className={cn('h-2.5 w-2.5 rounded-full', TONES[statusTone(d.name)].dot)} />
                        <span className="flex-1 text-slate-300">{humanize(d.name)}</span>
                        <span className="font-semibold text-white tabular-nums">{d.value}</span>
                        <span className="w-10 text-right text-xs text-slate-500 tabular-nums">{Math.round((d.value / total) * 100)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Ranked horizontal bars, e.g. projects per department. */
export function BarList({ items, emptyText = 'Nothing to show yet' }: {
    items: { label: string; value: number; color?: string; href?: string; tone?: Tone }[]; emptyText?: string;
}) {
    const max = Math.max(1, ...items.map(i => i.value));
    if (items.length === 0) return <p className="py-8 text-center text-sm text-slate-500">{emptyText}</p>;
    return (
        <ul className="space-y-3">
            {items.map((item, i) => {
                const color = item.color || TONES[item.tone || 'blue'].stroke;
                const row = (
                    <div className="group">
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="truncate text-slate-300 group-hover:text-white">{item.label}</span>
                            <span className="font-semibold text-white tabular-nums">{item.value}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                            <motion.div
                                initial={{ width: 0 }} animate={{ width: `${(item.value / max) * 100}%` }}
                                transition={{ duration: 0.9, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                                className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}66, ${color})` }}
                            />
                        </div>
                    </div>
                );
                return <li key={item.label + i}>{item.href ? <Link href={item.href}>{row}</Link> : row}</li>;
            })}
        </ul>
    );
}

/* ---------- lists ---------- */
export function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link href={href} className="flex items-center gap-1 text-sm font-medium text-blue-300 transition hover:text-blue-200">
            {children} <ChevronRight className="h-4 w-4" />
        </Link>
    );
}

export function ActivityList({ items, emptyText = 'No recent activity' }: {
    items: { id: string; title: string; subtitle?: string; who?: string | null; image?: string | null; at?: string | Date | null; done?: boolean; href?: string }[];
    emptyText?: string;
}) {
    if (items.length === 0) return <p className="py-10 text-center text-sm text-slate-500">{emptyText}</p>;
    return (
        <ol className="space-y-1">
            {items.map((a, i) => {
                const content = (
                    <div className="relative flex gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.03]">
                        {i < items.length - 1 && <span className="absolute left-[29px] top-12 bottom-[-6px] w-px bg-white/[0.06]" />}
                        <div className="relative">
                            <Avatar src={a.image} alt={a.who || ''} fallback={initialsOf(a.who)} className="h-9 w-9 text-xs" />
                            <span className={cn('absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-[#0B0E14]', a.done ? 'bg-emerald-500' : 'bg-amber-500')}>
                                {a.done ? <CheckCircle2 className="h-2.5 w-2.5 text-white" /> : <Clock className="h-2.5 w-2.5 text-white" />}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-100">{a.title}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                                {[a.who || 'Unassigned', a.subtitle].filter(Boolean).join(' · ')}
                            </p>
                        </div>
                        {a.at && <span className="shrink-0 text-xs text-slate-500">{timeAgo(a.at)}</span>}
                    </div>
                );
                return <li key={a.id}>{a.href ? <Link href={a.href}>{content}</Link> : content}</li>;
            })}
        </ol>
    );
}

export { Card, CardHeader };
