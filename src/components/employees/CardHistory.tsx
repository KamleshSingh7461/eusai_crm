"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Ban, ExternalLink, Eye, EyeOff, Loader2, ScanLine } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { fieldClass } from '@/components/ui/Field';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import type { CardPayload } from '@/lib/idCards';
import CardViewer from '@/components/employees/CardViewer';

interface Card {
    id: string; cardNumber: string; status: 'ACTIVE' | 'REPLACED' | 'REVOKED'; companyCode: string;
    issuedAt: string; validUntil: string; revokedAt: string | null; revokedReason: string | null; checks: number; verifyPath: string;
}
interface Check { at: string; method: 'QR' | 'NUMBER'; result: string; cardNumber?: string }

const REASONS = ['Lost', 'Stolen', 'Damaged', 'Details changed', 'Other'];
const RESULT_LABEL: Record<string, { label: string; tone: 'emerald' | 'amber' | 'rose' | 'slate' }> = {
    VALID: { label: 'Shown as valid', tone: 'emerald' }, EXPIRED: { label: 'Shown as expired', tone: 'amber' },
    REPLACED: { label: 'Shown as replaced', tone: 'amber' }, REVOKED: { label: 'Shown as cancelled', tone: 'rose' },
    EXITED: { label: 'Shown as not employed', tone: 'rose' },
};
const day = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** ID cards issued to one person: status, how often each was checked, cancel a lost one. */
export default function CardHistory({ userId, onChanged }: { userId: string; onChanged?: () => void }) {
    const { showToast } = useToast();
    const [cards, setCards] = useState<Card[] | null>(null);
    const [checks, setChecks] = useState<Check[]>([]);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [reason, setReason] = useState('Lost');
    const [busy, setBusy] = useState(false);
    const [viewing, setViewing] = useState<string | null>(null);
    const [views, setViews] = useState<Record<string, CardPayload | 'error'>>({});

    const toggleView = async (id: string) => {
        if (viewing === id) return setViewing(null);
        setViewing(id);
        if (views[id]) return;
        const res = await fetch(`/api/id-cards/${id}`);
        const data = res.ok ? await res.json() : null;
        setViews(v => ({ ...v, [id]: data?.card || 'error' }));
    };

    const load = useCallback(async () => {
        const res = await fetch(`/api/id-cards?userId=${encodeURIComponent(userId)}`);
        const data = res.ok ? await res.json() : { cards: [], recentChecks: [] };
        setCards(data.cards);
        setChecks(data.recentChecks);
    }, [userId]);
    useEffect(() => { load(); }, [load]);

    const cancel = async (id: string) => {
        setBusy(true);
        const res = await fetch(`/api/id-cards/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) });
        const data = await res.json().catch(() => ({}));
        setBusy(false);
        if (!res.ok) return showToast(data.error || "Couldn't cancel the card", 'error');
        showToast('Card cancelled. It now shows as cancelled when checked.', 'success');
        setCancelling(null);
        load();
        onChanged?.();
    };

    if (!cards) return <p className="flex items-center gap-2 text-xs text-zinc-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading cards…</p>;
    if (cards.length === 0) return <p className="text-sm text-zinc-500">No card issued yet. Select them on the Employee IDs page and choose Print cards.</p>;

    return (
        <div className="space-y-3">
            <ul className="divide-y divide-[#232327] overflow-hidden rounded-xl border border-[#232327]">
                {cards.map(c => (
                    <li key={c.id} className={cn('p-3.5', c.status !== 'ACTIVE' && 'opacity-70')}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-mono text-sm font-semibold tracking-wide text-white">{c.cardNumber}</p>
                                <p className="mt-0.5 text-xs text-zinc-500">
                                    {c.companyCode} · issued {day(c.issuedAt)} · valid till {day(c.validUntil)}
                                </p>
                                {c.status !== 'ACTIVE' && c.revokedReason && (
                                    <p className="mt-0.5 text-xs text-zinc-500">{c.status === 'REPLACED' ? 'Replaced' : 'Cancelled'} {c.revokedAt ? day(c.revokedAt) : ''}: {c.revokedReason.toLowerCase()}</p>
                                )}
                            </div>
                            <Badge tone={c.status === 'ACTIVE' ? 'emerald' : c.status === 'REPLACED' ? 'amber' : 'rose'} dot>
                                {c.status === 'ACTIVE' ? 'In use' : c.status === 'REPLACED' ? 'Replaced' : 'Cancelled'}
                            </Badge>
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                            <span className="inline-flex items-center gap-1 text-zinc-400"><ScanLine className="h-3.5 w-3.5" />Checked {c.checks} {c.checks === 1 ? 'time' : 'times'}</span>
                            <button type="button" onClick={() => toggleView(c.id)} aria-expanded={viewing === c.id} className="inline-flex items-center gap-1 text-zinc-200 hover:text-white">
                                {viewing === c.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{viewing === c.id ? 'Hide card' : 'View card'}
                            </button>
                            <a href={c.verifyPath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200">
                                <ExternalLink className="h-3.5 w-3.5" />See what a scan shows
                            </a>
                            {c.status === 'ACTIVE' && cancelling !== c.id && (
                                <button type="button" onClick={() => { setCancelling(c.id); setReason('Lost'); }} className="inline-flex items-center gap-1 text-rose-300 hover:text-rose-200">
                                    <Ban className="h-3.5 w-3.5" />Cancel card
                                </button>
                            )}
                        </div>
                        {viewing === c.id && (
                            <div className="mt-3 rounded-xl bg-[#18181B] p-4">
                                {views[c.id] === 'error' ? <p className="text-sm text-rose-300">Couldn't load this card.</p>
                                    : views[c.id] ? <CardViewer card={views[c.id] as CardPayload} />
                                        : <p className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>}
                            </div>
                        )}
                        {cancelling === c.id && (
                            <div className="mt-3 space-y-2 rounded-lg border border-rose-500/25 bg-rose-500/[0.06] p-3">
                                <p className="text-xs text-rose-200">Anyone checking this card will be told it's cancelled. Issue a new card to replace it.</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <select aria-label="Reason" className={cn(fieldClass, 'h-9 w-auto')} value={reason} onChange={e => setReason(e.target.value)}>
                                        {REASONS.map(r => <option key={r}>{r}</option>)}
                                    </select>
                                    <Button type="button" size="sm" variant="danger" isLoading={busy} onClick={() => cancel(c.id)}>Cancel card</Button>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => setCancelling(null)}>Keep it</Button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {checks.length > 0 && (
                <div>
                    <p className="mb-1.5 text-xs font-medium text-zinc-400">Latest checks</p>
                    <ul className="space-y-1 text-xs">
                        {checks.slice(0, 6).map((k, i) => {
                            const r = RESULT_LABEL[k.result] || { label: k.result, tone: 'slate' as const };
                            return (
                                <li key={i} className="flex flex-wrap items-center gap-x-2 text-zinc-400">
                                    <span className="w-28 shrink-0 text-zinc-500">{when(k.at)}</span>
                                    <span>{k.method === 'QR' ? 'QR scan' : 'Number typed in'}</span>
                                    <span className="font-mono text-zinc-500">{k.cardNumber}</span>
                                    <Badge tone={r.tone}>{r.label}</Badge>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
