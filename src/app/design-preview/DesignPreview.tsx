"use client";

import React, { useState } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
    LayoutDashboard, Inbox, CalendarDays, FolderKanban, Flag, CheckSquare, AlertCircle, BarChart3,
    TrendingUp, Users, GraduationCap, Building2, Search, Bell, Plus, ChevronDown, ArrowUpRight,
    ArrowDownRight, Sparkles, FileWarning, Briefcase, ShieldAlert, MoreHorizontal, Clock, CheckCircle2,
    Command, Filter, Download, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const display = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['500', '600', '700', '800'] });

/* ---------- sample data (preview only) ---------- */
const spark = (values: number[]) => values.map((v, i) => ({ i, v }));
const kpis = [
    { label: 'Missing reports', value: '4', delta: '+2', trend: 'down', note: 'vs yesterday', icon: FileWarning, tone: 'rose', data: spark([1, 2, 1, 3, 2, 2, 4]) },
    { label: 'Active projects', value: '12', delta: '+3', trend: 'up', note: 'this month', icon: Briefcase, tone: 'blue', data: spark([6, 7, 7, 9, 10, 11, 12]) },
    { label: 'Total staff', value: '48', delta: '+5', trend: 'up', note: 'this quarter', icon: Users, tone: 'violet', data: spark([38, 40, 41, 43, 44, 46, 48]) },
    { label: 'Critical risks', value: '0', delta: '-2', trend: 'up', note: 'resolved this week', icon: ShieldAlert, tone: 'emerald', data: spark([3, 3, 2, 2, 1, 1, 0]) },
];
const velocity = [
    { m: 'Jun', done: 42, planned: 50 }, { m: 'Jul', done: 51, planned: 55 }, { m: 'Aug', done: 48, planned: 58 },
    { m: 'Sep', done: 63, planned: 62 }, { m: 'Oct', done: 71, planned: 68 }, { m: 'Nov', done: 79, planned: 74 },
];
const team = [
    { name: 'Priya Sharma', role: 'Team Leader', dept: 'Partnerships', tasks: 34, rate: 94, status: 'On track' },
    { name: 'Rahul Kapoor', role: 'Employee', dept: 'University outreach', tasks: 28, rate: 81, status: 'On track' },
    { name: 'Ananya Iyer', role: 'Manager', dept: 'Merchandise', tasks: 22, rate: 67, status: 'At risk' },
    { name: 'Vikram Singh', role: 'Intern', dept: 'Sports logo', tasks: 15, rate: 48, status: 'Behind' },
];
const activity = [
    { who: 'Priya Sharma', what: 'closed milestone', target: 'Delhi University MOU', time: '12 min ago', tone: 'emerald' },
    { who: 'Rahul Kapoor', what: 'submitted daily report', target: '6.5 hrs logged', time: '38 min ago', tone: 'blue' },
    { who: 'Ananya Iyer', what: 'flagged an issue', target: 'Jersey vendor delay', time: '1 hr ago', tone: 'amber' },
    { who: 'Vikram Singh', what: 'missed report window', target: 'Nov 1', time: '5 hr ago', tone: 'rose' },
];
const milestones = [
    { title: 'Mumbai University MOU', cat: 'MOU', progress: 82, due: 'Nov 8', owner: 'PS' },
    { title: 'Spirit merchandise launch', cat: 'Business order', progress: 56, due: 'Nov 15', owner: 'AI' },
    { title: 'Sports logo approvals', cat: 'Sports logo', progress: 31, due: 'Nov 22', owner: 'VS' },
];

/* ---------- design tokens ---------- */
const TONES: Record<string, { text: string; tile: string; chip: string; stroke: string; dot: string }> = {
    blue: { text: 'text-sky-300', tile: 'from-blue-500/25 to-blue-500/5 ring-blue-400/25 text-blue-300', chip: 'bg-blue-500/12 text-blue-300 ring-blue-400/20', stroke: '#60A5FA', dot: 'bg-blue-400' },
    violet: { text: 'text-violet-300', tile: 'from-violet-500/25 to-violet-500/5 ring-violet-400/25 text-violet-300', chip: 'bg-violet-500/12 text-violet-300 ring-violet-400/20', stroke: '#A78BFA', dot: 'bg-violet-400' },
    emerald: { text: 'text-emerald-300', tile: 'from-emerald-500/25 to-emerald-500/5 ring-emerald-400/25 text-emerald-300', chip: 'bg-emerald-500/12 text-emerald-300 ring-emerald-400/20', stroke: '#34D399', dot: 'bg-emerald-400' },
    amber: { text: 'text-amber-300', tile: 'from-amber-500/25 to-amber-500/5 ring-amber-400/25 text-amber-300', chip: 'bg-amber-500/12 text-amber-300 ring-amber-400/20', stroke: '#FBBF24', dot: 'bg-amber-400' },
    rose: { text: 'text-rose-300', tile: 'from-rose-500/25 to-rose-500/5 ring-rose-400/25 text-rose-300', chip: 'bg-rose-500/12 text-rose-300 ring-rose-400/20', stroke: '#FB7185', dot: 'bg-rose-400' },
};
const STATUS_TONE: Record<string, string> = { 'On track': 'emerald', 'At risk': 'amber', 'Behind': 'rose' };
const ROLE_TONE: Record<string, string> = { Manager: 'violet', 'Team Leader': 'blue', Employee: 'emerald', Intern: 'amber' };

const glass = 'relative rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-white/[0.015] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_20px_40px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl';
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

function Card({ className, children, delay = 0 }: { className?: string; children: React.ReactNode; delay?: number }) {
    return (
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }} className={cn(glass, className)}>
            {children}
        </motion.div>
    );
}

function Chip({ tone, children, className }: { tone: string; children: React.ReactNode; className?: string }) {
    return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', TONES[tone].chip, className)}>{children}</span>;
}

function Avatar({ initials, tone = 'blue', size = 'md' }: { initials: string; tone?: string; size?: 'sm' | 'md' }) {
    return (
        <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold ring-1 ring-inset', TONES[tone].tile, size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-xs')}>
            {initials}
        </span>
    );
}

const initialsOf = (name: string) => name.split(' ').map(p => p[0]).join('').slice(0, 2);

/* ---------- shell ---------- */
const NAV = [
    { group: 'Overview', items: [{ icon: LayoutDashboard, label: 'Dashboard', active: true }, { icon: Inbox, label: 'Inbox', badge: '3' }, { icon: CalendarDays, label: 'Meetings' }] },
    { group: 'Work', items: [{ icon: FolderKanban, label: 'Projects' }, { icon: Flag, label: 'Milestones' }, { icon: CheckSquare, label: 'Tasks', badge: '12' }, { icon: AlertCircle, label: 'Issues' }] },
    { group: 'Insights', items: [{ icon: BarChart3, label: 'Reports' }, { icon: TrendingUp, label: 'Performance' }] },
    { group: 'Organization', items: [{ icon: Users, label: 'Team' }, { icon: Building2, label: 'Departments' }, { icon: GraduationCap, label: 'Universities' }] },
];

function Sidebar() {
    return (
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[264px] flex-col border-r border-white/[0.06] bg-[#080A0F]/80 backdrop-blur-2xl">
            <div className="flex items-center gap-3 px-5 h-16">
                <div className="h-9 w-9 rounded-xl bg-white p-1 shadow-[0_0_24px_rgba(59,130,246,0.35)]">
                    <img src="/EUSAI-LOGO.png" alt="" className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className={cn(display.className, 'text-[15px] font-bold tracking-tight text-white')}>EUSAI Team</p>
                    <p className="text-xs text-slate-500">Enterprise workspace</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
            </div>

            <div className="px-4 pb-3">
                <button className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 h-10 text-sm text-slate-400 hover:bg-white/[0.05] transition">
                    <Search className="h-4 w-4" />
                    <span className="flex-1 text-left">Search anything</span>
                    <kbd className="flex items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-slate-400"><Command className="h-3 w-3" />K</kbd>
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.08)_transparent]">
                {NAV.map(section => (
                    <div key={section.group}>
                        <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{section.group}</p>
                        <div className="space-y-0.5">
                            {section.items.map(item => (
                                <a key={item.label} className={cn(
                                    'group relative flex items-center gap-3 rounded-xl px-3 h-10 text-sm font-medium transition cursor-pointer',
                                    item.active
                                        ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/[0.04] text-white ring-1 ring-inset ring-blue-400/20'
                                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                                )}>
                                    {item.active && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-blue-400 shadow-[0_0_12px_2px_rgba(96,165,250,0.7)]" />}
                                    <item.icon className={cn('h-[18px] w-[18px]', item.active ? 'text-blue-300' : 'text-slate-500 group-hover:text-slate-300')} />
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge && <span className="rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[11px] font-semibold text-slate-300">{item.badge}</span>}
                                </a>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-3 space-y-3">
                <div className="relative overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-600/25 via-indigo-600/15 to-violet-600/20 p-4">
                    <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-blue-400/30 blur-2xl" />
                    <Sparkles className="h-5 w-5 text-blue-200" />
                    <p className="mt-2 text-sm font-semibold text-white">EUSAI Insight Engine</p>
                    <p className="mt-1 text-xs leading-relaxed text-blue-100/70">AI summaries of team performance, coming soon.</p>
                </div>
                <div className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.04] transition">
                    <Avatar initials="AD" tone="violet" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-100">Admin Director</p>
                        <p className="truncate text-xs text-slate-500">admin@eusaiteam.com</p>
                    </div>
                    <Chip tone="violet">Director</Chip>
                </div>
            </div>
        </aside>
    );
}

function Topbar() {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/[0.06] bg-[#07090D]/70 px-6 lg:px-10 backdrop-blur-2xl">
            <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Workspace</span>
                <ChevronRight className="h-4 w-4 text-slate-600" />
                <span className="font-medium text-slate-200">Dashboard</span>
            </div>
            <div className="flex-1" />
            <div className="hidden md:flex items-center rounded-xl border border-white/[0.07] bg-white/[0.03] p-1 text-xs font-medium">
                {['7D', '30D', 'Quarter', 'Year'].map((r, i) => (
                    <button key={r} className={cn('rounded-lg px-3 py-1.5 transition', i === 1 ? 'bg-white/[0.09] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}>{r}</button>
                ))}
            </div>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] transition" aria-label="Notifications">
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#07090D]" />
            </button>
            <button className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-4 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(59,130,246,0.8),inset_0_1px_0_rgba(255,255,255,0.25)] hover:from-blue-400 hover:to-blue-500 transition">
                <Plus className="h-4 w-4" /> Create
            </button>
        </header>
    );
}

/* ---------- widgets ---------- */
function KpiCard({ kpi, delay }: { kpi: typeof kpis[number]; delay: number }) {
    const tone = TONES[kpi.tone];
    const good = kpi.trend === 'up';
    return (
        <Card delay={delay} className="group p-5 overflow-hidden hover:border-white/[0.12] hover:-translate-y-0.5 transition-[transform,border-color] duration-300">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" style={{ background: tone.stroke + '33' }} />
            <div className="flex items-start justify-between">
                <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset', tone.tile)}>
                    <kpi.icon className="h-5 w-5" />
                </span>
                <button className="rounded-lg p-1 text-slate-500 hover:bg-white/[0.05] hover:text-slate-300" aria-label="More"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
            <p className="mt-5 text-sm font-medium text-slate-400">{kpi.label}</p>
            <div className="mt-1 flex items-end justify-between gap-3">
                <p className={cn(display.className, 'text-[34px] leading-none font-bold tracking-tight text-white tabular-nums')}>{kpi.value}</p>
                <div className="h-10 w-24 -mb-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={kpi.data}>
                            <defs>
                                <linearGradient id={`sp-${kpi.tone}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={tone.stroke} stopOpacity={0.45} />
                                    <stop offset="100%" stopColor={tone.stroke} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke={tone.stroke} strokeWidth={2} fill={`url(#sp-${kpi.tone})`} isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
                <Chip tone={good ? 'emerald' : 'rose'}>
                    {good ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{kpi.delta}
                </Chip>
                <span className="text-slate-500">{kpi.note}</span>
            </div>
        </Card>
    );
}

function VelocityChart() {
    return (
        <Card delay={0.25} className="p-6 xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h3 className={cn(display.className, 'text-lg font-bold text-white')}>Delivery velocity</h3>
                    <p className="mt-1 text-sm text-slate-400">Tasks completed against plan, last 6 months</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)]" />Completed</span>
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-500" />Planned</span>
                </div>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
                <p className={cn(display.className, 'text-3xl font-bold text-white tabular-nums')}>354</p>
                <Chip tone="emerald"><ArrowUpRight className="h-3 w-3" />18.2%</Chip>
            </div>
            <div className="mt-4 h-64 -ml-3">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={velocity} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="vel" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} />
                                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={8} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} width={40} />
                        <Tooltip
                            cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
                            contentStyle={{ background: '#11141B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, color: '#E2E8F0' }}
                        />
                        <Area type="monotone" dataKey="planned" stroke="#475569" strokeDasharray="5 5" strokeWidth={2} fill="transparent" />
                        <Area type="monotone" dataKey="done" stroke="#60A5FA" strokeWidth={2.5} fill="url(#vel)" activeDot={{ r: 5, fill: '#60A5FA', stroke: '#07090D', strokeWidth: 3 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function ComplianceRing() {
    const pct = 86, r = 64, c = 2 * Math.PI * r;
    const rows = [
        { label: 'Submitted on time', value: 38, tone: 'emerald' },
        { label: 'Submitted late', value: 6, tone: 'amber' },
        { label: 'Missing', value: 4, tone: 'rose' },
    ];
    return (
        <Card delay={0.3} className="p-6">
            <h3 className={cn(display.className, 'text-lg font-bold text-white')}>Report compliance</h3>
            <p className="mt-1 text-sm text-slate-400">Daily reports, this week</p>
            <div className="relative mx-auto mt-6 h-40 w-40">
                <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
                    <defs>
                        <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#34D399" /><stop offset="100%" stopColor="#22D3EE" />
                        </linearGradient>
                    </defs>
                    <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
                    <motion.circle
                        cx="80" cy="80" r={r} fill="none" stroke="url(#ring)" strokeWidth="14" strokeLinecap="round"
                        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }}
                        transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{ filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.45))' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className={cn(display.className, 'text-4xl font-bold text-white tabular-nums')}>{pct}%</p>
                    <p className="text-xs text-slate-400">compliance</p>
                </div>
            </div>
            <div className="mt-6 space-y-3">
                {rows.map(row => (
                    <div key={row.label} className="flex items-center gap-3 text-sm">
                        <span className={cn('h-2.5 w-2.5 rounded-full', TONES[row.tone].dot)} />
                        <span className="flex-1 text-slate-300">{row.label}</span>
                        <span className="font-semibold text-white tabular-nums">{row.value}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function TeamTable() {
    return (
        <Card delay={0.35} className="xl:col-span-2 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-4">
                <div>
                    <h3 className={cn(display.className, 'text-lg font-bold text-white')}>Team performance</h3>
                    <p className="mt-1 text-sm text-slate-400">Top contributors across departments</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm font-medium text-slate-300 hover:bg-white/[0.06] transition"><Filter className="h-4 w-4" />Filter</button>
                    <button className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm font-medium text-slate-300 hover:bg-white/[0.06] transition"><Download className="h-4 w-4" />Export</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                    <thead>
                        <tr className="border-y border-white/[0.06] bg-white/[0.02] text-left text-xs font-medium text-slate-500">
                            <th className="px-6 py-3 font-medium">Member</th>
                            <th className="px-3 py-3 font-medium">Role</th>
                            <th className="px-3 py-3 font-medium text-right">Tasks</th>
                            <th className="px-3 py-3 font-medium">Completion</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {team.map(m => {
                            const tone = STATUS_TONE[m.status];
                            return (
                                <tr key={m.name} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition">
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <Avatar initials={initialsOf(m.name)} tone={ROLE_TONE[m.role]} />
                                            <div>
                                                <p className="font-semibold text-slate-100">{m.name}</p>
                                                <p className="text-xs text-slate-500">{m.dept}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3.5"><Chip tone={ROLE_TONE[m.role]}>{m.role}</Chip></td>
                                    <td className="px-3 py-3.5 text-right font-semibold text-slate-200 tabular-nums">{m.tasks}</td>
                                    <td className="px-3 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/[0.06]">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${m.rate}%` }} transition={{ duration: 1, delay: 0.5 }}
                                                    className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${TONES[tone].stroke}99, ${TONES[tone].stroke})` }} />
                                            </div>
                                            <span className="w-9 text-xs font-semibold text-slate-300 tabular-nums">{m.rate}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5"><Chip tone={tone}><span className={cn('h-1.5 w-1.5 rounded-full', TONES[tone].dot)} />{m.status}</Chip></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function ActivityFeed() {
    return (
        <Card delay={0.4} className="p-6">
            <div className="flex items-center justify-between">
                <h3 className={cn(display.className, 'text-lg font-bold text-white')}>Live activity</h3>
                <span className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                    <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative h-2 w-2 rounded-full bg-emerald-400" /></span>
                    Live
                </span>
            </div>
            <ol className="mt-5 space-y-5">
                {activity.map((a, i) => (
                    <li key={i} className="relative flex gap-3">
                        {i < activity.length - 1 && <span className="absolute left-[17px] top-10 bottom-[-20px] w-px bg-white/[0.06]" />}
                        <Avatar initials={initialsOf(a.who)} tone={a.tone} />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-300"><span className="font-semibold text-slate-100">{a.who}</span> {a.what}</p>
                            <p className="mt-0.5 truncate text-sm text-slate-500">{a.target}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3 w-3" />{a.time}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </Card>
    );
}

function MilestoneCards() {
    return (
        <div className="grid gap-5 md:grid-cols-3">
            {milestones.map((m, i) => (
                <Card key={m.title} delay={0.45 + i * 0.05} className="group p-5 hover:border-white/[0.12] transition">
                    <div className="flex items-center justify-between">
                        <Chip tone="blue"><Flag className="h-3 w-3" />{m.cat}</Chip>
                        <span className="flex items-center gap-1 text-xs text-slate-400"><CalendarDays className="h-3.5 w-3.5" />Due {m.due}</span>
                    </div>
                    <p className="mt-4 text-[15px] font-semibold text-white">{m.title}</p>
                    <div className="mt-4 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Progress</span>
                        <span className="font-semibold text-slate-200 tabular-nums">{m.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${m.progress}%` }} transition={{ duration: 1.1, delay: 0.6 }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <Avatar initials={m.owner} size="sm" tone="violet" />
                        <span className="flex items-center gap-1 text-sm font-medium text-blue-300 opacity-80 group-hover:opacity-100 transition">Open <ArrowUpRight className="h-4 w-4" /></span>
                    </div>
                </Card>
            ))}
        </div>
    );
}

/* ---------- page ---------- */
export default function DesignPreview() {
    const [tab, setTab] = useState('Organization pulse');
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="min-h-screen bg-[#07090D] text-slate-200 antialiased selection:bg-blue-500/30">
            {/* ambient depth */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 left-1/4 h-[520px] w-[720px] rounded-full bg-blue-600/[0.14] blur-[140px]" />
                <div className="absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full bg-violet-600/[0.10] blur-[140px]" />
                <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            </div>

            <Sidebar />
            <div className="relative lg:pl-[264px]">
                <Topbar />
                <main className="mx-auto max-w-[1440px] px-6 lg:px-10 py-8 space-y-6">
                    {/* hero */}
                    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                        className="flex flex-wrap items-end justify-between gap-6">
                        <div>
                            <p className="flex items-center gap-2 text-sm font-medium text-blue-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,1)]" />
                                Director overview · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                            <h1 className={cn(display.className, 'mt-2 text-4xl font-extrabold tracking-tight text-white')}>
                                {greeting}, <span className="bg-gradient-to-r from-blue-300 via-sky-200 to-violet-300 bg-clip-text text-transparent">Admin</span>
                            </h1>
                            <p className="mt-2 text-base text-slate-400">Here is how your organization is performing today.</p>
                        </div>
                        <div className="flex items-center rounded-2xl border border-white/[0.07] bg-white/[0.03] p-1.5 backdrop-blur-xl">
                            {['Organization pulse', 'Staff analytics', 'Project portfolio', 'Activity'].map(t => (
                                <button key={t} onClick={() => setTab(t)} className={cn('relative rounded-xl px-4 py-2 text-sm font-medium transition', tab === t ? 'text-white' : 'text-slate-400 hover:text-slate-200')}>
                                    {tab === t && <motion.span layoutId="tab" className="absolute inset-0 rounded-xl bg-white/[0.08] ring-1 ring-inset ring-white/10" transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />}
                                    <span className="relative">{t}</span>
                                </button>
                            ))}
                        </div>
                    </motion.section>

                    {/* alert banner */}
                    <Card delay={0.05} className="flex flex-wrap items-center gap-4 border-rose-400/20 bg-gradient-to-r from-rose-500/[0.12] via-rose-500/[0.04] to-transparent px-5 py-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/25"><FileWarning className="h-5 w-5" /></span>
                        <div className="flex-1 min-w-[200px]">
                            <p className="text-sm font-semibold text-white">4 team members haven't submitted today's report</p>
                            <p className="text-sm text-slate-400">The submission window closes at 11:59 PM IST.</p>
                        </div>
                        <button className="h-9 rounded-xl bg-white/[0.08] px-4 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 hover:bg-white/[0.12] transition">Send reminder</button>
                    </Card>

                    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        {kpis.map((k, i) => <KpiCard key={k.label} kpi={k} delay={0.1 + i * 0.05} />)}
                    </section>

                    <section className="grid gap-5 xl:grid-cols-3">
                        <VelocityChart />
                        <ComplianceRing />
                    </section>

                    <section className="grid gap-5 xl:grid-cols-3">
                        <TeamTable />
                        <ActivityFeed />
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className={cn(display.className, 'text-xl font-bold text-white')}>Upcoming milestones</h2>
                            <button className="flex items-center gap-1 text-sm font-medium text-blue-300 hover:text-blue-200">View all <ChevronRight className="h-4 w-4" /></button>
                        </div>
                        <MilestoneCards />
                    </section>

                    <p className="pt-4 pb-10 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Design preview with sample data. Not your live numbers.
                    </p>
                </main>
            </div>
        </div>
    );
}
