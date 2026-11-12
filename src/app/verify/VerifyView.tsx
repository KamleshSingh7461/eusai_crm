import React from 'react';
import {
    AlertTriangle, BadgeCheck, Building2, Clock, CreditCard, Globe, Lock, Mail, Phone, ScanFace, SearchX, ShieldAlert, ShieldX, UserX,
} from 'lucide-react';
import type { VerifyCompany, VerifyResult } from '@/lib/verification';
import PrintButton from './PrintButton';

// The public ID card verification page, branded as the company that issued the card (or that owns the
// verify.<domain> address being visited). Read by landlords, bank staff and security desks, mostly on phones,
// right after scanning a card, so the answer comes first and in plain words.

type Tone = 'red' | 'amber' | 'slate';
const STATES: Record<Exclude<VerifyResult['state'], 'VALID'>, { tone: Tone; icon: React.ElementType; title: string; body: (r: VerifyResult, name: string) => string }> = {
    REPLACED: { tone: 'amber', icon: CreditCard, title: 'This card has been replaced', body: (_r, n) => `${n} has issued a newer card to this person. Ask them for their current card and check that one instead.` },
    REVOKED: { tone: 'red', icon: ShieldX, title: 'This card has been cancelled', body: (_r, n) => `${n} cancelled this card, for example after it was reported lost or stolen. Don't accept it as proof of employment.` },
    EXITED: { tone: 'red', icon: UserX, title: 'This card is no longer valid', body: (_r, n) => `The person this card was issued to is no longer employed by ${n}.` },
    EXPIRED: { tone: 'amber', icon: Clock, title: 'This card has expired', body: r => `It was valid until ${fmtDate(r.expiredOn)}. Ask the holder for a renewed card, or contact HR below to confirm their employment.` },
    NOT_FOUND: { tone: 'slate', icon: SearchX, title: 'No matching card', body: r => r.method === 'QR'
        ? "This link doesn't match any card we issued. The card may not be genuine. Contact HR below before accepting it."
        : 'Check the card number on the back of the card and try again. It has 8 letters and digits, like ABCD-2345.' },
    LIMITED: { tone: 'slate', icon: ShieldAlert, title: 'Too many checks from this connection', body: () => 'For security, card checks are limited. Wait a few minutes and try again.' },
};

const TONES: Record<Tone, { ring: string; iconBg: string; icon: string; title: string }> = {
    red: { ring: 'ring-red-200', iconBg: 'bg-red-50', icon: 'text-red-600', title: 'text-red-700' },
    amber: { ring: 'ring-amber-200', iconBg: 'bg-amber-50', icon: 'text-amber-600', title: 'text-amber-700' },
    slate: { ring: 'ring-zinc-200', iconBg: 'bg-zinc-100', icon: 'text-zinc-600', title: 'text-zinc-800' },
};

// ---------- brand colours ----------
const DEFAULT = '#1E3A5F';
const rgb = (hex: string) => {
    const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : DEFAULT;
    return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
};
const toHex = (c: number[]) => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (hex: string, to: number, t: number) => toHex(rgb(hex).map(v => v + (to - v) * t));
const luminance = (hex: string) => { const [r, g, b] = rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

function palette(hex: string | null | undefined) {
    const base = hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex : DEFAULT;
    // very light brand colours can't carry white text in the header, so the band uses a deeper shade
    const band = luminance(base) > 0.62 ? mix(base, 0, 0.55) : base;
    return {
        '--brand': base,
        '--brand-band': band,
        '--brand-deep': mix(base, 0, 0.35),
        '--brand-soft': mix(base, 255, 0.9),
        '--brand-softer': mix(base, 255, 0.95),
        '--brand-line': mix(base, 255, 0.75),
    } as React.CSSProperties;
}

function fmtDate(iso?: string | null) {
    if (!iso) return '—';
    return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
const fmtCheckedAt = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' IST';
const siteHref = (w: string) => (/^https?:\/\//.test(w) ? w : `https://${w}`);
const siteLabel = (w: string) => w.replace(/^https?:\/\//, '').replace(/\/$/, '');

interface Props {
    result: VerifyResult | null;
    /** the company owning the address being visited; used when there's no card result to brand by */
    hostCompany: VerifyCompany | null;
    lookupValue?: string;
}

export default function VerifyView({ result: r, hostCompany, lookupValue }: Props) {
    const company = r?.company || hostCompany;
    const valid = r?.state === 'VALID';
    const info = r && r.state !== 'VALID' ? STATES[r.state] : null;
    const name = company?.legalName || 'the company';
    const logo = company?.hasLogo
        ? r?.ref && r.company ? `/api/verify/image?kind=logo&ref=${encodeURIComponent(r.ref)}` : `/api/verify/image?kind=logo&company=${company.code}`
        : null;

    return (
        <main style={palette(company?.brandColor)} className="min-h-dvh bg-[#F3F4F6] text-zinc-900 [color-scheme:light] [print-color-adjust:exact] [-webkit-print-color-adjust:exact] print:bg-white">
            {/* ---------- brand band ---------- */}
            <header className="relative overflow-hidden bg-[var(--brand-band)] text-white">
                <Guilloche />
                <div className="relative mx-auto flex max-w-2xl items-center gap-4 px-5 pb-24 pt-7 sm:px-6 sm:pt-9">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
                        {logo ? <img src={logo} alt={`${name} logo`} className="h-full w-full object-contain" />
                            : company ? <span className="text-sm font-bold tracking-wide text-[var(--brand-band)]">{company.code.slice(0, 5)}</span>
                                : <Building2 className="h-6 w-6 text-zinc-500" aria-hidden="true" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">Official employee verification</p>
                        <p className="mt-0.5 text-[17px] font-semibold leading-snug sm:text-xl">{company?.legalName || 'Employee ID verification'}</p>
                    </div>
                    <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/20 sm:inline-flex">
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />Secure check
                    </span>
                </div>
            </header>

            <div className="relative mx-auto -mt-16 max-w-2xl px-4 pb-10 sm:px-6">
                <section aria-live="polite" className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06),0_12px_32px_-8px_rgba(16,24,40,0.16)] ring-1 ring-zinc-200/70 print:shadow-none">
                    {/* ---------- the answer ---------- */}
                    {valid && r.holder && r.card ? (
                        <>
                            <div className="flex flex-col items-center gap-4 border-b border-zinc-100 bg-[var(--brand-softer)] px-6 pb-7 pt-8 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
                                <Seal code={company!.code} />
                                <div>
                                    <h1 className="flex items-center justify-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:justify-start">
                                        Verified employee
                                    </h1>
                                    <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-zinc-600">
                                        This card is genuine and the holder currently works for <span className="font-semibold text-zinc-800">{name}</span>.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8">
                                <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-7">
                                    <div className="relative shrink-0">
                                        <div className="h-[168px] w-[140px] overflow-hidden rounded-2xl bg-zinc-100 ring-[3px] ring-[var(--brand)] ring-offset-4 ring-offset-white">
                                            {r.holder.hasPhoto && <img src={`/api/verify/image?kind=photo&ref=${encodeURIComponent(r.ref!)}`} alt={`Photo of ${r.holder.name}`} className="h-full w-full object-cover" />}
                                        </div>
                                        <span className="absolute -bottom-2.5 -right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white ring-4 ring-white" title="Verified">
                                            <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1 text-center sm:pt-1 sm:text-left">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Card holder</p>
                                        <h2 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-zinc-900">{r.holder.name}</h2>
                                        <p className="mt-1 text-[15px] text-zinc-600">{r.holder.designation}</p>
                                        <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[var(--brand-soft)] px-3 py-1.5 font-mono text-[15px] font-semibold tracking-wider text-[var(--brand-deep)] ring-1 ring-[var(--brand-line)]">
                                            {r.holder.employeeCode}
                                        </p>
                                    </div>
                                </div>

                                <dl className="mt-7 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-zinc-200 ring-1 ring-zinc-200 sm:grid-cols-2">
                                    <Field label="Employer" value={name} wide />
                                    <Field label="Date of joining" value={fmtDate(r.holder.dateOfJoining)} />
                                    <Field label="Employment status" value={<span className="inline-flex items-center gap-1.5 text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Currently employed</span>} />
                                    <Field label="Card number" value={r.card.cardNumber} mono />
                                    <Field label="Card valid until" value={fmtDate(r.card.validUntil)} />
                                </dl>

                                <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-5 print:hidden">
                                    <p className="text-sm font-semibold text-zinc-900">Before you accept this card</p>
                                    <ul className="mt-3 space-y-2.5 text-sm text-zinc-600">
                                        <Tip icon={ScanFace}>Make sure the photo above matches the person in front of you.</Tip>
                                        <Tip icon={CreditCard}>Check that the card number on the back of their card is <span className="font-mono font-semibold text-zinc-800">{r.card.cardNumber}</span>.</Tip>
                                        <Tip icon={BadgeCheck}>For official purposes, also ask for a government photo ID in the same name.</Tip>
                                    </ul>
                                </div>
                            </div>
                        </>
                    ) : info && r ? (
                        <div className="px-6 pb-7 pt-8 text-center sm:px-10">
                            <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ${TONES[info.tone].iconBg} ${TONES[info.tone].ring}`}>
                                <info.icon className={`h-8 w-8 ${TONES[info.tone].icon}`} aria-hidden="true" />
                            </span>
                            <h1 className={`mt-5 text-2xl font-semibold tracking-tight ${TONES[info.tone].title}`}>{info.title}</h1>
                            <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-zinc-600">{info.body(r, name)}</p>
                            {(r.state === 'REVOKED' || r.state === 'EXITED' || (r.state === 'NOT_FOUND' && r.method === 'QR')) && (
                                <p className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
                                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />Not valid as proof of employment
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="px-6 pb-2 pt-8 text-center sm:px-10">
                            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-soft)] ring-1 ring-[var(--brand-line)]">
                                <BadgeCheck className="h-8 w-8 text-[var(--brand-deep)]" aria-hidden="true" />
                            </span>
                            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900">
                                {company ? `Verify a ${company.legalName.replace(/\s+(Private|Pvt\.?)\s+(Limited|Ltd\.?)$/i, '')} employee` : 'Verify an employee ID card'}
                            </h1>
                            <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-zinc-600">
                                Scan the QR code on the back of the ID card with your phone camera, or enter the card number below.
                            </p>
                        </div>
                    )}

                    {/* ---------- card number lookup ---------- */}
                    {(!r || !valid) && (
                        <div className="px-6 pb-8 pt-4 sm:px-10 print:hidden">
                            <form method="get" action="/verify" className="mx-auto max-w-md">
                                <label htmlFor="card" className="block text-sm font-semibold text-zinc-800">
                                    {r ? 'Check another card number' : 'Card number'}
                                </label>
                                <div className="mt-2 flex gap-2">
                                    <input id="card" name="card" defaultValue={lookupValue} required autoComplete="off" autoCapitalize="characters" spellCheck={false}
                                        inputMode="text" placeholder="ABCD-2345" maxLength={11} aria-describedby="card-help"
                                        className="h-12 min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-4 font-mono text-lg uppercase tracking-[0.12em] text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-soft)]" />
                                    <button type="submit" className="h-12 shrink-0 rounded-xl bg-[var(--brand-band)] px-5 text-[15px] font-semibold text-white shadow-sm transition-[filter] hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[var(--brand-soft)]">
                                        Verify
                                    </button>
                                </div>
                                <div id="card-help" className="mt-4 flex items-center gap-3.5 rounded-xl bg-zinc-50 p-3.5 ring-1 ring-zinc-200/70">
                                    <CardBackHint />
                                    <p className="text-[13px] leading-snug text-zinc-600">The card number is printed on the back of the card, under the QR code: 8 letters and digits.</p>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ---------- HR contact ---------- */}
                    {company && (company.hrEmail || company.hrPhone) && (
                        <div className="border-t border-zinc-100 bg-zinc-50/70 px-6 py-6 sm:px-8">
                            <p className="text-sm font-semibold text-zinc-900">{valid ? 'Need written confirmation?' : 'Questions about this card?'}</p>
                            <p className="mt-0.5 text-sm text-zinc-600">Contact the HR team at {name}.</p>
                            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                                {company.hrEmail && (
                                    <a href={`mailto:${company.hrEmail}`} className="group flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-zinc-200 transition-shadow hover:ring-[var(--brand)]">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-deep)]"><Mail className="h-[18px] w-[18px]" aria-hidden="true" /></span>
                                        <span className="min-w-0"><span className="block text-xs text-zinc-500">Email HR</span><span className="block truncate text-sm font-semibold text-zinc-900">{company.hrEmail}</span></span>
                                    </a>
                                )}
                                {company.hrPhone && (
                                    <a href={`tel:${company.hrPhone.replace(/[^+\d]/g, '')}`} className="group flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-zinc-200 transition-shadow hover:ring-[var(--brand)]">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-deep)]"><Phone className="h-[18px] w-[18px]" aria-hidden="true" /></span>
                                        <span className="min-w-0"><span className="block text-xs text-zinc-500">Call HR</span><span className="block truncate text-sm font-semibold text-zinc-900">{company.hrPhone}</span></span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* ---------- issuer and audit details ---------- */}
                <footer className="mt-6 space-y-4 px-1 text-[13px] leading-relaxed text-zinc-500">
                    {company && (
                        <div className="space-y-0.5">
                            <p className="font-semibold text-zinc-700">{company.legalName}</p>
                            {company.cin && <p>CIN <span className="font-mono">{company.cin}</span></p>}
                            {company.registeredAddress && <p>Registered office: {company.registeredAddress}</p>}
                            {company.website && (
                                <p><a href={siteHref(company.website)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500">
                                    <Globe className="h-3.5 w-3.5" aria-hidden="true" />{siteLabel(company.website)}
                                </a></p>
                            )}
                        </div>
                    )}
                    {r && (
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-4">
                            <p>
                                Checked {fmtCheckedAt(r.checkedAt)}
                                {r.reference && <> · Reference <span className="font-mono font-semibold text-zinc-700">{r.reference}</span></>}
                            </p>
                            <div className="flex items-center gap-1">
                                {valid && <a href="/verify" className="rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 print:hidden">Check another card</a>}
                                <PrintButton />
                            </div>
                        </div>
                    )}
                    <p className="text-xs text-zinc-400">
                        This page confirms employment with the company named above, at the time shown. It isn't a government identity document.
                        {company?.verifyDomain && <> Genuine checks only ever happen at <span className="font-medium text-zinc-500">{company.verifyDomain}</span>.</>}
                    </p>
                </footer>
            </div>
        </main>
    );
}

const Field = ({ label, value, mono, wide }: { label: string; value: React.ReactNode; mono?: boolean; wide?: boolean }) => (
    <div className={`bg-white px-4 py-3.5 ${wide ? 'sm:col-span-2' : ''}`}>
        <dt className="text-xs font-medium text-zinc-500">{label}</dt>
        <dd className={`mt-0.5 text-[15px] font-semibold text-zinc-900 ${mono ? 'font-mono tracking-wider' : ''}`}>{value}</dd>
    </div>
);

const Tip = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
    <li className="flex gap-3">
        <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--brand-soft)] text-[var(--brand-deep)]"><Icon className="h-3.5 w-3.5" aria-hidden="true" /></span>
        <span>{children}</span>
    </li>
);

/** Fine security-paper lines across the brand band. */
function Guilloche() {
    const waves = Array.from({ length: 9 }, (_, i) => {
        const y = 18 + i * 22, a = 9 + (i % 3) * 3;
        return `M-20 ${y} C 80 ${y - a}, 160 ${y + a}, 260 ${y} S 440 ${y - a}, 540 ${y} S 720 ${y + a}, 820 ${y}`;
    });
    return (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 800 220">
            <g fill="none" stroke="white" strokeOpacity="0.09" strokeWidth="1">
                {waves.map((d, i) => <path key={i} d={d} />)}
                {waves.map((d, i) => <path key={`b${i}`} d={d} transform="translate(0 11) scale(1 -1) translate(0 -220)" />)}
            </g>
            <circle cx="720" cy="40" r="120" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="26" />
        </svg>
    );
}

/** Round verification seal in the company colour, with its short code in the ring. */
function Seal({ code }: { code: string }) {
    const id = `seal-${code}`;
    const ring = `VERIFIED EMPLOYEE • ${code} • VERIFIED EMPLOYEE • ${code} • `;
    return (
        <svg viewBox="0 0 120 120" className="h-[92px] w-[92px] shrink-0" role="img" aria-label="Verified seal">
            <defs><path id={id} d="M60 60 m-47 0 a47 47 0 1 1 94 0 a47 47 0 1 1 -94 0" /></defs>
            <circle cx="60" cy="60" r="58" fill="white" stroke="var(--brand)" strokeWidth="2" />
            <circle cx="60" cy="60" r="38" fill="var(--brand)" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--brand-line)" strokeWidth="1" />
            <text fontSize="8.6" fontWeight="700" letterSpacing="1.6" fill="var(--brand-deep)" style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif' }}>
                <textPath href={`#${id}`} textLength="292" lengthAdjust="spacing">{ring}</textPath>
            </text>
            <path d="M44 61 l11 11 l22 -24" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/** Small drawing of a card back showing where the card number is. */
function CardBackHint() {
    return (
        <svg viewBox="0 0 44 64" className="h-14 w-10 shrink-0" aria-hidden="true">
            <rect x="1" y="1" width="42" height="62" rx="4" fill="white" stroke="#D4D4D8" />
            <rect x="1" y="1" width="42" height="3" rx="1.5" fill="var(--brand)" />
            <rect x="12" y="9" width="20" height="20" rx="1.5" fill="#27272A" />
            <rect x="15" y="12" width="5" height="5" fill="white" /><rect x="24" y="12" width="5" height="5" fill="white" /><rect x="15" y="21" width="5" height="5" fill="white" />
            <rect x="6" y="33" width="32" height="7" rx="2" fill="var(--brand-soft)" stroke="var(--brand)" strokeWidth="1.2" />
            <rect x="10" y="35.5" width="24" height="2" rx="1" fill="var(--brand-deep)" />
            <rect x="6" y="46" width="22" height="2" rx="1" fill="#E4E4E7" /><rect x="6" y="51" width="28" height="2" rx="1" fill="#E4E4E7" />
        </svg>
    );
}
