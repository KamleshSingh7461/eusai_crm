"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { addDays, format } from 'date-fns';
import { CalendarCheck2, CalendarX2, Check, Gauge, Minus, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { ExportDoc } from '@/lib/reportExport';
import { DateRange, ExportMenu, rangeLabel, roleName } from './shared';

type Cell = 'filed' | 'missed' | 'pending' | 'off' | 'holiday' | 'na';
export interface Person { id: string; name: string; role: string; image?: string | null; createdAt?: string }

const MAX_GRID_DAYS = 62;
const key = (d: Date) => format(d, 'yyyy-MM-dd');

export default function ComplianceView({ range, viewer, people }: { range: DateRange; viewer: string; people: Person[] }) {
    const [filedSet, setFiledSet] = useState<Set<string>>(new Set()); // `${userId}|${day}`
    const [holidays, setHolidays] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<'rate' | 'name'>('rate');

    const load = useCallback(async () => {
        setLoading(true);
        const [rep, hol] = await Promise.all([
            fetch(`/api/reports/daily?type=team&startDate=${range.from}&endDate=${range.to}`).then(r => (r.ok ? r.json() : null)).catch(() => null),
            fetch(`/api/holidays?from=${range.from}&to=${range.to}`).then(r => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        setFiledSet(new Set((rep?.reports || []).map((r: any) => `${r.userId}|${key(new Date(r.date))}`)));
        setHolidays(new Map((hol?.holidays || []).map((h: any) => [h.date, h.name])));
        setLoading(false);
    }, [range.from, range.to]);
    useEffect(() => { load(); }, [load]);

    const days = useMemo(() => {
        const list: Date[] = [];
        for (let d = new Date(`${range.from}T00:00:00`); key(d) <= range.to; d = addDays(d, 1)) list.push(d);
        return list;
    }, [range.from, range.to]);
    const todayKey = key(new Date());

    // first report per person: someone's start is the earlier of their account date and their first report
    const firstFiled = useMemo(() => {
        const m = new Map<string, string>();
        for (const k of filedSet) { const [id, day] = k.split('|'); if (!m.has(id) || day < m.get(id)!) m.set(id, day); }
        return m;
    }, [filedSet]);

    const rows = useMemo(() => people.map(p => {
        const created = p.createdAt ? key(new Date(p.createdAt)) : '0000-00-00';
        const first = firstFiled.get(p.id);
        const joined = first && first < created ? first : created;
        let filed = 0, missed = 0, expected = 0;
        const cells: Cell[] = days.map(d => {
            const k = key(d);
            const did = filedSet.has(`${p.id}|${k}`);
            const holiday = holidays.has(k);
            const weekend = d.getDay() === 0 || d.getDay() === 6;
            if (k < joined || k > todayKey) return 'na';
            if (holiday || weekend) { if (did) filed++; return did ? 'filed' : holiday ? 'holiday' : 'off'; }
            if (did) { filed++; expected++; return 'filed'; }
            if (k === todayKey) return 'pending';
            expected++; missed++;
            return 'missed';
        });
        const workingFiled = cells.filter((c, i) => c === 'filed' && !(holidays.has(key(days[i])) || days[i].getDay() === 0 || days[i].getDay() === 6)).length;
        return { ...p, cells, filed, missed, expected, rate: expected ? Math.round((workingFiled / expected) * 100) : null };
    }).sort((a, b) => order === 'name' ? a.name.localeCompare(b.name) : (a.rate ?? 101) - (b.rate ?? 101) || a.name.localeCompare(b.name)),
    [people, days, filedSet, firstFiled, holidays, todayKey, order]);

    const totals = useMemo(() => {
        const expected = rows.reduce((s, r) => s + r.expected, 0);
        const missed = rows.reduce((s, r) => s + r.missed, 0);
        const onTime = expected - missed;
        const workingDays = days.filter(d => !(holidays.has(key(d)) || d.getDay() === 0 || d.getDay() === 6) && key(d) <= todayKey).length;
        return { expected, missed, filed: onTime, rate: expected ? Math.round((onTime / expected) * 100) : null, workingDays, perfect: rows.filter(r => r.expected && r.missed === 0).length };
    }, [rows, days, holidays, todayKey]);

    const showGrid = days.length <= MAX_GRID_DAYS;
    const LABEL: Record<Cell, string> = { filed: 'Filed', missed: 'Missed', pending: 'Due today', off: 'Weekend', holiday: 'Holiday', na: '' };

    const buildExport = (): ExportDoc => ({
        title: 'Report submission tracker',
        subtitle: rangeLabel(range),
        generatedBy: viewer,
        fileName: `Report submission tracker ${range.from} to ${range.to}`,
        filters: [{ label: 'People', value: `${people.length} in your scope` }, { label: 'Counting', value: 'Working days only (weekends and holidays excluded)' }],
        summary: [
            { label: 'Compliance', value: totals.rate === null ? 'n/a' : `${totals.rate}%` },
            { label: 'Reports due', value: totals.expected },
            { label: 'Filed on time', value: totals.filed },
            { label: 'Missed', value: totals.missed },
            { label: 'Working days', value: totals.workingDays },
            { label: 'People with no misses', value: totals.perfect },
        ],
        tables: [
            {
                name: 'Compliance by person',
                description: 'Lowest compliance first. Days before a person joined are not counted.',
                columns: [
                    { key: 'name', header: 'Name', width: 22 }, { key: 'role', header: 'Role', width: 14 },
                    { key: 'expected', header: 'Reports due', type: 'number', width: 11 }, { key: 'filed', header: 'Filed (incl. days off)', type: 'number', width: 15 },
                    { key: 'missed', header: 'Missed', type: 'number', width: 9 }, { key: 'rate', header: 'Compliance %', type: 'percent', width: 12 },
                ],
                rows: rows.map(r => ({ name: r.name, role: roleName(r.role), expected: r.expected, filed: r.filed, missed: r.missed, rate: r.rate })),
            },
            {
                name: 'Missed reports',
                description: 'Every working day without a report.',
                columns: [{ key: 'date', header: 'Date', type: 'date', width: 14 }, { key: 'day', header: 'Day', width: 10 }, { key: 'name', header: 'Name', width: 24 }, { key: 'role', header: 'Role', width: 16 }],
                rows: rows.flatMap(r => r.cells.map((c, i) => (c === 'missed' ? { date: key(days[i]), day: format(days[i], 'EEEE'), name: r.name, role: roleName(r.role) } : null)).filter(Boolean) as Record<string, unknown>[])
                    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(a.name).localeCompare(String(b.name))),
            },
            ...(days.length <= 31 ? [{
                name: 'Daily grid',
                description: 'Y filed, N missed, W weekend, H holiday, P due today.',
                columns: [{ key: 'name', header: 'Name', width: 20 }, ...days.map(d => ({ key: key(d), header: format(d, 'd EEEEE'), type: 'status' as const, width: 4 }))],
                rows: rows.map(r => Object.fromEntries([['name', r.name], ...r.cells.map((c, i) => [key(days[i]), ({ filed: 'Y', missed: 'N', off: 'W', holiday: 'H', pending: 'P', na: '' } as Record<Cell, string>)[c]])])),
            }] : []),
        ],
    });

    if (!people.length) {
        return <div className="glass"><EmptyState icon={Users} title="No one to track" description="People who file daily reports in your scope will appear here." /></div>;
    }

    return (
        <div className="space-y-5">
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Compliance" value={totals.rate === null ? '–' : `${totals.rate}%`} icon={Gauge} tone={totals.rate === null ? 'slate' : totals.rate >= 90 ? 'emerald' : totals.rate >= 70 ? 'amber' : 'rose'} note={`${totals.workingDays} working day${totals.workingDays === 1 ? '' : 's'} counted`} />
                <StatCard label="Filed on time" value={totals.filed} icon={CalendarCheck2} tone="emerald" note={`of ${totals.expected} reports due`} />
                <StatCard label="Missed" value={totals.missed} icon={CalendarX2} tone={totals.missed ? 'rose' : 'emerald'} note="Working days without a report" />
                <StatCard label="No misses" value={`${totals.perfect}/${rows.length}`} icon={Users} tone="blue" note="People with a full record" />
            </section>

            <div className="flex flex-wrap items-center gap-2">
                <div role="tablist" aria-label="Order" className="inline-flex items-center gap-0.5 rounded-lg border border-[#232327] bg-[#111113] p-1">
                    {([['rate', 'Lowest compliance first'], ['name', 'By name']] as const).map(([id, label]) => (
                        <button key={id} role="tab" aria-selected={order === id} onClick={() => setOrder(id)}
                            className={cn('rounded-md px-2.5 py-1 text-sm font-medium transition-colors', order === id ? 'bg-[#27272A] text-white' : 'text-zinc-400 hover:text-zinc-200')}>{label}</button>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                    <Legend className="bg-emerald-500/80"><Check className="h-3 w-3 text-white" /></Legend>Filed
                    <Legend className="bg-rose-500/20 ring-1 ring-inset ring-rose-500/40"><X className="h-3 w-3 text-rose-400" /></Legend>Missed
                    <Legend className="ring-1 ring-inset ring-blue-500/60" />Due today
                    <Legend className="bg-[#18181B]"><Minus className="h-3 w-3 text-zinc-600" /></Legend>Weekend
                    <Legend className="bg-emerald-500/10" />Holiday
                </div>
                <div className="ml-auto"><ExportMenu build={buildExport} disabled={loading} /></div>
            </div>

            {loading ? (
                <div className="h-72 animate-pulse rounded-xl bg-[#111113]" />
            ) : (
                <div className="glass overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0 text-sm">
                            <thead>
                                <tr className="text-xs text-zinc-500">
                                    <th className="sticky left-0 z-20 min-w-[200px] border-b border-[#232327] bg-[#111113] px-4 py-2.5 text-left font-medium">Person</th>
                                    <th className="border-b border-[#232327] bg-[#111113] px-2 py-2.5 text-right font-medium">Rate</th>
                                    <th className="border-b border-[#232327] bg-[#111113] px-2 py-2.5 text-right font-medium">Missed</th>
                                    {showGrid && days.map(d => {
                                        const k = key(d);
                                        const off = holidays.has(k) || d.getDay() === 0 || d.getDay() === 6;
                                        return (
                                            <th key={k} title={holidays.get(k) || format(d, 'EEEE d MMMM')}
                                                className={cn('min-w-[28px] border-b border-[#232327] bg-[#111113] px-0.5 py-1.5 text-center font-medium', off && 'text-zinc-700', k === todayKey && 'text-blue-400')}>
                                                <span className="block text-[10px] leading-none">{format(d, 'EEEEE')}</span>
                                                <span className="block tabular-nums">{format(d, 'd')}</span>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(r => (
                                    <tr key={r.id} className="group">
                                        <td className="sticky left-0 z-10 border-b border-[#1C1C1F] bg-[#111113] px-4 py-2 group-hover:bg-[#18181B]">
                                            <Link href={`/team/${r.id}`} className="flex items-center gap-2.5">
                                                <Avatar src={r.image} alt={r.name} fallback={initialsOf(r.name)} className="h-7 w-7 text-[10px]" />
                                                <span className="min-w-0">
                                                    <span className="block truncate font-medium text-zinc-100 hover:underline">{r.name}</span>
                                                    <span className="block text-xs text-zinc-500">{roleName(r.role)}</span>
                                                </span>
                                            </Link>
                                        </td>
                                        <td className={cn('border-b border-[#1C1C1F] px-2 py-2 text-right font-semibold tabular-nums group-hover:bg-[#18181B]',
                                            r.rate === null ? 'text-zinc-600' : r.rate >= 90 ? 'text-emerald-400' : r.rate >= 70 ? 'text-amber-400' : 'text-rose-400')}>
                                            {r.rate === null ? '–' : `${r.rate}%`}
                                        </td>
                                        <td className={cn('border-b border-[#1C1C1F] px-2 py-2 text-right tabular-nums group-hover:bg-[#18181B]', r.missed ? 'text-rose-400' : 'text-zinc-600')}>{r.missed}</td>
                                        {showGrid && r.cells.map((c, i) => (
                                            <td key={i} title={`${format(days[i], 'EEE d MMM')}: ${c === 'holiday' ? holidays.get(key(days[i])) : LABEL[c] || 'Not counted'}`}
                                                className="border-b border-[#1C1C1F] px-0.5 py-2 text-center group-hover:bg-[#18181B]">
                                                <span className={cn('mx-auto flex h-5 w-5 items-center justify-center rounded',
                                                    c === 'filed' && 'bg-emerald-500/80', c === 'missed' && 'bg-rose-500/20 ring-1 ring-inset ring-rose-500/40',
                                                    c === 'pending' && 'ring-1 ring-inset ring-blue-500/60', c === 'off' && 'bg-[#18181B]', c === 'holiday' && 'bg-emerald-500/10')}>
                                                    {c === 'filed' && <Check className="h-3 w-3 text-white" />}
                                                    {c === 'missed' && <X className="h-3 w-3 text-rose-400" />}
                                                    {c === 'off' && <Minus className="h-3 w-3 text-zinc-700" />}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!showGrid && <p className="border-t border-[#232327] px-4 py-3 text-xs text-zinc-500">The day-by-day grid shows for ranges of {MAX_GRID_DAYS} days or less. Rates above cover the whole period, and exports include every missed day.</p>}
                </div>
            )}
        </div>
    );
}

function Legend({ className, children }: { className?: string; children?: React.ReactNode }) {
    return <span className={cn('inline-flex h-4 w-4 items-center justify-center rounded', className)}>{children}</span>;
}
