"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Minus, Plus, Trash2, Upload, UserRound } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type Kind = 'PHOTO' | 'LOGO' | 'SIGNATURE';

// photo frame on the card is 5:6; the stored photo is 500×600, sharp enough for 300 dpi print
const VIEW_W = 200, VIEW_H = 240, OUT_W = 500, OUT_H = 600;
const MAX_INPUT_BYTES = 15_000_000;

interface Props {
    kind: Kind;
    targetId: string;
    url: string | null;
    onChange: (url: string | null) => void;
    label: string;
    hint?: string;
    disabled?: boolean;
}

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That file couldn't be opened as an image."));
    img.src = src;
});
const toBlob = (canvas: HTMLCanvasElement, type: string, q?: number) =>
    new Promise<Blob>((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not prepare the image.'))), type, q));

/** Fits a logo or signature into at most `max` px on the longer side; signatures lose their white background. */
async function prepareFlat(img: HTMLImageElement, kind: Kind) {
    const max = kind === 'SIGNATURE' ? 900 : 700;
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    if (kind === 'SIGNATURE') {
        // scanned or photographed signatures: near-white paper becomes transparent, ink stays
        const px = ctx.getImageData(0, 0, c.width, c.height);
        const d = px.data;
        for (let i = 0; i < d.length; i += 4) {
            const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            if (lum > 225) d[i + 3] = 0;
            else if (lum > 170) d[i + 3] = Math.min(d[i + 3], Math.round(((225 - lum) / 55) * 255));
        }
        ctx.putImageData(px, 0, 0);
    }
    return toBlob(c, 'image/png');
}

export default function ImageField({ kind, targetId, url, onChange, label, hint, disabled }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [cropping, setCropping] = useState<HTMLImageElement | null>(null);

    const upload = async (blob: Blob) => {
        setBusy(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('file', blob, kind === 'PHOTO' ? 'photo.jpg' : `${kind.toLowerCase()}.png`);
            fd.append('kind', kind);
            fd.append('targetId', targetId);
            const res = await fetch('/api/images', { method: 'POST', body: fd });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Couldn't upload. Try again.");
            onChange(data.url);
            setCropping(null);
        } catch (e: any) {
            setError(e.message || "Couldn't upload. Try again.");
        } finally {
            setBusy(false);
        }
    };

    const onFile = async (file?: File | null) => {
        if (inputRef.current) inputRef.current.value = '';
        if (!file) return;
        setError('');
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError('Use a JPG, PNG or WebP image.');
        if (file.size > MAX_INPUT_BYTES) return setError('That file is over 15 MB. Use a smaller image.');
        const src = URL.createObjectURL(file);
        try {
            const img = await loadImage(src);
            if (kind === 'PHOTO') {
                if (img.naturalWidth < 250 || img.naturalHeight < 300) return setError('The photo is too small to print clearly. Use one at least 250 × 300 pixels.');
                setCropping(img);
            } else {
                await upload(await prepareFlat(img, kind));
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            if (kind !== 'PHOTO') URL.revokeObjectURL(src);
        }
    };

    const remove = async () => {
        setBusy(true);
        setError('');
        const res = await fetch(`/api/images?kind=${kind}&targetId=${encodeURIComponent(targetId)}`, { method: 'DELETE' });
        setBusy(false);
        if (!res.ok) return setError("Couldn't remove it. Try again.");
        onChange(null);
    };

    if (cropping) {
        return <PhotoCropper img={cropping} busy={busy} error={error}
            onCancel={() => { URL.revokeObjectURL(cropping.src); setCropping(null); setError(''); }}
            onDone={blob => upload(blob)} />;
    }

    const isPhoto = kind === 'PHOTO';
    return (
        <div className="flex items-start gap-4">
            <div className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#2F2F35]',
                isPhoto ? 'h-[96px] w-[80px] bg-[#18181B]' : 'h-16 w-32 bg-[repeating-conic-gradient(#FFFFFF_0%_25%,#ECECEE_0%_50%)] [background-size:12px_12px]')}>
                {url ? <img src={url} alt={label} className={cn('h-full w-full', isPhoto ? 'object-cover' : 'object-contain p-1.5')} />
                    : isPhoto ? <UserRound className="h-8 w-8 text-zinc-600" /> : <ImagePlus className="h-5 w-5 text-zinc-600" />}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-zinc-300">{label}</p>
                {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" disabled={disabled || busy} onClick={() => inputRef.current?.click()}
                        leftIcon={busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}>
                        {url ? 'Replace' : 'Upload'}
                    </Button>
                    {url && <Button type="button" size="sm" variant="ghost" disabled={disabled || busy} onClick={remove} leftIcon={<Trash2 className="h-3.5 w-3.5" />}>Remove</Button>}
                </div>
                {error && <p role="alert" className="mt-2 text-xs text-rose-300">{error}</p>}
            </div>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
        </div>
    );
}

/** Drag to position, slider to zoom; outputs a 500×600 JPEG that fills the card's photo frame. */
function PhotoCropper({ img, busy, error, onCancel, onDone }: { img: HTMLImageElement; busy: boolean; error: string; onCancel: () => void; onDone: (b: Blob) => void }) {
    const base = Math.max(VIEW_W / img.naturalWidth, VIEW_H / img.naturalHeight);
    const [zoom, setZoom] = useState(1);
    const [off, setOff] = useState({ x: 0, y: 0 });
    const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
    const scale = base * zoom;
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;

    const clamp = (o: { x: number; y: number }, s = scale) => {
        const mx = (img.naturalWidth * s - VIEW_W) / 2, my = (img.naturalHeight * s - VIEW_H) / 2;
        return { x: Math.max(-mx, Math.min(mx, o.x)), y: Math.max(-my, Math.min(my, o.y)) };
    };
    useEffect(() => { setOff(o => clamp(o)); }, [zoom]); // eslint-disable-line react-hooks/exhaustive-deps

    const finish = async () => {
        const c = document.createElement('canvas');
        c.width = OUT_W;
        c.height = OUT_H;
        const ctx = c.getContext('2d')!;
        const k = OUT_W / VIEW_W;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, OUT_W, OUT_H);
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, (VIEW_W / 2 + off.x - w / 2) * k, (VIEW_H / 2 + off.y - h / 2) * k, w * k, h * k);
        onDone(await toBlob(c, 'image/jpeg', 0.9));
    };

    return (
        <div className="rounded-xl border border-[#232327] bg-[#141416] p-4">
            <p className="text-[13px] font-medium text-zinc-300">Position the photo</p>
            <p className="mt-0.5 text-xs text-zinc-500">Drag to move. Keep the face centred, with a little space above the head.</p>
            <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-end">
                <div
                    className="relative shrink-0 cursor-grab touch-none select-none overflow-hidden rounded-lg bg-white ring-1 ring-[#3A3A41] active:cursor-grabbing"
                    style={{ width: VIEW_W, height: VIEW_H }}
                    onPointerDown={e => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y }; }}
                    onPointerMove={e => { const d = drag.current; if (d) setOff(clamp({ x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y })); }}
                    onPointerUp={() => { drag.current = null; }}
                    onPointerCancel={() => { drag.current = null; }}
                >
                    <img src={img.src} alt="" draggable={false} className="pointer-events-none absolute max-w-none"
                        style={{ width: w, height: h, left: VIEW_W / 2 + off.x - w / 2, top: VIEW_H / 2 + off.y - h / 2 }} />
                    {/* face guide */}
                    <div className="pointer-events-none absolute left-1/2 top-[14%] h-[52%] w-[56%] -translate-x-1/2 rounded-[50%] border border-dashed border-white/70 mix-blend-difference" />
                </div>
                <div className="w-full space-y-3 sm:w-auto sm:flex-1">
                    <div className="flex items-center gap-2">
                        <button type="button" aria-label="Zoom out" onClick={() => setZoom(z => Math.max(1, +(z - 0.1).toFixed(2)))} className="rounded-md p-1.5 text-zinc-400 hover:bg-[#1F1F23] hover:text-white"><Minus className="h-4 w-4" /></button>
                        <input type="range" aria-label="Zoom" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="flex-1 accent-blue-500" />
                        <button type="button" aria-label="Zoom in" onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(2)))} className="rounded-md p-1.5 text-zinc-400 hover:bg-[#1F1F23] hover:text-white"><Plus className="h-4 w-4" /></button>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
                        <Button type="button" size="sm" onClick={finish} isLoading={busy}>Use this photo</Button>
                    </div>
                    {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
                </div>
            </div>
        </div>
    );
}
