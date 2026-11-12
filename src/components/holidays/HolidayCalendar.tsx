"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns';
import { CalendarOff, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

export interface CalendarHoliday { id: string; date: string; name: string }

interface Props {
    /** the year whose holidays are loaded; navigating past it asks the page to load the next/previous year */
    year: number;
    onYearChange: (year: number) => void;
    holidays: CalendarHoliday[];
    /** days ("yyyy-MM-dd") the signed-in person filed a report; null when they don't file reports */
    reportDays: Set<string> | null;
    canEdit: boolean;
    onAdd: (date: string) => void;
    onRemove: (holiday: CalendarHoliday) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const key = (d: Date) => format(d, 'yyyy-MM-dd');

type DayKind = 'holiday' | 'weekend' | 'work';

/** Month grid: weekends and holidays are days off; for staff, past working days show whether a report was filed. */
export default function HolidayCalendar({ year, onYearChange, holidays, reportDays, canEdit, onAdd, onRemove }: Props) {
    const [month, setMonth] = useState(() => {
        const now = new Date();
        return now.getFullYear() === year ? startOfMonth(now) : new Date(year, 0, 1);
    });
    const [selected, setSelected] = useState<string>(() => key(new Date()));

    // keep the shown month inside the loaded year when the year is changed from outside
    useEffect(() => {
        if (month.getFullYear() !== year) setMonth(new Date(year, month.getFullYear() < year ? 0 : 11, 1));
    }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

    const byDay = useMemo(() => new Map(holidays.map(h => [h.date, h])), [holidays]);
    const todayKey = key(new Date());

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
        const list: Date[] = [];
        for (let d = start; d <= end; d = addDays(d, 1)) list.push(d);
        return list;
    }, [month]);

    const kindOf = (d: Date): DayKind => (byDay.has(key(d)) ? 'holiday' : d.getDay() === 0 || d.getDay() === 6 ? 'weekend' : 'work');
    // "missed" only counts from the first report this person ever filed, so days before they joined aren't red
    const firstFiled = useMemo(() => (reportDays && reportDays.size ? [...reportDays].sort()[0] : null), [reportDays]);
    const reportOf = (d: Date) => {
        if (!reportDays) return null;
        const k = key(d);
        if (reportDays.has(k)) return 'filed';
        if (!firstFiled || k < firstFiled || k >= todayKey || kindOf(d) !== 'work') return null;
        return 'missed';
    };

    const go = (delta: number) => {
        const next = addMonths(month, delta);
        setMonth(next);
        if (next.getFullYear() !== year) onYearChange(next.getFullYear());
    };

    // month summary
    const inMonth = days.filter(d => isSameMonth(d, month));
    const workingDays = inMonth.filter(d => kindOf(d) === 'work').length;
    const holidaysInMonth = inMonth.filter(d => kindOf(d) === 'holiday');
    const filed = reportDays ? inMonth.filter(d => reportOf(d) === 'filed').length : 0;
    const missed = reportDays ? inMonth.filter(d => reportOf(d) === 'missed').length : 0;

    const sel = new Date(`${selected}T00:00:00`);
    const selHoliday = byDay.get(selected);
    const selKind = kindOf(sel);
    const selReport = reportOf(sel);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" aria-label="Previous month" onClick={() => go(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <p className="w-36 text-center text-sm font-semibold text-white">{format(month, 'MMMM yyyy')}</p>
                    <Button size="icon" variant="ghost" aria-label="Next month" onClick={() => go(1)}><ChevronRight className="h-4 w-4" /></Button>
                    {!isSameMonth(month, new Date()) && (
                        <Button size="sm" variant="secondary" className="ml-1" onClick={() => { setMonth(startOfMonth(new Date())); setSelected(todayKey); if (new Date().getFullYear() !== year) onYearChange(new Date().getFullYear()); }}>Today</Button>
                    )}
                </div>
                <p className="text-xs text-zinc-500">
                    {workingDays} working day{workingDays === 1 ? '' : 's'}
                    {holidaysInMonth.length > 0 && ` · ${holidaysInMonth.length} holiday${holidaysInMonth.length === 1 ? '' : 's'}`}
                    {reportDays && ` · ${filed} report${filed === 1 ? '' : 's'} filed${missed ? ` · ${missed} missed` : ''}`}
                </p>
            </div>

            <div className="grid grid-cols-7 border-y border-[#232327] bg-[#0E0E10] text-center text-[11px] font-medium text-zinc-500">
                {WEEKDAYS.map(w => <div key={w} className={cn('py-2', (w === 'Sat' || w === 'Sun') && 'text-zinc-600')}>{w}</div>)}
            </div>

            <div className="grid grid-cols-7">
                {days.map((d, i) => {
                    const k = key(d);
                    const outside = !isSameMonth(d, month);
                    const kind = kindOf(d);
                    const holiday = byDay.get(k);
                    const report = reportOf(d);
                    const isSel = k === selected;
                    return (
                        <button
                            key={k}
                            onClick={() => setSelected(k)}
                            aria-label={`${format(d, 'EEEE d MMMM')}${holiday ? `, ${holiday.name}` : kind === 'weekend' ? ', weekend' : ''}${report === 'filed' ? ', report filed' : report === 'missed' ? ', report missed' : ''}`}
                            aria-pressed={isSel}
                            className={cn(
                                'relative flex min-h-[56px] flex-col items-start gap-1 border-b border-r border-[#1C1C1F] p-1.5 text-left transition-colors sm:min-h-[84px] sm:p-2',
                                (i + 1) % 7 === 0 && 'border-r-0',
                                kind === 'weekend' && 'bg-[#0C0C0E]',
                                kind === 'holiday' && 'bg-emerald-500/[0.06]',
                                outside && 'opacity-35',
                                isSel ? 'ring-2 ring-inset ring-blue-500' : 'hover:bg-[#18181B]'
                            )}
                        >
                            <span className={cn('flex h-6 min-w-6 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums',
                                isToday(d) ? 'bg-blue-600 text-white' : kind === 'work' ? 'text-zinc-200' : 'text-zinc-500')}>
                                {format(d, 'd')}
                            </span>
                            {holiday && (
                                <span className="hidden w-full truncate rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-medium text-emerald-300 sm:block">{holiday.name}</span>
                            )}
                            <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                                {holiday && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 sm:hidden" />}
                                {report === 'filed' && <span title="Report filed" className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
                                {report === 'missed' && <span title="Report missed" className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* selected day */}
            <div className="flex flex-wrap items-center gap-3 border-t border-[#232327] px-5 py-4">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{format(sel, 'EEEE, d MMMM yyyy')}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-zinc-400">
                        {selKind === 'holiday' && <><CalendarOff className="h-3.5 w-3.5 text-emerald-400" />Holiday · {selHoliday?.name} · no report due</>}
                        {selKind === 'weekend' && <><CalendarOff className="h-3.5 w-3.5 text-zinc-500" />Weekend · no report due</>}
                        {selKind === 'work' && 'Working day · daily report due 5:00 PM to 11:59 PM IST'}
                    </p>
                    {selReport === 'filed' && <p className="mt-1 flex items-center gap-1.5 text-[13px] text-blue-300"><CheckCircle2 className="h-3.5 w-3.5" />You filed a report this day</p>}
                    {selReport === 'missed' && <p className="mt-1 flex items-center gap-1.5 text-[13px] text-rose-300"><CircleAlert className="h-3.5 w-3.5" />No report filed this day</p>}
                </div>
                {canEdit && (selHoliday
                    ? <Button size="sm" variant="secondary" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => onRemove(selHoliday)}>Remove holiday</Button>
                    : <Button size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => onAdd(selected)}>Mark as holiday</Button>)}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[#232327] px-5 py-3 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-emerald-500/30" />Holiday</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-[#232327] bg-[#0C0C0E]" />Weekend</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-blue-600" />Today</span>
                {reportDays && <>
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />Report filed</span>
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" />Report missed</span>
                </>}
            </div>
        </div>
    );
}
