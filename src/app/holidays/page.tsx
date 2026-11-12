"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { CalendarCheck2, CalendarDays, CalendarOff, ChevronLeft, ChevronRight, Flag, List, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import HolidayCalendar from '@/components/holidays/HolidayCalendar';

// people who file daily reports see their own filed/missed days on the calendar
const REPORTING_ROLES = ['EMPLOYEE', 'INTERN', 'TEAM_LEADER', 'MANAGER'];
const VIEW_KEY = 'eusai-holidays-view';

interface Holiday { id: string; date: string; name: string }

// Fixed-date national holidays in India; festival dates change every year, so those are added by hand.
const NATIONAL = [
    { md: '01-26', name: 'Republic Day' },
    { md: '08-15', name: 'Independence Day' },
    { md: '10-02', name: 'Gandhi Jayanti' },
];

const when = (iso: string) => {
    const days = differenceInCalendarDays(parseISO(iso), new Date());
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days > 1) return `In ${days} days`;
    return null;
};

export default function HolidaysPage() {
    const { showToast } = useToast();
    const [year, setYear] = useState(new Date().getFullYear());
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [canEdit, setCanEdit] = useState(false);
    const [todayOff, setTodayOff] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState('');
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const { data: session } = useSession();
    const role = ((session?.user as any)?.role || '').toUpperCase();
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [reportDays, setReportDays] = useState<Set<string> | null>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try { const v = localStorage.getItem(VIEW_KEY); if (v === 'list' || v === 'calendar') setView(v); } catch { }
    }, []);
    const switchView = (v: 'calendar' | 'list') => { setView(v); try { localStorage.setItem(VIEW_KEY, v); } catch { } };

    // this person's filed reports for the year, for the calendar's filed/missed dots
    useEffect(() => {
        if (!REPORTING_ROLES.includes(role)) { setReportDays(null); return; }
        fetch(`/api/reports/daily?type=my&startDate=${year}-01-01&endDate=${year}-12-31T23:59:59`)
            .then(r => (r.ok ? r.json() : null))
            .then(j => setReportDays(new Set((j?.reports || []).map((r: any) => format(new Date(r.date), 'yyyy-MM-dd')))))
            .catch(() => setReportDays(null));
    }, [role, year]);

    const pickDate = (d: string) => {
        setEditingId(null); setDate(d); setName('');
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => nameRef.current?.focus(), 250);
    };
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/holidays?year=${year}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setHolidays(data.holidays);
            setCanEdit(!!data.canEdit);
            setTodayOff(data.today?.isWorkingDay ? null : data.today?.reason || null);
        } catch {
            showToast('Could not load holidays', 'error');
        } finally {
            setLoading(false);
        }
    }, [year, showToast]);

    useEffect(() => { load(); }, [load]);

    const save = async (payload: { date: string; name: string }, quiet = false) => {
        const res = await fetch('/api/holidays', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not save the holiday');
        if (!quiet) showToast(`${payload.name} saved`, 'success');
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !name.trim()) return;
        setBusy(true);
        try {
            await save({ date, name: name.trim() });
            setDate(''); setName(''); setEditingId(null);
            if (date.slice(0, 4) !== String(year)) setYear(parseInt(date.slice(0, 4)));
            else load();
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally { setBusy(false); }
    };

    const remove = async (h: Holiday) => {
        if (!window.confirm(`Remove ${h.name} (${format(parseISO(h.date), 'd MMM yyyy')})? A report will be due that day again.`)) return;
        const res = await fetch(`/api/holidays?id=${h.id}`, { method: 'DELETE' });
        if (res.ok) { showToast(`${h.name} removed`, 'info'); load(); }
        else showToast('Could not remove the holiday', 'error');
    };

    const missingNational = NATIONAL.filter(n => !holidays.some(h => h.date === `${year}-${n.md}`));
    const addNational = async () => {
        setBusy(true);
        try {
            for (const n of missingNational) await save({ date: `${year}-${n.md}`, name: n.name }, true);
            showToast(`Added ${missingNational.length} national holiday${missingNational.length === 1 ? '' : 's'}`, 'success');
            load();
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally { setBusy(false); }
    };

    const byMonth = useMemo(() => {
        const groups = new Map<string, Holiday[]>();
        for (const h of holidays) {
            const key = format(parseISO(h.date), 'MMMM');
            groups.set(key, [...(groups.get(key) || []), h]);
        }
        return [...groups.entries()];
    }, [holidays]);

    const next = holidays.find(h => differenceInCalendarDays(parseISO(h.date), new Date()) >= 0);
    const weekdayCount = holidays.filter(h => { const d = parseISO(h.date).getDay(); return d !== 0 && d !== 6; }).length;

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Organization"
                title="Holidays"
                description="Days with no daily report due. Saturdays and Sundays are always off. Neither breaks anyone’s report streak."
            />

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <Card padding="md" className="flex items-center gap-3">
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset', todayOff ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' : 'bg-zinc-800 text-zinc-300 ring-zinc-700/70')}>
                        {todayOff ? <CalendarOff className="h-[18px] w-[18px]" /> : <CalendarCheck2 className="h-[18px] w-[18px]" />}
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs text-zinc-500">Today</p>
                        <p className="truncate text-sm font-semibold text-white">{todayOff ? `Day off · ${todayOff}` : 'Working day · report due'}</p>
                    </div>
                </Card>
                <Card padding="md" className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20"><Flag className="h-[18px] w-[18px]" /></span>
                    <div className="min-w-0">
                        <p className="text-xs text-zinc-500">Next holiday</p>
                        <p className="truncate text-sm font-semibold text-white">{next ? `${next.name} · ${format(parseISO(next.date), 'EEE d MMM')}` : 'None scheduled'}</p>
                    </div>
                </Card>
                <Card padding="md" className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 ring-1 ring-inset ring-violet-500/20"><CalendarOff className="h-[18px] w-[18px]" /></span>
                    <div className="min-w-0">
                        <p className="text-xs text-zinc-500">{year}</p>
                        <p className="truncate text-sm font-semibold text-white">{holidays.length} holiday{holidays.length === 1 ? '' : 's'} · {weekdayCount} on weekdays</p>
                    </div>
                </Card>
            </section>

            <div className="grid gap-5 lg:grid-cols-3">
                <Card padding="none" className="overflow-hidden lg:col-span-2">
                    <div className="flex items-center justify-between gap-3 border-b border-[#232327] px-5 py-3">
                        <div role="tablist" aria-label="View" className="inline-flex items-center gap-0.5 rounded-lg border border-[#232327] bg-[#111113] p-1">
                            {([['calendar', 'Calendar', CalendarDays], ['list', 'List', List]] as const).map(([id, label, Icon]) => (
                                <button key={id} role="tab" aria-selected={view === id} onClick={() => switchView(id)}
                                    className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors', view === id ? 'bg-[#27272A] text-white' : 'text-zinc-400 hover:text-zinc-200')}>
                                    <Icon className="h-4 w-4" />{label}
                                </button>
                            ))}
                        </div>
                        {view === 'list' && (
                            <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" aria-label="Previous year" onClick={() => setYear(y => y - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                                <span className="w-12 text-center text-sm font-medium tabular-nums text-zinc-200">{year}</span>
                                <Button size="icon" variant="ghost" aria-label="Next year" onClick={() => setYear(y => y + 1)}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        )}
                    </div>

                    {loading && view === 'list' ? (
                        <div className="space-y-2 p-5">{[0, 1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-[#18181B]" />)}</div>
                    ) : view === 'calendar' ? (
                        <HolidayCalendar year={year} onYearChange={setYear} holidays={holidays} reportDays={reportDays} canEdit={canEdit} onAdd={pickDate} onRemove={remove} />
                    ) : holidays.length === 0 ? (
                        <EmptyState icon={CalendarOff} title={`No holidays in ${year}`} description={canEdit ? 'Add one on the right. Weekends are already treated as days off.' : 'Your director hasn’t added any yet. Weekends are always days off.'} />
                    ) : (
                        <div className="divide-y divide-[#232327]">
                            {byMonth.map(([month, items]) => (
                                <div key={month}>
                                    <p className="bg-[#0E0E10] px-5 py-1.5 text-xs font-medium text-zinc-500">{month}</p>
                                    <ul className="divide-y divide-[#1C1C1F]">
                                        {items.map(h => {
                                            const d = parseISO(h.date);
                                            const past = differenceInCalendarDays(d, new Date()) < 0;
                                            const weekend = d.getDay() === 0 || d.getDay() === 6;
                                            const soon = when(h.date);
                                            return (
                                                <li key={h.id} className={cn('flex items-center gap-4 px-5 py-3', past && 'opacity-55')}>
                                                    <div className="flex w-11 shrink-0 flex-col items-center rounded-lg border border-[#2F2F35] bg-[#18181B] py-1">
                                                        <span className="text-[11px] font-medium text-zinc-500">{format(d, 'EEE')}</span>
                                                        <span className="text-base font-semibold leading-tight tabular-nums text-white">{format(d, 'd')}</span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-zinc-100">{h.name}</p>
                                                        <p className="text-xs text-zinc-500">{format(d, 'd MMMM yyyy')}{weekend ? ' · falls on a weekend' : ''}</p>
                                                    </div>
                                                    {soon && <Badge tone={soon === 'Today' ? 'emerald' : 'blue'}>{soon}</Badge>}
                                                    {canEdit && (
                                                        <div className="flex shrink-0 items-center">
                                                            <Button size="icon" variant="ghost" aria-label={`Rename ${h.name}`} title="Rename" onClick={() => { setEditingId(h.id); setDate(h.date); setName(h.name); }}><Pencil className="h-4 w-4" /></Button>
                                                            <Button size="icon" variant="ghost" aria-label={`Remove ${h.name}`} title="Remove" className="hover:text-red-400" onClick={() => remove(h)}><Trash2 className="h-4 w-4" /></Button>
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <div className="space-y-5">
                    {canEdit ? (
                        <Card padding="lg">
                            <div ref={formRef} />
                            <h2 className="font-display text-[15px] font-semibold text-white">{editingId ? 'Rename holiday' : 'Add a holiday'}</h2>
                            <p className="mt-0.5 text-[13px] text-zinc-500">Nobody is asked for a report that day, and streaks carry on.</p>
                            <form onSubmit={submit} className="mt-4 space-y-3">
                                <Input type="date" label="Date" value={date} onChange={e => setDate(e.target.value)} required disabled={!!editingId} />
                                <Input ref={nameRef} label="Name" placeholder="Diwali" value={name} onChange={e => setName(e.target.value)} maxLength={80} required />
                                <div className="flex gap-2 pt-1">
                                    {editingId && <Button type="button" variant="secondary" className="flex-1" onClick={() => { setEditingId(null); setDate(''); setName(''); }}>Cancel</Button>}
                                    <Button type="submit" className="flex-1" isLoading={busy} disabled={!date || !name.trim()} leftIcon={editingId ? undefined : <Plus className="h-4 w-4" />}>{editingId ? 'Save name' : 'Add holiday'}</Button>
                                </div>
                            </form>
                            {missingNational.length > 0 && (
                                <div className="mt-5 border-t border-[#232327] pt-4">
                                    <p className="text-sm font-medium text-zinc-200">National holidays for {year}</p>
                                    <p className="mt-0.5 text-[13px] text-zinc-500">{missingNational.map(n => n.name).join(', ')}. Festival dates change each year, so add those yourself.</p>
                                    <Button variant="secondary" size="sm" className="mt-3" isLoading={busy} onClick={addNational}>Add {missingNational.length} national holiday{missingNational.length === 1 ? '' : 's'}</Button>
                                </div>
                            )}
                        </Card>
                    ) : (
                        <Card padding="lg">
                            <h2 className="font-display text-[15px] font-semibold text-white">How days off work</h2>
                            <p className="mt-2 text-sm text-zinc-400">On weekends and on these holidays no daily report is due, you won’t get reminders, and your streak won’t break. If you do work, you can still submit a report and it counts.</p>
                            <p className="mt-2 text-sm text-zinc-500">Only a director can add or change holidays.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
