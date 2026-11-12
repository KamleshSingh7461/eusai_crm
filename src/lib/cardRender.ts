import QRCode from 'qrcode';
import type { CardPayload } from '@/lib/idCards';

// The ID card layout, written once in millimetres against a tiny "painter" interface. The same drawing code
// paints the on-screen preview (canvas) and the print file (jsPDF), so what HR sees is exactly what prints.
// Card size is ISO/IEC 7810 ID-1 (bank card), portrait.

export const CARD_W = 53.98;
export const CARD_H = 85.6;

export interface CardImages { photo?: HTMLImageElement | null; logo?: HTMLImageElement | null; signature?: HTMLImageElement | null }
export interface TextOpts { size: number; bold?: boolean; mono?: boolean; color: string; align?: 'left' | 'center' | 'right' }

export interface Painter {
    rect(x: number, y: number, w: number, h: number, color: string, radius?: number): void;
    line(x1: number, y1: number, x2: number, y2: number, color: string, width: number): void;
    text(s: string, x: number, y: number, o: TextOpts): void;
    width(s: string, o: Omit<TextOpts, 'color' | 'align'>): number;
    image(img: HTMLImageElement, x: number, y: number, w: number, h: number, format: 'JPEG' | 'PNG'): void;
}

const INK = '#1A1A1A', MUTED = '#5F5E5A', SOFT = '#888780', RULE = '#D3D1C7', PAPER = '#FFFFFF';
const DEFAULT_BRAND = '#1D4ED8';

// ---------- colour helpers ----------
const hexRgb = (hex: string) => {
    const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : DEFAULT_BRAND;
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
};
const rgbHex = (c: number[]) => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
/** brand colour mixed toward white: 0 = brand, 1 = white */
const tint = (hex: string, t: number) => rgbHex(hexRgb(hex).map(v => v + (255 - v) * t));
/** brand colour mixed toward black */
const shade = (hex: string, t: number) => rgbHex(hexRgb(hex).map(v => v * (1 - t)));
/** brands too light to carry white text get darkened for the header band */
const bandColor = (hex: string) => {
    const [r, g, b] = hexRgb(hex);
    return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? shade(hex, 0.45) : rgbHex([r, g, b]);
};

// ---------- text helpers ----------
function wrap(p: Painter, text: string, o: Omit<TextOpts, 'color' | 'align'>, maxW: number, maxLines: number) {
    const words = text.replace(/\s+/g, ' ').trim().split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
        const next = cur ? `${cur} ${w}` : w;
        if (p.width(next, o) <= maxW || !cur) cur = next;
        else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
        const kept = lines.slice(0, maxLines);
        let last = kept[maxLines - 1];
        while (last.length > 1 && p.width(`${last}…`, o) > maxW) last = last.slice(0, -1);
        kept[maxLines - 1] = `${last.trimEnd()}…`;
        return kept;
    }
    return lines;
}
/** largest font size (down to `min`) at which the text fits on one line */
function fitSize(p: Painter, text: string, o: Omit<TextOpts, 'color' | 'align' | 'size'>, maxW: number, start: number, min: number) {
    let s = start;
    while (s > min && p.width(text, { ...o, size: s }) > maxW) s -= 0.25;
    return s;
}
const fmtDate = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
function contain(img: HTMLImageElement, bw: number, bh: number) {
    const k = Math.min(bw / img.naturalWidth, bh / img.naturalHeight);
    return { w: img.naturalWidth * k, h: img.naturalHeight * k };
}

// ---------- front ----------
export function drawFront(p: Painter, d: CardPayload, im: CardImages) {
    const brand = d.company.brandColor || DEFAULT_BRAND;
    const band = bandColor(brand);
    p.rect(0, 0, CARD_W, CARD_H, PAPER);

    // header band: logo tile and legal name
    p.rect(0, 0, CARD_W, 15.5, band);
    p.rect(3.2, 3.5, 8.5, 8.5, PAPER, 1.4);
    if (im.logo) {
        const s = contain(im.logo, 7.3, 7.3);
        p.image(im.logo, 3.2 + (8.5 - s.w) / 2, 3.5 + (8.5 - s.h) / 2, s.w, s.h, 'PNG');
    } else {
        const code = d.company.code.slice(0, 5);
        const size = fitSize(p, code, { bold: true }, 7.6, 6.6, 3.6);
        p.text(code, 3.2 + 4.25, 3.5 + 4.25 + size * 0.12, { size, bold: true, color: band, align: 'center' });
    }
    const nameOpts = { size: 6.4, bold: true };
    const legal = wrap(p, d.company.legalName, nameOpts, 38, 3);
    const top = 7.75 - ((legal.length - 1) * 2.55) / 2 + 0.9;
    legal.forEach((l, i) => p.text(l, 14, top + i * 2.55, { ...nameOpts, color: PAPER }));

    // photo
    const px = (CARD_W - 21) / 2, py = 19;
    p.rect(px - 0.7, py - 0.7, 21 + 1.4, 25.2 + 1.4, brand, 2.2);
    p.rect(px, py, 21, 25.2, '#F1EFE8', 1.6);
    if (im.photo) p.image(im.photo, px, py, 21, 25.2, 'JPEG');

    // name, designation, ID
    const nameSize = fitSize(p, d.name, { bold: true }, CARD_W - 6, 11, 7);
    p.text(d.name, CARD_W / 2, 50.2, { size: nameSize, bold: true, color: INK, align: 'center' });
    const des = wrap(p, d.designation, { size: 6.8 }, CARD_W - 8, 2);
    des.forEach((l, i) => p.text(l, CARD_W / 2, 53.6 + i * 2.6, { size: 6.8, color: MUTED, align: 'center' }));
    const idY = 53.6 + des.length * 2.6 + 0.4;
    const idSize = fitSize(p, d.employeeCode, { bold: true, mono: true }, CARD_W - 12, 8.6, 6);
    const idW = p.width(d.employeeCode, { size: idSize, bold: true, mono: true }) + 5;
    p.rect((CARD_W - idW) / 2, idY, idW, 5, tint(brand, 0.86), 1.2);
    p.text(d.employeeCode, CARD_W / 2, idY + 3.45, { size: idSize, bold: true, mono: true, color: shade(brand, 0.15), align: 'center' });

    // dates
    const dy = Math.max(idY + 8.6, 66);
    p.text('Joined', 5, dy, { size: 5.2, color: SOFT });
    p.text(fmtDate(d.dateOfJoining), 5, dy + 3, { size: 7, bold: true, color: INK });
    p.text('Valid till', 29.5, dy, { size: 5.2, color: SOFT });
    p.text(fmtDate(d.validUntil), 29.5, dy + 3, { size: 7, bold: true, color: INK });

    // signature block and issue date
    if (im.signature) {
        const s = contain(im.signature, 22, 6.2);
        p.image(im.signature, 5, 78.2 - s.h, s.w, s.h, 'PNG');
    }
    p.line(5, 78.6, 27, 78.6, SOFT, 0.15);
    if (d.company.signatoryName) {
        const sig = [d.company.signatoryName, d.company.signatoryTitle].filter(Boolean).join(', ');
        p.text(wrap(p, sig, { size: 5.2, bold: true }, 30, 1)[0], 5, 80.9, { size: 5.2, bold: true, color: INK });
    }
    p.text('Authorised signatory', 5, 83, { size: 4.8, color: SOFT });
    p.text('Issued', CARD_W - 5, 80.9, { size: 4.8, color: SOFT, align: 'right' });
    p.text(fmtDate(d.issuedAt), CARD_W - 5, 83, { size: 5.6, bold: true, color: INK, align: 'right' });

    p.rect(0, CARD_H - 1.4, CARD_W, 1.4, brand);
}

// ---------- back ----------
export function drawBack(p: Painter, d: CardPayload) {
    const brand = d.company.brandColor || DEFAULT_BRAND;
    p.rect(0, 0, CARD_W, CARD_H, PAPER);
    p.rect(0, 0, CARD_W, 1.4, brand);

    p.text('Scan to verify this card', CARD_W / 2, 6.6, { size: 6, color: MUTED, align: 'center' });

    // QR, drawn as squares so it stays sharp at any print resolution
    const qr = QRCode.create(d.verifyUrl, { errorCorrectionLevel: 'M' });
    const n = qr.modules.size, box = 25, quiet = 1.6, cell = (box - quiet * 2) / n;
    const qx = (CARD_W - box) / 2, qy = 8.6;
    p.rect(qx, qy, box, box, PAPER);
    for (let r = 0; r < n; r++) {
        let c = 0;
        while (c < n) {
            if (!qr.modules.get(r, c)) { c++; continue; }
            const start = c;
            while (c < n && qr.modules.get(r, c)) c++;
            // a hair of overlap avoids thin white seams between neighbouring squares
            p.rect(qx + quiet + start * cell, qy + quiet + r * cell, (c - start) * cell + 0.02, cell + 0.02, INK);
        }
    }

    p.text('or visit', CARD_W / 2, 37.4, { size: 5.6, color: MUTED, align: 'center' });
    const hostSize = fitSize(p, d.verifyHost, { bold: true }, CARD_W - 6, 6.4, 4.6);
    p.text(d.verifyHost, CARD_W / 2, 40.2, { size: hostSize, bold: true, color: INK, align: 'center' });
    const pre = 'and enter card no. ';
    const preW = p.width(pre, { size: 5.6 }), numW = p.width(d.cardNumber, { size: 6.6, bold: true, mono: true });
    const sx = (CARD_W - preW - numW) / 2;
    p.text(pre, sx, 43.2, { size: 5.6, color: MUTED });
    p.text(d.cardNumber, sx + preW, 43.2, { size: 6.6, bold: true, mono: true, color: INK });

    p.line(4.5, 46, CARD_W - 4.5, 46, RULE, 0.15);

    let y = 49.4;
    p.text('Registered office', 4.5, y, { size: 5, color: SOFT });
    const addr = wrap(p, d.company.registeredAddress || '', { size: 5.9 }, CARD_W - 9, 3);
    addr.forEach((l, i) => p.text(l, 4.5, y + 2.7 + i * 2.45, { size: 5.9, color: INK }));
    y += 2.7 + addr.length * 2.45 + 2.2;

    if (d.company.cin || d.company.gstin) {
        if (d.company.cin) {
            p.text('CIN', 4.5, y, { size: 5, color: SOFT });
            p.text(d.company.cin, 4.5, y + 2.6, { size: 5.3, mono: true, color: INK });
        }
        if (d.company.gstin) {
            const gx = d.company.cin ? 33 : 4.5;
            p.text('GSTIN', gx, y, { size: 5, color: SOFT });
            p.text(d.company.gstin, gx, y + 2.6, { size: 5.3, mono: true, color: INK });
        }
        y += 6.2;
    }

    p.text('HR verification', 4.5, y, { size: 5, color: SOFT });
    const contacts = [d.company.hrEmail, d.company.hrPhone].filter(Boolean) as string[];
    contacts.forEach((c, i) => p.text(c, 4.5, y + 2.7 + i * 2.5, { size: 5.9, color: INK }));

    const foot = wrap(p, `Property of ${d.company.legalName}. If found, please return it to the registered office above.`, { size: 4.8 }, CARD_W - 9, 3);
    foot.forEach((l, i) => p.text(l, CARD_W / 2, CARD_H - 2.4 - (foot.length - 1 - i) * 2.1, { size: 4.8, color: SOFT, align: 'center' }));
}

// ---------- canvas painter (preview) ----------
const FONT_SANS = 'Helvetica, Arial, sans-serif';
const FONT_MONO = '"Courier New", Courier, monospace';
const PT = 0.3528; // mm per point

export function canvasPainter(ctx: CanvasRenderingContext2D): Painter {
    const font = (o: { size: number; bold?: boolean; mono?: boolean }) => `${o.bold ? 700 : 400} ${o.size * PT}px ${o.mono ? FONT_MONO : FONT_SANS}`;
    return {
        rect(x, y, w, h, color, r) {
            ctx.fillStyle = color;
            ctx.beginPath();
            if (r) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
            ctx.fill();
        },
        line(x1, y1, x2, y2, color, width) {
            ctx.strokeStyle = color; ctx.lineWidth = width;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        },
        text(s, x, y, o) {
            ctx.font = font(o); ctx.fillStyle = o.color; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
            ctx.fillText(s, x, y);
        },
        width(s, o) { ctx.font = font(o); return ctx.measureText(s).width; },
        image(img, x, y, w, h) {
            ctx.save();
            if (img.dataset.round) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Number(img.dataset.round)); ctx.clip(); }
            ctx.drawImage(img, x, y, w, h);
            ctx.restore();
        },
    };
}

/** Draws one face onto a canvas at `pxPerMm` resolution. */
export function paintFace(canvas: HTMLCanvasElement, face: 'front' | 'back', d: CardPayload, im: CardImages, pxPerMm = 8) {
    canvas.width = Math.round(CARD_W * pxPerMm);
    canvas.height = Math.round(CARD_H * pxPerMm);
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(pxPerMm, 0, 0, pxPerMm, 0, 0);
    ctx.clearRect(0, 0, CARD_W, CARD_H);
    if (face === 'front') drawFront(canvasPainter(ctx), d, im); else drawBack(canvasPainter(ctx), d);
}

// ---------- PDF ----------
type JsPDF = import('jspdf').jsPDF;

function pdfPainter(pdf: JsPDF, ox: number, oy: number): Painter {
    const setFont = (o: { size: number; bold?: boolean; mono?: boolean }) => {
        pdf.setFont(o.mono ? 'courier' : 'helvetica', o.bold ? 'bold' : 'normal');
        pdf.setFontSize(o.size);
    };
    return {
        rect(x, y, w, h, color, r) {
            pdf.setFillColor(color);
            if (r) pdf.roundedRect(ox + x, oy + y, w, h, r, r, 'F'); else pdf.rect(ox + x, oy + y, w, h, 'F');
        },
        line(x1, y1, x2, y2, color, width) { pdf.setDrawColor(color); pdf.setLineWidth(width); pdf.line(ox + x1, oy + y1, ox + x2, oy + y2); },
        text(s, x, y, o) { setFont(o); pdf.setTextColor(o.color); pdf.text(s, ox + x, oy + y, { align: o.align || 'left' }); },
        width(s, o) { setFont(o); return pdf.getTextWidth(s); },
        image(img, x, y, w, h, format) {
            const r = Number(img.dataset.round || 0);
            if (!r) return pdf.addImage(img, format, ox + x, oy + y, w, h, undefined, 'MEDIUM');
            // rounded photo corners: clip to the frame's shape
            pdf.saveGraphicsState();
            pdf.roundedRect(ox + x, oy + y, w, h, r, r, null as any);
            pdf.clip();
            pdf.discardPath();
            pdf.addImage(img, format, ox + x, oy + y, w, h, undefined, 'MEDIUM');
            pdf.restoreGraphicsState();
        },
    };
}

function cropMarks(pdf: JsPDF, x: number, y: number) {
    pdf.setDrawColor('#9A9A9A');
    pdf.setLineWidth(0.15);
    const L = 3, G = 1;
    for (const [cx, cy, sx, sy] of [[x, y, -1, -1], [x + CARD_W, y, 1, -1], [x, y + CARD_H, -1, 1], [x + CARD_W, y + CARD_H, 1, 1]]) {
        pdf.line(cx + sx * G, cy, cx + sx * (G + L), cy);
        pdf.line(cx, cy + sy * G, cx, cy + sy * (G + L));
    }
}

export type PrintLayout = 'card' | 'a4';

/**
 * Builds the print file.
 *  - card: one card-sized page per face (front, back, front, back…) for PVC card printers
 *  - a4: nine cards per A4 sheet with crop marks; each fronts sheet is followed by its backs sheet,
 *    mirrored left-to-right so the faces line up when printed double-sided (flip on long edge)
 */
export async function buildCardsPdf(cards: { data: CardPayload; images: CardImages }[], layout: PrintLayout) {
    const { jsPDF } = await import('jspdf');
    if (layout === 'card') {
        const pdf = new jsPDF({ unit: 'mm', format: [CARD_W, CARD_H], orientation: 'portrait', compress: true });
        cards.forEach((c, i) => {
            if (i > 0) pdf.addPage([CARD_W, CARD_H], 'portrait');
            drawFront(pdfPainter(pdf, 0, 0), c.data, c.images);
            pdf.addPage([CARD_W, CARD_H], 'portrait');
            drawBack(pdfPainter(pdf, 0, 0), c.data);
        });
        return pdf;
    }
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    const COLS = 3, ROWS = 3, GX = 8, GY = 6;
    const mx = (210 - (COLS * CARD_W + (COLS - 1) * GX)) / 2, my = (297 - (ROWS * CARD_H + (ROWS - 1) * GY)) / 2;
    const pos = (slot: number, mirror: boolean) => {
        const col = slot % COLS, row = Math.floor(slot / COLS);
        const c = mirror ? COLS - 1 - col : col;
        return { x: mx + c * (CARD_W + GX), y: my + row * (CARD_H + GY) };
    };
    for (let start = 0, sheet = 0; start < cards.length; start += COLS * ROWS, sheet++) {
        const batch = cards.slice(start, start + COLS * ROWS);
        if (sheet > 0) pdf.addPage('a4', 'portrait');
        batch.forEach((c, i) => { const { x, y } = pos(i, false); drawFront(pdfPainter(pdf, x, y), c.data, c.images); cropMarks(pdf, x, y); });
        pdf.addPage('a4', 'portrait');
        batch.forEach((c, i) => { const { x, y } = pos(i, true); drawBack(pdfPainter(pdf, x, y), c.data); cropMarks(pdf, x, y); });
    }
    return pdf;
}

/** Loads a same-origin image (photo, logo, signature) so both painters can draw it. */
export function loadCardImage(url: string | null | undefined): Promise<HTMLImageElement | null> {
    if (!url) return Promise.resolve(null);
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

export async function loadCardImages(d: CardPayload): Promise<CardImages> {
    const [photo, logo, signature] = await Promise.all([loadCardImage(d.photoUrl), loadCardImage(d.company.logoUrl), loadCardImage(d.company.signatureUrl)]);
    if (photo) photo.dataset.round = '1.6';
    return { photo, logo, signature };
}
