import React from 'react';
import type { VerifyResult } from '@/lib/verification';

// The public verification page. Light, plain and printable: it's read by landlords, bank staff and security
// desks, usually on a phone, right after scanning a card.

const STATES: Record<Exclude<VerifyResult['state'], 'VALID'>, { tone: 'red' | 'amber' | 'slate'; title: string; body: (r: VerifyResult) => string }> = {
    REPLACED: { tone: 'amber', title: 'This card has been replaced', body: r => `${r.company?.legalName} has issued a newer card to this person. Ask them for their current card.` },
    REVOKED: { tone: 'red', title: 'This card has been cancelled', body: r => `${r.company?.legalName} cancelled this card, for example after it was reported lost. Don't accept it as proof of employment.` },
    EXITED: { tone: 'red', title: 'This card is no longer valid', body: r => `The person this card was issued to is no longer employed by ${r.company?.legalName}.` },
    EXPIRED: { tone: 'amber', title: 'This card has expired', body: r => `It was valid until ${fmt(r.expiredOn)}. Ask the holder for a renewed card, or contact the company below.` },
    NOT_FOUND: { tone: 'slate', title: 'No card found', body: r => r.method === 'QR'
        ? "This link doesn't match any card. The card may not be genuine."
        : 'Check the card number on the back of the card and try again. It has 8 letters and digits, like ABCD-2345.' },
    LIMITED: { tone: 'slate', title: 'Too many checks', body: () => 'Wait a few minutes and try again.' },
};

const TONE = {
    green: { box: 'bg-emerald-50 border-emerald-200', icon: 'bg-emerald-600', title: 'text-emerald-900', body: 'text-emerald-800' },
    red: { box: 'bg-red-50 border-red-200', icon: 'bg-red-600', title: 'text-red-900', body: 'text-red-800' },
    amber: { box: 'bg-amber-50 border-amber-200', icon: 'bg-amber-500', title: 'text-amber-900', body: 'text-amber-800' },
    slate: { box: 'bg-zinc-50 border-zinc-200', icon: 'bg-zinc-500', title: 'text-zinc-900', body: 'text-zinc-700' },
};

function fmt(iso?: string | null) {
    if (!iso) return '—';
    return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
const fmtCheckedAt = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' IST';

const Tick = () => <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const Cross = () => <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>;
const Bang = () => <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M12 6v8M12 18h.01" /></svg>;

export default function VerifyView({ result, lookupValue }: { result: VerifyResult | null; lookupValue?: string }) {
    const r = result;
    const company = r?.company;
    const brand = company?.brandColor || '#1D4ED8';
    const valid = r?.state === 'VALID';
    const info = r && r.state !== 'VALID' ? STATES[r.state] : null;
    const tone = valid ? TONE.green : info ? TONE[info.tone] : null;

    return (
        <main className="min-h-dvh bg-zinc-100 px-4 py-8 text-zinc-900 [color-scheme:light] sm:py-14">
            <div className="mx-auto w-full max-w-md">
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    {/* who is answering */}
                    <header className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4" style={company ? { borderTop: `4px solid ${brand}` } : undefined}>
                        {company?.hasLogo && r?.ref ? (
                            <img src={`/api/verify/image?kind=logo&ref=${encodeURIComponent(r.ref)}`} alt="" className="h-10 w-10 shrink-0 rounded-lg object-contain" />
                        ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white" style={{ background: company ? brand : '#52525B' }}>
                                {company ? company.code.slice(0, 5) : 'ID'}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Employee ID verification</p>
                            <p className="truncate text-[15px] font-semibold text-zinc-900">{company?.legalName || 'Check an ID card'}</p>
                        </div>
                    </header>

                    <div className="space-y-5 p-5">
                        {r && tone && (
                            <div className={`flex gap-3 rounded-xl border p-4 ${tone.box}`} role="status">
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.icon}`}>
                                    {valid ? <Tick /> : info?.tone === 'red' ? <Cross /> : <Bang />}
                                </span>
                                <div>
                                    <p className={`font-semibold ${tone.title}`}>{valid ? 'Verified: current employee' : info!.title}</p>
                                    <p className={`mt-0.5 text-sm leading-relaxed ${tone.body}`}>
                                        {valid ? `This card is genuine and the holder currently works for ${company!.legalName}.` : info!.body(r)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {valid && r.holder && r.card && (
                            <>
                                <div className="flex items-center gap-4">
                                    <div className="h-[108px] w-[90px] shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-2" style={{ ['--tw-ring-color' as any]: brand }}>
                                        {r.holder.hasPhoto && <img src={`/api/verify/image?kind=photo&ref=${encodeURIComponent(r.ref!)}`} alt={`Photo of ${r.holder.name}`} className="h-full w-full object-cover" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xl font-semibold leading-tight text-zinc-900">{r.holder.name}</p>
                                        <p className="mt-1 text-sm text-zinc-600">{r.holder.designation}</p>
                                        <p className="mt-2 inline-block rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-sm font-semibold tracking-wide text-zinc-800">{r.holder.employeeCode}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-500">Check that this photo matches the person in front of you.</p>
                                <dl className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 text-sm">
                                    <Row label="Employer" value={company!.legalName} />
                                    {company!.cin && <Row label="CIN" value={company!.cin} mono />}
                                    <Row label="Joined" value={fmt(r.holder.dateOfJoining)} />
                                    <Row label="Card number" value={r.card.cardNumber} mono />
                                    <Row label="Card valid till" value={fmt(r.card.validUntil)} />
                                </dl>
                            </>
                        )}

                        {company && (company.hrEmail || company.hrPhone) && (
                            <div className="rounded-xl bg-zinc-50 p-4 text-sm">
                                <p className="font-medium text-zinc-900">{valid ? 'Need a written confirmation?' : 'Questions about this card?'}</p>
                                <p className="mt-1 text-zinc-600">Contact HR at {company.legalName}:</p>
                                <ul className="mt-2 space-y-1">
                                    {company.hrEmail && <li><a className="font-medium text-blue-700 underline-offset-2 hover:underline" href={`mailto:${company.hrEmail}`}>{company.hrEmail}</a></li>}
                                    {company.hrPhone && <li><a className="font-medium text-blue-700 underline-offset-2 hover:underline" href={`tel:${company.hrPhone.replace(/[^+\d]/g, '')}`}>{company.hrPhone}</a></li>}
                                </ul>
                            </div>
                        )}

                        {/* card number lookup: shown on the lookup page and after a failed check */}
                        {(!r || !valid) && (
                            <form method="get" action="/verify" className="space-y-2">
                                <label htmlFor="card" className="block text-sm font-medium text-zinc-800">
                                    {r ? 'Check a card number' : 'Enter the card number from the back of the ID card'}
                                </label>
                                <div className="flex gap-2">
                                    <input id="card" name="card" defaultValue={lookupValue} required autoComplete="off" autoCapitalize="characters" spellCheck={false}
                                        placeholder="ABCD-2345" maxLength={11}
                                        className="h-11 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 font-mono text-base uppercase tracking-wider text-zinc-900 placeholder:text-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20" />
                                    <button type="submit" className="h-11 shrink-0 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800">Check</button>
                                </div>
                                {!r && <p className="text-xs text-zinc-500">Or scan the QR code on the back of the card with your phone camera.</p>}
                            </form>
                        )}
                    </div>

                    <footer className="space-y-1 border-t border-zinc-100 bg-zinc-50/60 px-5 py-4 text-xs leading-relaxed text-zinc-500">
                        {r && <p>Checked {fmtCheckedAt(r.checkedAt)}.</p>}
                        <p>This page confirms employment with the company named on the card. It isn't a government identity document.</p>
                        {valid && <p><a href="/verify" className="underline underline-offset-2">Check another card</a></p>}
                    </footer>
                </div>
            </div>
        </main>
    );
}

const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
    <div className="flex justify-between gap-4 px-4 py-2.5">
        <dt className="shrink-0 text-zinc-500">{label}</dt>
        <dd className={`text-right font-medium text-zinc-900 ${mono ? 'font-mono tracking-wide' : ''}`}>{value}</dd>
    </div>
);
