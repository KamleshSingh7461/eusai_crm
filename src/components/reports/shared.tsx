"use client";

import React, { useEffect, useRef, useState } from 'react';
import { endOfMonth, format, startOfMonth, startOfWeek, subDays, subMonths } from 'date-fns';
import { CalendarRange, ChevronDown, Download, FileSpreadsheet, FileText, Loader2, Sheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { ExportDoc, exportCsv, exportPdf, exportXlsx } from '@/lib/reportExport';

/* --------------------------------------------------------------- dates */

export interface DateRange { from: string; to: string }
const d = (x: Date) => format(x, 'yyyy-MM-dd');

export const PRESETS: { id: string; label: string; range: () => DateRange }[] = [
    { id: 'today', label: 'Today', range: () => ({ from: d(new Date()), to: d(new Date()) }) },
    { id: 'yesterday', label: 'Yesterday', range: () => ({ from: d(subDays(new Date(), 1)), to: d(subDays(new Date(), 1)) }) },
    { id: 'week', label: 'This week', range: () => ({ from: d(startOfWeek(new Date(), { weekStartsOn: 1 })), to: d(new Date()) }) },
    { id: '7d', label: 'Last 7 days', range: () => ({ from: d(subDays(new Date(), 6)), to: d(new Date()) }) },
    { id: 'month', label: 'This month', range: () => ({ from: d(startOfMonth(new Date())), to: d(new Date()) }) },
    { id: 'lastMonth', label: 'Last month', range: () => { const m = subMonths(new Date(), 1); return { from: d(startOfMonth(m)), to: d(endOfMonth(m)) }; } },
    { id: '30d', label: 'Last 30 days', range: () => ({ from: d(subDays(new Date(), 29)), to: d(new Date()) }) },
];

export const rangeLabel = (r: DateRange) => {
    const f = new Date(`${r.from}T00:00:00`), t = new Date(`${r.to}T00:00:00`);
    return r.from === r.to ? format(f, 'EEE d MMM yyyy') : `${format(f, 'd MMM yyyy')} to ${format(t, 'd MMM yyyy')}`;
};

/** Preset chips plus custom from/to dates. */
export function DateRangeBar({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
    const active = PRESETS.find(p => { const r = p.range(); return r.from === value.from && r.to === value.to; })?.id;
    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-[#232327] bg-[#111113] p-1 [scrollbar-width:none]">
                {PRESETS.map(p => (
                    <button key={p.id} type="button" onClick={() => onChange(p.range())}
                        className={cn('whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                            active === p.id ? 'bg-[#27272A] text-white' : 'text-zinc-400 hover:text-zinc-200')}>
                        {p.label}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[#232327] bg-[#111113] px-2 py-1">
                <CalendarRange className="h-3.5 w-3.5 text-zinc-500" />
                <input type="date" aria-label="From" value={value.from} max={value.to}
                    onChange={e => e.target.value && onChange({ ...value, from: e.target.value })}
                    className="bg-transparent text-xs text-zinc-200 [color-scheme:dark] focus:outline-none" />
                <span className="text-xs text-zinc-600">to</span>
                <input type="date" aria-label="To" value={value.to} min={value.from}
                    onChange={e => e.target.value && onChange({ ...value, to: e.target.value })}
                    className="bg-transparent text-xs text-zinc-200 [color-scheme:dark] focus:outline-none" />
            </div>
        </div>
    );
}

/* -------------------------------------------------------------- export */

/** "Export" dropdown: Excel, CSV, PDF. `build` returns the document for whatever is on screen now. */
export function ExportMenu({ build, disabled }: { build: () => ExportDoc | null; disabled?: boolean }) {
    const { showToast } = useToast();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    const run = async (kind: 'xlsx' | 'csv' | 'pdf') => {
        const doc = build();
        if (!doc || doc.tables.every(t => t.rows.length === 0)) { showToast('Nothing to export for these filters', 'info'); return; }
        setBusy(kind);
        try {
            if (kind === 'xlsx') await exportXlsx(doc);
            else if (kind === 'csv') exportCsv(doc);
            else await exportPdf(doc);
            showToast(`${kind === 'xlsx' ? 'Excel file' : kind.toUpperCase()} downloaded`, 'success');
            setOpen(false);
        } catch (err) {
            console.error('Export failed', err);
            showToast('Export failed. Try again.', 'error');
        } finally {
            setBusy(null);
        }
    };

    const items = [
        { kind: 'xlsx' as const, label: 'Excel workbook', hint: 'Formatted sheets with a summary', icon: FileSpreadsheet, tone: 'text-emerald-400' },
        { kind: 'pdf' as const, label: 'PDF report', hint: 'Print-ready, landscape A4', icon: FileText, tone: 'text-rose-400' },
        { kind: 'csv' as const, label: 'CSV data', hint: 'Plain data for other tools', icon: Sheet, tone: 'text-zinc-400' },
    ];

    return (
        <div className="relative" ref={ref}>
            <button type="button" disabled={disabled} onClick={() => setOpen(o => !o)}
                className="flex h-9 items-center gap-2 rounded-lg border border-[#2F2F35] bg-[#18181B] px-3.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-[#1F1F23] disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Export<ChevronDown className="h-4 w-4 text-zinc-500" />
            </button>
            {open && (
                <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-[#2F2F35] bg-[#18181B] p-1 shadow-2xl shadow-black/60">
                    {items.map(it => (
                        <button key={it.kind} type="button" disabled={!!busy} onClick={() => run(it.kind)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[#1F1F23] disabled:opacity-50">
                            {busy === it.kind ? <Loader2 className="h-4 w-4 animate-spin text-zinc-400" /> : <it.icon className={cn('h-4 w-4', it.tone)} />}
                            <span>
                                <span className="block text-sm font-medium text-zinc-100">{it.label}</span>
                                <span className="block text-xs text-zinc-500">{it.hint}</span>
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------- helpers */

export const REPORTING_ROLES = ['EMPLOYEE', 'INTERN', 'TEAM_LEADER', 'MANAGER'];
export const LEADER_ROLES = ['DIRECTOR', 'MANAGEMENT', 'MANAGER', 'TEAM_LEADER'];
export const SENIOR_ROLES = ['DIRECTOR', 'MANAGEMENT', 'MANAGER'];

export const roleName = (r?: string | null) => (r || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());

export function utilTone(v?: number | null) {
    const n = v ?? 0;
    return n >= 75 ? 'text-emerald-400' : n >= 50 ? 'text-amber-400' : 'text-rose-400';
}

export function SortHeader({ label, active, dir, onClick, align = 'left' }: { label: string; active: boolean; dir: 'asc' | 'desc'; onClick: () => void; align?: 'left' | 'right' | 'center' }) {
    return (
        <button type="button" onClick={onClick}
            className={cn('inline-flex items-center gap-1 font-medium transition-colors hover:text-zinc-200', active ? 'text-zinc-200' : 'text-zinc-500',
                align === 'right' && 'flex-row-reverse')}>
            {label}
            <ChevronDown className={cn('h-3 w-3 transition-transform', !active && 'opacity-0', active && dir === 'asc' && 'rotate-180')} />
        </button>
    );
}
