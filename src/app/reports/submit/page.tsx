"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { CalendarOff, Check, CheckCircle2, Clock, Flame, Lightbulb, ListChecks, Loader2, Minus, Plus, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { isReportWindowOpen } from '@/lib/reportWindow';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { FieldLabel, fieldClass } from '@/components/ui/Field';

// Utilisation is the same 0-100 slider (steps of 5, default 80) as before; these labels only describe the value.
const describeUtilization = (v: number) =>
    v >= 90 ? 'Deep work · fully on your priorities'
        : v >= 70 ? 'Focused · good, uninterrupted work'
            : v >= 50 ? 'Steady · a normal day'
                : v >= 30 ? 'Scattered · lots of interruptions'
                    : 'Blocked · mostly waiting on others';
const HOUR_PRESETS = [4, 6, 8, 9];
const MIN_SUMMARY = 20;

interface Draft { tasksCompleted: number; hoursWorked: string; utilization: number; accomplishments: string; challenges: string; tomorrowPlan: string }
const EMPTY: Draft = { tasksCompleted: 0, hoursWorked: '', utilization: 80, accomplishments: '', challenges: '', tomorrowPlan: '' };

/** Minutes until a given IST hour today (negative if it has passed). */
function minutesUntilIst(hour: number, now = new Date()) {
    const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const target = new Date(ist); target.setHours(hour, 0, 0, 0);
    return Math.round((target.getTime() - ist.getTime()) / 60000);
}
const duration = (mins: number) => (mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`);

export default function SubmitReportPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const { showToast } = useToast();
    const user = session?.user as any;
    const role = (user?.role || '').toUpperCase();
    const canForce = ['DIRECTOR', 'MANAGER'].includes(role);
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const draftKey = user?.id ? `eusai-report-draft-${user.id}-${todayKey}` : null;

    const [form, setForm] = useState<Draft>(EMPTY);
    const [existing, setExisting] = useState<{ submittedAt: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [touched, setTouched] = useState(false);
    const [savedAt, setSavedAt] = useState<Date | null>(null);
    const [force, setForce] = useState(false);
    const [, setTick] = useState(0);

    const [doneToday, setDoneToday] = useState<number | null>(null);
    const [dayOff, setDayOff] = useState<string | null>(null);
    const [weekDays, setWeekDays] = useState<Set<string>>(new Set());
    const [weekHolidays, setWeekHolidays] = useState<Map<string, string>>(new Map());
    const [streak, setStreak] = useState<number | null>(null);
    const loadedDraft = useRef(false);

    const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setForm(f => ({ ...f, [k]: v }));

    // window status refreshes every 30 seconds
    useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 30_000); return () => clearInterval(t); }, []);
    const windowOpen = isReportWindowOpen();
    const opensIn = minutesUntilIst(17);
    const closesIn = minutesUntilIst(24);

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const load = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        const weekFrom = format(weekStart, 'yyyy-MM-dd');
        const weekTo = format(addDays(weekStart, 6), 'yyyy-MM-dd');
        const [mine, hol, tasks, dash] = await Promise.all([
            fetch(`/api/reports/daily?type=my&startDate=${weekFrom}&endDate=${weekTo}T23:59:59`).then(r => (r.ok ? r.json() : null)).catch(() => null),
            fetch(`/api/holidays?from=${weekFrom}&to=${weekTo}`).then(r => (r.ok ? r.json() : null)).catch(() => null),
            fetch('/api/tasks').then(r => (r.ok ? r.json() : null)).catch(() => null),
            fetch('/api/dashboard/employee').then(r => (r.ok ? r.json() : null)).catch(() => null),
        ]);

        const reports: any[] = mine?.reports || [];
        setWeekDays(new Set(reports.map(r => format(new Date(r.date), 'yyyy-MM-dd'))));
        setWeekHolidays(new Map((hol?.holidays || []).map((h: any) => [h.date, h.name])));
        setDayOff(hol?.today && !hol.today.isWorkingDay ? hol.today.reason : null);
        setStreak(dash?.kpi?.streak ?? null);

        const myTasks: any[] = (tasks?.tasks || []).filter((t: any) => t.userId === user.id || t.assignedTo?.id === user.id);
        setDoneToday(myTasks.filter(t => t.status === 'DONE' && t.updatedAt && isSameDay(new Date(t.updatedAt), new Date())).length);

        // today's report wins over a draft; otherwise restore the draft
        const today = reports.find(r => format(new Date(r.date), 'yyyy-MM-dd') === todayKey);
        if (today) {
            setExisting({ submittedAt: today.submittedAt });
            setForm({
                tasksCompleted: today.tasksCompleted ?? 0, hoursWorked: today.hoursWorked ? String(today.hoursWorked) : '',
                utilization: today.utilization ?? 80, accomplishments: today.accomplishments || '', challenges: today.challenges || '',
                tomorrowPlan: today.tomorrowPlan || '',
            });
        } else if (draftKey) {
            try { const d = localStorage.getItem(draftKey); if (d) { setForm({ ...EMPTY, ...JSON.parse(d) }); setSavedAt(new Date()); } } catch { }
        }
        loadedDraft.current = true;
        setLoading(false);
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { load(); }, [load]);

    // autosave a draft (only while it isn't a submitted report being edited)
    useEffect(() => {
        if (!loadedDraft.current || !draftKey || existing || !touched) return;
        const t = setTimeout(() => {
            try { localStorage.setItem(draftKey, JSON.stringify(form)); setSavedAt(new Date()); } catch { }
        }, 600);
        return () => clearTimeout(t);
    }, [form, draftKey, existing, touched]);

    const hours = parseFloat(form.hoursWorked);
    const errors = {
        accomplishments: form.accomplishments.trim().length < MIN_SUMMARY ? `Write at least ${MIN_SUMMARY} characters so your lead knows what moved.` : '',
        hoursWorked: form.hoursWorked === '' ? 'Enter the hours you worked.' : !(hours >= 0 && hours <= 24) ? 'Hours must be between 0 and 24.' : '',
    };
    const valid = !errors.accomplishments && !errors.hoursWorked;
    const canSubmit = valid && (windowOpen || force) && !submitting;

    const blockReason = !windowOpen && !force
        ? `Submissions open at 5:00 PM IST${opensIn > 0 ? ` (in ${duration(opensIn)})` : ''}.${existing ? ' You can send changes then.' : ' Your draft is saved.'}`
        : !valid ? 'Complete the required fields to submit.' : '';

    const submit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setTouched(true);
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/reports/daily', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tasksCompleted: form.tasksCompleted, hoursWorked: hours, utilization: form.utilization,
                    accomplishments: form.accomplishments, challenges: form.challenges, tomorrowPlan: form.tomorrowPlan,
                    forceSubmission: force || undefined,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || data.error || 'Could not submit your report');
            try { if (draftKey) localStorage.removeItem(draftKey); } catch { }
            showToast(existing ? 'Report updated' : 'Report submitted', 'success');
            router.push('/reports');
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const textArea = (key: 'accomplishments' | 'challenges' | 'tomorrowPlan', rows: number, placeholder: string) => (
        <textarea
            id={key}
            rows={rows}
            value={form[key]}
            onChange={e => { setTouched(true); set(key, e.target.value); }}
            placeholder={placeholder}
            className={cn(fieldClass, 'h-auto resize-y py-2.5 leading-relaxed', touched && key === 'accomplishments' && errors.accomplishments && 'border-rose-500/60')}
        />
    );

    if (loading) {
        return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>;
    }

    return (
        <form onSubmit={submit} className="space-y-6">
            <PageHeader
                eyebrow="Reports"
                title={existing ? 'Update today’s report' : 'Daily report'}
                description={format(new Date(), 'EEEE, d MMMM yyyy')}
                actions={existing
                    ? <Badge tone="emerald" icon={<CheckCircle2 />}>Submitted at {format(new Date(existing.submittedAt), 'h:mm a')}</Badge>
                    : <Badge tone={windowOpen ? 'blue' : 'slate'} icon={<Clock />}>{windowOpen ? 'Not submitted yet' : 'Window opens 5:00 PM IST'}</Badge>}
            />

            {/* window / day-off status */}
            <div className={cn('flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3',
                dayOff ? 'border-[#2F2F35] bg-[#111113]' : windowOpen ? 'border-emerald-500/25 bg-emerald-500/[0.06]' : 'border-[#2F2F35] bg-[#111113]')}>
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                    dayOff ? 'bg-zinc-800 text-zinc-300 ring-zinc-700/70' : windowOpen ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' : 'bg-zinc-800 text-zinc-300 ring-zinc-700/70')}>
                    {dayOff ? <CalendarOff className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1 text-sm">
                    {dayOff ? (
                        <><p className="font-medium text-white">No report due today · {dayOff}</p><p className="text-zinc-400">Your streak is safe. If you worked, you can still file one during the window.</p></>
                    ) : windowOpen ? (
                        <><p className="font-medium text-white">Submission window is open</p><p className="text-zinc-400">Closes at 11:59 PM IST, in {duration(Math.max(closesIn, 0))}.</p></>
                    ) : (
                        <><p className="font-medium text-white">Opens at 5:00 PM IST{opensIn > 0 ? ` · in ${duration(opensIn)}` : ''}</p><p className="text-zinc-400">Start writing now. Your draft saves automatically on this device.</p></>
                    )}
                </div>
                {!windowOpen && canForce && (
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                        <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} className="h-4 w-4 rounded border-[#3A3A41] bg-[#18181B] accent-blue-600" />
                        Submit outside the window
                    </label>
                )}
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
                <div className="space-y-5 lg:col-span-2">
                    {/* at a glance */}
                    <Card padding="lg">
                        <h2 className="font-display text-[15px] font-semibold text-white">Today at a glance</h2>
                        <div className="mt-4 grid gap-5 sm:grid-cols-2">
                            <div>
                                <FieldLabel htmlFor="tasks">Tasks completed</FieldLabel>
                                <div className="flex items-center gap-2">
                                    <Button type="button" size="icon" variant="secondary" aria-label="One less task" onClick={() => { setTouched(true); set('tasksCompleted', Math.max(0, form.tasksCompleted - 1)); }}><Minus className="h-4 w-4" /></Button>
                                    <input id="tasks" type="number" min={0} max={200} inputMode="numeric" value={form.tasksCompleted}
                                        onChange={e => { setTouched(true); set('tasksCompleted', Math.max(0, Math.min(200, parseInt(e.target.value) || 0))); }}
                                        className={cn(fieldClass, 'w-20 text-center text-base font-semibold tabular-nums')} />
                                    <Button type="button" size="icon" variant="secondary" aria-label="One more task" onClick={() => { setTouched(true); set('tasksCompleted', Math.min(200, form.tasksCompleted + 1)); }}><Plus className="h-4 w-4" /></Button>
                                </div>
                                {doneToday !== null && doneToday > 0 && doneToday !== form.tasksCompleted && (
                                    <button type="button" onClick={() => { setTouched(true); set('tasksCompleted', doneToday); }}
                                        className="mt-2 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                                        <Sparkles className="h-3.5 w-3.5" />You marked {doneToday} task{doneToday === 1 ? '' : 's'} done today · use {doneToday}
                                    </button>
                                )}
                            </div>

                            <div>
                                <FieldLabel htmlFor="hours" required>Hours worked</FieldLabel>
                                <div className="flex flex-wrap items-center gap-2">
                                    <input id="hours" type="number" min={0} max={24} step={0.5} inputMode="decimal" placeholder="0" value={form.hoursWorked}
                                        onChange={e => { setTouched(true); set('hoursWorked', e.target.value); }}
                                        className={cn(fieldClass, 'w-20 text-center text-base font-semibold tabular-nums', touched && errors.hoursWorked && 'border-rose-500/60')} />
                                    {HOUR_PRESETS.map(h => (
                                        <button key={h} type="button" onClick={() => { setTouched(true); set('hoursWorked', String(h)); }}
                                            className={cn('h-9 rounded-lg border px-3 text-sm font-medium tabular-nums transition-colors',
                                                hours === h ? 'border-blue-500/50 bg-blue-500/15 text-blue-300' : 'border-[#2F2F35] bg-[#18181B] text-zinc-300 hover:bg-[#1F1F23]')}>
                                            {h}h
                                        </button>
                                    ))}
                                </div>
                                {touched && errors.hoursWorked && <p className="mt-1.5 text-xs text-rose-400">{errors.hoursWorked}</p>}
                            </div>
                        </div>

                        <div className="mt-5">
                            <div className="flex items-baseline justify-between gap-3">
                                <FieldLabel htmlFor="utilization">Capacity utilisation</FieldLabel>
                                <span className="text-lg font-semibold tabular-nums text-white">{form.utilization}%</span>
                            </div>
                            <input
                                id="utilization"
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={form.utilization}
                                onChange={e => { setTouched(true); set('utilization', parseInt(e.target.value, 10)); }}
                                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-blue-600 focus:outline-none"
                                style={{ background: `linear-gradient(to right, #2563EB ${form.utilization}%, #27272A ${form.utilization}%)` }}
                                aria-valuetext={`${form.utilization}%, ${describeUtilization(form.utilization)}`}
                            />
                            <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-zinc-600"><span>0%</span><span>50%</span><span>100%</span></div>
                            <p className="mt-1 text-xs text-zinc-500">{describeUtilization(form.utilization)}</p>
                        </div>
                    </Card>

                    {/* written parts */}
                    <Card padding="lg" className="space-y-5">
                        <div>
                            <div className="flex items-baseline justify-between gap-3">
                                <FieldLabel htmlFor="accomplishments" required>What did you get done?</FieldLabel>
                                <span className={cn('text-xs tabular-nums', form.accomplishments.trim().length >= MIN_SUMMARY ? 'text-zinc-500' : 'text-zinc-600')}>
                                    {form.accomplishments.trim().length < MIN_SUMMARY ? `${MIN_SUMMARY - form.accomplishments.trim().length} more characters` : `${form.accomplishments.length} characters`}
                                </span>
                            </div>
                            {textArea('accomplishments', 6, 'One line per item, for example:\n• Sent the MOU draft to Delhi University\n• Closed 2 logo approval tasks\n• Called 3 vendors about jersey pricing')}
                            {touched && errors.accomplishments && <p className="mt-1.5 text-xs text-rose-400">{errors.accomplishments}</p>}
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <FieldLabel htmlFor="challenges">Blockers or challenges</FieldLabel>
                                {textArea('challenges', 4, 'Anything slowing you down? Who can help?')}
                            </div>
                            <div>
                                <FieldLabel htmlFor="tomorrowPlan">Plan for tomorrow</FieldLabel>
                                {textArea('tomorrowPlan', 4, 'Your top 2 or 3 priorities')}
                            </div>
                        </div>

                    </Card>

                    {/* action bar: sticks to the bottom while scrolling */}
                    <div className="sticky bottom-[calc(var(--tabbar-h)+0.75rem)] z-20 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[#2F2F35] bg-[#18181B] px-4 py-3 shadow-2xl shadow-black/50 md:bottom-4">
                        <p className="w-full text-xs text-zinc-400 sm:w-auto sm:min-w-0 sm:flex-1 sm:text-[13px]">
                            {blockReason
                                || (existing ? 'Saving replaces the report you sent earlier today.' : savedAt ? `Draft saved at ${format(savedAt, 'h:mm a')}` : 'Ready to send.')}
                        </p>
                        <div className="ml-auto flex items-center gap-2">
                        <Link href="/reports" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-[#1F1F23] hover:text-zinc-100">Cancel</Link>
                        <Button type="submit" isLoading={submitting} disabled={!canSubmit} leftIcon={<Send className="h-4 w-4" />}>
                            {existing ? 'Update report' : 'Submit report'}
                        </Button>
                        </div>
                    </div>
                </div>

                {/* side panel */}
                <div className="space-y-5">
                    <Card padding="lg">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display text-[15px] font-semibold text-white">This week</h2>
                            {streak !== null && <span className="flex items-center gap-1 text-sm font-semibold text-amber-400"><Flame className="h-4 w-4" />{streak}-day streak</span>}
                        </div>
                        <div className="mt-4 grid grid-cols-7 gap-1.5">
                            {week.map(d => {
                                const k = format(d, 'yyyy-MM-dd');
                                const filed = weekDays.has(k);
                                const holiday = weekHolidays.get(k);
                                const off = !!holiday || d.getDay() === 0 || d.getDay() === 6;
                                const past = k < todayKey;
                                const isToday = k === todayKey;
                                return (
                                    <div key={k} className="flex flex-col items-center gap-1.5" title={holiday || (off ? 'Weekend' : filed ? 'Report filed' : past ? 'No report' : '')}>
                                        <span className={cn('text-[11px] font-medium', isToday ? 'text-white' : 'text-zinc-500')}>{format(d, 'EEEEE')}</span>
                                        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium',
                                            filed ? 'bg-blue-600 text-white' : off ? 'bg-[#18181B] text-zinc-600' : past ? 'bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/25' : 'bg-[#18181B] text-zinc-400',
                                            isToday && !filed && 'ring-2 ring-inset ring-blue-500')}>
                                            {filed ? <Check className="h-4 w-4" /> : off ? '–' : format(d, 'd')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-3 text-xs text-zinc-500">Weekends and holidays never break your streak.</p>
                    </Card>

                    <Card padding="lg">
                        <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-white"><Lightbulb className="h-4 w-4 text-amber-400" />What makes a good report</h2>
                        <ul className="mt-3 space-y-2.5 text-sm text-zinc-400">
                            {[
                                'Name the outcome, not the activity: “MOU signed”, not “worked on MOU”.',
                                'Mention the university, project or person involved.',
                                'Flag blockers early so your lead can unblock you tomorrow.',
                                'Keep tomorrow’s plan to the two or three things that matter.',
                            ].map(t => (
                                <li key={t} className="flex gap-2"><ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />{t}</li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </form>
    );
}
