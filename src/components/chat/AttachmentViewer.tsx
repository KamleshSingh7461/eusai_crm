"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileArchive, FileSpreadsheet, FileText, Loader2, Presentation, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Attachment } from './chatUtils';

// Full-screen preview for chat attachments: images (zoom), PDFs, text and CSV files open right here;
// Word, Excel, PowerPoint and zip files get a file card with Download and Open, because previewing them
// would mean sending the file to an outside service.

type Kind = 'image' | 'pdf' | 'text' | 'csv' | 'office' | 'archive' | 'other';

const extOf = (a: Attachment) => ((a.name || a.url).split('?')[0].split('.').pop() || '').toLowerCase();

export function kindOf(a: Attachment): Kind {
    const ext = extOf(a);
    if (a.type === 'IMAGE' || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (ext === 'csv') return 'csv';
    if (['txt', 'log', 'md'].includes(ext)) return 'text';
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'office';
    if (ext === 'zip') return 'archive';
    return 'other';
}

const fileName = (a: Attachment) => a.name || decodeURIComponent(a.url.split('/').pop() || 'Attachment').replace(/^[0-9a-f-]{36}-/, '');

function OfficeIcon({ a, className }: { a: Attachment; className?: string }) {
    const ext = extOf(a);
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className={className} />;
    if (['ppt', 'pptx'].includes(ext)) return <Presentation className={className} />;
    if (ext === 'zip') return <FileArchive className={className} />;
    return <FileText className={className} />;
}

/** Small CSV reader for previews: handles quoted fields and commas inside quotes. */
function parseCsv(text: string, maxRows = 300) {
    const rows: string[][] = [];
    let row: string[] = [], cell = '', q = false;
    for (let i = 0; i < text.length && rows.length < maxRows; i++) {
        const c = text[i];
        if (q) {
            if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
            else if (c === '"') q = false;
            else cell += c;
        } else if (c === '"') q = true;
        else if (c === ',') { row.push(cell); cell = ''; }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(cell); rows.push(row); row = []; cell = '';
        } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
}

const MAX_TEXT = 300_000;

function TextPreview({ a, csv }: { a: Attachment; csv: boolean }) {
    const [text, setText] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        let alive = true;
        setText(null); setFailed(false);
        fetch(a.url).then(r => (r.ok ? r.text() : Promise.reject())).then(t => { if (alive) setText(t.slice(0, MAX_TEXT)); }).catch(() => alive && setFailed(true));
        return () => { alive = false; };
    }, [a.url]);

    if (failed) return <FileCard a={a} note="This file couldn't be shown here." />;
    if (text === null) return <div className="flex h-full items-center justify-center text-zinc-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    if (csv) {
        const rows = parseCsv(text);
        const [head, ...body] = rows;
        return (
            <div className="h-full w-full overflow-auto rounded-xl bg-[#111113] ring-1 ring-white/10">
                <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-[#18181B]">
                        <tr>{(head || []).map((h, i) => <th key={i} className="whitespace-nowrap border-b border-white/10 px-3 py-2 font-semibold text-zinc-100">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                        {body.map((r, i) => (
                            <tr key={i} className="odd:bg-white/[0.02]">
                                {r.map((c, j) => <td key={j} className="whitespace-nowrap border-b border-white/[0.04] px-3 py-1.5 text-zinc-300">{c}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rows.length >= 300 && <p className="px-3 py-2 text-xs text-zinc-500">Showing the first 300 rows. Download the file to see everything.</p>}
            </div>
        );
    }
    return (
        <pre className="h-full w-full overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#111113] p-5 font-mono text-[13px] leading-relaxed text-zinc-200 ring-1 ring-white/10">
            {text}{text.length >= MAX_TEXT && '\n\n… (preview shortened, download the file to see all of it)'}
        </pre>
    );
}

function FileCard({ a, note }: { a: Attachment; note?: string }) {
    const ext = extOf(a).toUpperCase();
    return (
        <div className="flex h-full items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#111113] p-7 text-center ring-1 ring-white/10">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-500/25">
                    <OfficeIcon a={a} className="h-8 w-8" />
                </span>
                <p className="mt-4 break-words text-base font-semibold text-white">{fileName(a)}</p>
                {ext && <p className="mt-1 text-xs font-medium tracking-wide text-zinc-500">{ext} file</p>}
                <p className="mt-3 text-sm text-zinc-400">{note || "This kind of file can't be previewed in the browser. Download it to open it in its app."}</p>
                <a href={a.url} download={fileName(a)} className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500">
                    <Download className="h-4 w-4" />Download
                </a>
            </div>
        </div>
    );
}

function PdfPreview({ a }: { a: Attachment }) {
    // phone browsers usually can't show a PDF inside a page; they get the card with Open and Download
    const [inline] = useState(() => typeof navigator !== 'undefined' && (navigator as any).pdfViewerEnabled !== false && !/Android|iPhone|iPad/i.test(navigator.userAgent));
    if (!inline) return <FileCard a={a} note="Tap Open to view this PDF, or download it." />;
    return <iframe src={`${a.url}#view=FitH`} title={fileName(a)} className="h-full w-full rounded-xl bg-white" />;
}

function ImagePreview({ a, zoomed, setZoomed }: { a: Attachment; zoomed: boolean; setZoomed: (z: boolean) => void }) {
    const [loaded, setLoaded] = useState(false);
    useEffect(() => setLoaded(false), [a.url]);
    return (
        <div className={cn('flex h-full w-full', zoomed ? 'overflow-auto' : 'items-center justify-center overflow-hidden')}>
            {!loaded && <Loader2 className="absolute h-6 w-6 animate-spin text-zinc-400" />}
            <img
                src={a.url} alt={fileName(a)} onLoad={() => setLoaded(true)}
                onClick={() => setZoomed(!zoomed)}
                className={cn('select-none transition-opacity', loaded ? 'opacity-100' : 'opacity-0',
                    zoomed ? 'm-auto max-w-none cursor-zoom-out' : 'max-h-full max-w-full cursor-zoom-in rounded-lg object-contain')}
            />
        </div>
    );
}

interface Props {
    items: Attachment[];
    index: number | null;
    onClose: () => void;
    onIndex: (i: number) => void;
    /** shown under the file name, e.g. "Priya Sharma · 3:42 pm" */
    caption?: string;
}

export default function AttachmentViewer({ items, index, onClose, onIndex, caption }: Props) {
    const [zoomed, setZoomed] = useState(false);
    const touch = useRef<number | null>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const open = index !== null && !!items[index];
    const a = open ? items[index!] : null;
    const many = items.length > 1;

    const go = useCallback((d: number) => {
        if (index === null || !many) return;
        setZoomed(false);
        onIndex((index + d + items.length) % items.length);
    }, [index, many, items.length, onIndex]);

    useEffect(() => {
        if (!open) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const prevFocus = document.activeElement as HTMLElement | null;
        closeRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'ArrowRight') go(1);
            else if (e.key === 'ArrowLeft') go(-1);
        };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
            prevFocus?.focus?.();
        };
    }, [open, go, onClose]);

    useEffect(() => setZoomed(false), [index]);

    if (!open || !a || typeof document === 'undefined') return null;
    const kind = kindOf(a);

    return createPortal(
        <div role="dialog" aria-modal="true" aria-label={`Preview of ${fileName(a)}`}
            className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-sm"
            onTouchStart={e => { touch.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
                if (touch.current === null || zoomed) return;
                const dx = e.changedTouches[0].clientX - touch.current;
                if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
                touch.current = null;
            }}
        >
            {/* top bar */}
            <div className="flex shrink-0 items-center gap-3 px-3 py-2.5 sm:px-5 sm:py-3" style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}>
                <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-zinc-200 sm:flex">
                    {kind === 'image' ? <ZoomIn className="h-4 w-4" /> : <OfficeIcon a={a} className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{fileName(a)}</p>
                    <p className="truncate text-xs text-zinc-400">{[caption, many ? `${index! + 1} of ${items.length}` : null].filter(Boolean).join(' · ')}</p>
                </div>
                {kind === 'image' && (
                    <button type="button" onClick={() => setZoomed(z => !z)} aria-label={zoomed ? 'Fit to screen' : 'Zoom in'}
                        className="hidden h-9 w-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white sm:flex">
                        {zoomed ? <ZoomOut className="h-[18px] w-[18px]" /> : <ZoomIn className="h-[18px] w-[18px]" />}
                    </button>
                )}
                <a href={a.url} target="_blank" rel="noopener noreferrer" aria-label="Open in a new tab"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white"><ExternalLink className="h-[18px] w-[18px]" /></a>
                <a href={a.url} download={fileName(a)} aria-label="Download"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white"><Download className="h-[18px] w-[18px]" /></a>
                <button ref={closeRef} type="button" onClick={onClose} aria-label="Close preview"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {/* content; clicking the empty space around it closes */}
            <div className="relative min-h-0 flex-1 px-2 pb-3 sm:px-16 sm:pb-6" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-center" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
                    {kind === 'image' && <ImagePreview a={a} zoomed={zoomed} setZoomed={setZoomed} />}
                    {kind === 'pdf' && <PdfPreview a={a} />}
                    {(kind === 'text' || kind === 'csv') && <TextPreview a={a} csv={kind === 'csv'} />}
                    {(kind === 'office' || kind === 'archive' || kind === 'other') && <FileCard a={a} />}
                </div>

                {many && (
                    <>
                        <button type="button" onClick={() => go(-1)} aria-label="Previous attachment"
                            className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:flex"><ChevronLeft className="h-6 w-6" /></button>
                        <button type="button" onClick={() => go(1)} aria-label="Next attachment"
                            className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:flex"><ChevronRight className="h-6 w-6" /></button>
                    </>
                )}
            </div>

            {/* thumbnails when a message has several attachments */}
            {many && (
                <div className="flex shrink-0 justify-center gap-2 overflow-x-auto px-3 pb-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                    {items.map((it, i) => (
                        <button key={it.url + i} type="button" onClick={() => onIndex(i)} aria-label={`Show ${fileName(it)}`} aria-current={i === index}
                            className={cn('h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-2 transition', i === index ? 'ring-white' : 'ring-transparent opacity-60 hover:opacity-100')}>
                            {kindOf(it) === 'image'
                                ? <img src={it.url} alt="" className="h-full w-full object-cover" />
                                : <span className="flex h-full w-full items-center justify-center bg-white/10 text-zinc-200"><OfficeIcon a={it} className="h-5 w-5" /></span>}
                        </button>
                    ))}
                </div>
            )}
        </div>,
        document.body
    );
}
