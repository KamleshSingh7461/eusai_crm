"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, CircleAlert, Download, IdCard, Printer, RotateCcw } from 'lucide-react';
import Modal, { ModalIcon } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import type { CardPayload } from '@/lib/idCards';
import { buildCardsPdf, type CardImages, loadCardImages, paintFace, type PrintLayout } from '@/lib/cardRender';
import { download } from '@/lib/reportExport';
import type { EmployeeRow } from '@/components/employees/EmploymentModal';

type Mode = 'issue' | 'reprint';
interface Ready { data: CardPayload; images: CardImages }

const LAYOUTS: { val: PrintLayout; label: string; note: string }[] = [
    { val: 'card', label: 'Card printer', note: 'One card-sized page per side (front, back), for PVC card printers.' },
    { val: 'a4', label: 'A4 sheets', note: 'Nine cards per sheet with cut marks. Print double-sided, flip on the long edge.' },
];

const fileName = (cards: CardPayload[]) =>
    cards.length === 1 ? `ID card ${cards[0].employeeCode}.pdf` : `ID cards ${new Date().toISOString().slice(0, 10)} (${cards.length}).pdf`;

/** Issue (or reprint) ID cards for the chosen people, preview them and download the print file. */
export default function PrintCardsModal({ people, onClose, onIssued }: { people: EmployeeRow[] | null; onClose: () => void; onIssued: () => void }) {
    const { showToast } = useToast();
    const [mode, setMode] = useState<Mode>('issue');
    const [layout, setLayout] = useState<PrintLayout>('card');
    const [step, setStep] = useState<'setup' | 'working' | 'ready'>('setup');
    const [error, setError] = useState('');
    const [cards, setCards] = useState<Ready[]>([]);
    const [index, setIndex] = useState(0);

    const ready = useMemo(() => (people || []).filter(p => p.cardBlockers.length === 0), [people]);
    const blocked = useMemo(() => (people || []).filter(p => p.cardBlockers.length > 0), [people]);
    const withCard = ready.filter(p => p.card);
    const canReprint = ready.length > 0 && withCard.length === ready.length;

    useEffect(() => {
        if (!people) return;
        setStep('setup');
        setError('');
        setCards([]);
        setIndex(0);
        setMode('issue');
    }, [people]);

    const makePdf = async (list: Ready[]) => {
        const pdf = await buildCardsPdf(list, layout);
        download(pdf.output('blob'), fileName(list.map(c => c.data)));
    };

    const run = async () => {
        setStep('working');
        setError('');
        try {
            const res = await fetch('/api/id-cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds: ready.map(p => p.id), mode }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const detail = data.problems?.slice(0, 3).map((p: any) => `${p.name}: ${p.missing.join(', ')}`).join('; ');
                throw new Error([data.error || "Couldn't prepare the cards.", detail].filter(Boolean).join(' '));
            }
            const list: Ready[] = await Promise.all((data.cards as CardPayload[]).map(async c => ({ data: c, images: await loadCardImages(c) })));
            setCards(list);
            setStep('ready');
            if (mode === 'issue') onIssued();
            await makePdf(list);
            showToast(mode === 'issue' ? `${list.length} ${list.length === 1 ? 'card' : 'cards'} issued` : 'Print file ready', 'success');
        } catch (e: any) {
            setError(e.message || "Couldn't prepare the cards.");
            setStep('setup');
        }
    };

    const issuing = mode === 'issue';
    return (
        <Modal
            open={!!people}
            onClose={step === 'working' ? () => {} : onClose}
            size={step === 'ready' ? 'lg' : 'md'}
            title={step === 'ready' ? 'Cards ready to print' : 'Print ID cards'}
            description={step === 'ready'
                ? `${cards.length} ${cards.length === 1 ? 'card' : 'cards'} · the PDF has been downloaded`
                : `${people?.length || 0} selected`}
            icon={<ModalIcon tone={step === 'ready' ? 'emerald' : 'blue'}><IdCard /></ModalIcon>}
            closeOnBackdrop={step !== 'working'}
            footer={step === 'ready' ? <>
                <Button type="button" variant="ghost" onClick={() => makePdf(cards)} leftIcon={<Download className="h-4 w-4" />}>Download again</Button>
                <Button type="button" onClick={onClose}>Done</Button>
            </> : <>
                <Button type="button" variant="ghost" onClick={onClose} disabled={step === 'working'}>Cancel</Button>
                <Button type="button" onClick={run} isLoading={step === 'working'} disabled={ready.length === 0}
                    leftIcon={issuing ? <Printer className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}>
                    {issuing ? `Issue ${ready.length} ${ready.length === 1 ? 'card' : 'cards'}` : `Reprint ${ready.length}`}
                </Button>
            </>}
        >
            {step === 'ready' ? (
                <CardViewer cards={cards} index={index} setIndex={setIndex} />
            ) : (
                <div className="space-y-6">
                    {blocked.length > 0 && (
                        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3.5">
                            <p className="flex items-center gap-2 text-sm font-medium text-amber-200">
                                <CircleAlert className="h-4 w-4" />{blocked.length} {blocked.length === 1 ? "person can't" : "people can't"} get a card yet
                            </p>
                            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-amber-100/80">
                                {blocked.map(p => <li key={p.id}><span className="text-amber-100">{p.name || p.email}</span>: needs {p.cardBlockers.join(', ')}</li>)}
                            </ul>
                        </div>
                    )}

                    {ready.length > 0 && (
                        <div>
                            <p className="mb-2 text-[13px] font-medium text-zinc-300">Cards</p>
                            <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
                                <Choice selected={mode === 'issue'} onClick={() => setMode('issue')} title="Issue new cards"
                                    note={withCard.length ? `${withCard.length} already ${withCard.length === 1 ? 'has a card' : 'have cards'}; those stop working.` : 'Each gets a new card number and QR code.'} />
                                <Choice selected={mode === 'reprint'} onClick={() => canReprint && setMode('reprint')} disabled={!canReprint} title="Reprint current cards"
                                    note={canReprint ? 'Same card number and QR, for a failed or lost print.' : 'Only when everyone selected already has a card.'} />
                            </div>
                        </div>
                    )}

                    {ready.length > 0 && (
                        <div>
                            <p className="mb-2 text-[13px] font-medium text-zinc-300">Print on</p>
                            <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
                                {LAYOUTS.map(l => <Choice key={l.val} selected={layout === l.val} onClick={() => setLayout(l.val)} title={l.label} note={l.note} />)}
                            </div>
                        </div>
                    )}

                    {issuing && withCard.length > 0 && (
                        <div className="flex gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/[0.07] p-3.5 text-sm text-rose-200">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                            <p>The current cards of {withCard.length === 1 ? withCard[0].name || withCard[0].email : `${withCard.length} people`} will show as replaced when scanned. Collect the old cards when handing out the new ones.</p>
                        </div>
                    )}

                    {ready.length === 0 && blocked.length > 0 && (
                        <p className="text-sm text-zinc-400">Fill in what's missing on the Employee IDs page or the Companies page, then try again.</p>
                    )}
                    {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
                </div>
            )}
        </Modal>
    );
}

function Choice({ selected, onClick, title, note, disabled }: { selected: boolean; onClick: () => void; title: string; note: string; disabled?: boolean }) {
    return (
        <button type="button" role="radio" aria-checked={selected} disabled={disabled} onClick={onClick}
            className={cn('rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                selected ? 'border-blue-500/50 bg-blue-500/[0.08]' : 'border-[#2F2F35] bg-[#18181B] hover:border-[#3A3A41]')}>
            <span className="flex items-center gap-2 text-sm font-medium text-zinc-100">
                <span className={cn('flex h-4 w-4 items-center justify-center rounded-full border', selected ? 'border-blue-400' : 'border-zinc-600')}>
                    {selected && <span className="h-2 w-2 rounded-full bg-blue-400" />}
                </span>
                {title}
            </span>
            <span className="mt-1 block pl-6 text-xs text-zinc-500">{note}</span>
        </button>
    );
}

/** Both faces of one card, drawn by the same code that writes the PDF. */
export function CardFaces({ card }: { card: Ready }) {
    const front = useRef<HTMLCanvasElement>(null);
    const back = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (front.current) paintFace(front.current, 'front', card.data, card.images, 8);
        if (back.current) paintFace(back.current, 'back', card.data, card.images, 8);
    }, [card]);
    return (
        <div className="flex flex-wrap justify-center gap-5">
            {[['Front', front], ['Back', back]].map(([label, ref]) => (
                <figure key={label as string} className="text-center">
                    <canvas ref={ref as React.RefObject<HTMLCanvasElement>} className="h-auto w-[200px] rounded-[10px] shadow-[0_0_0_1px_#2F2F35] sm:w-[216px]" />
                    <figcaption className="mt-2 text-xs text-zinc-500">{label as string}</figcaption>
                </figure>
            ))}
        </div>
    );
}

function CardViewer({ cards, index, setIndex }: { cards: Ready[]; index: number; setIndex: (n: number) => void }) {
    const c = cards[index];
    if (!c) return null;
    return (
        <div className="space-y-4">
            <div className="rounded-2xl bg-[#18181B] p-5"><CardFaces card={c} /></div>
            <div className="flex items-center justify-between gap-3">
                <Button type="button" size="sm" variant="ghost" disabled={index === 0} onClick={() => setIndex(index - 1)} leftIcon={<ChevronLeft className="h-4 w-4" />}>Previous</Button>
                <p className="min-w-0 truncate text-center text-sm text-zinc-300">
                    {c.data.name} · <span className="font-mono">{c.data.employeeCode}</span>
                    <span className="block text-xs text-zinc-500">Card {c.data.cardNumber} · {index + 1} of {cards.length}</span>
                </p>
                <Button type="button" size="sm" variant="ghost" disabled={index >= cards.length - 1} onClick={() => setIndex(index + 1)} rightIcon={<ChevronRight className="h-4 w-4" />}>Next</Button>
            </div>
        </div>
    );
}
