"use client";

import React, { useEffect, useState } from 'react';
import { IdCard, Info, ScanLine } from 'lucide-react';
import type { CardPayload } from '@/lib/idCards';
import CardViewer, { type CardState, CardStateBadge } from '@/components/employees/CardViewer';

interface Mine {
    employee: {
        employeeCode: string | null; designation: string | null; dateOfJoining: string | null; employmentStatus: string; hasPhoto: boolean;
        company: { legalName: string; code: string; hrEmail: string | null } | null;
    };
    state: CardState | null;
    card: CardPayload | null;
}

const fmt = (iso: string | null | undefined) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');

/** "My ID card" on the profile page: the person's own card and employment details, view only. */
export default function MyIdCard() {
    const [data, setData] = useState<Mine | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        fetch('/api/id-cards/mine').then(r => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setFailed(true));
    }, []);

    if (failed) return null;
    const e = data?.employee;
    const missing = e ? [!e.company && 'company', !e.designation && 'designation', !e.dateOfJoining && 'joining date', !e.hasPhoto && 'photo'].filter(Boolean) as string[] : [];

    return (
        <section className="overflow-hidden rounded-2xl border border-[#232327] bg-[#111113]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#232327] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20"><IdCard className="h-[18px] w-[18px]" /></span>
                    <div>
                        <h2 className="text-[15px] font-semibold text-white">My ID card</h2>
                        <p className="text-xs text-zinc-500">{e?.company?.legalName || 'Your employee ID and card'}</p>
                    </div>
                </div>
                {data?.state && <CardStateBadge state={data.state} />}
            </div>

            {!data ? (
                <div className="h-48 animate-pulse bg-[#141416]" />
            ) : data.card ? (
                <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[auto_1fr] lg:items-center">
                    <div className="rounded-2xl bg-[#18181B] p-4 sm:p-5"><CardViewer card={data.card} /></div>
                    <div className="space-y-5">
                        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
                            <Item label="Employee ID" value={<span className="font-mono font-semibold tracking-wide text-white">{data.card.employeeCode}</span>} />
                            <Item label="Card number" value={<span className="font-mono tracking-wide">{data.card.cardNumber}</span>} />
                            <Item label="Issued" value={fmt(data.card.issuedAt)} />
                            <Item label="Valid till" value={fmt(data.card.validUntil)} />
                        </dl>
                        <div className="flex gap-3 rounded-xl border border-[#232327] bg-[#141416] p-3.5 text-sm text-zinc-400">
                            <ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                            <p>Anyone who needs to check your employment, like a landlord or a bank, can scan the QR code on the back of your card. They'll see your photo, name, designation and that you work here.</p>
                        </div>
                        {data.state !== 'VALID' && (
                            <p className="flex gap-2 text-sm text-amber-300"><Info className="mt-0.5 h-4 w-4 shrink-0" />This card won't verify as valid. Contact HR{e?.company?.hrEmail ? ` at ${e.company.hrEmail}` : ''} for a new one.</p>
                        )}
                        <p className="text-xs text-zinc-500">If you lose your card, tell HR straight away so they can cancel it.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 p-5 sm:p-6">
                    <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm sm:grid-cols-4">
                        <Item label="Employee ID" value={e?.employeeCode ? <span className="font-mono font-semibold tracking-wide text-white">{e.employeeCode}</span> : 'Not issued yet'} />
                        <Item label="Company" value={e?.company?.code || '—'} />
                        <Item label="Designation" value={e?.designation || '—'} />
                        <Item label="Joined" value={fmt(e?.dateOfJoining)} />
                    </dl>
                    <p className="flex gap-2 rounded-xl border border-[#232327] bg-[#141416] p-3.5 text-sm text-zinc-400">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                        {missing.length
                            ? `HR hasn't finished your details yet (missing: ${missing.join(', ')}). Your card can be printed once they're filled in.`
                            : "Your details are complete. HR hasn't printed your card yet."}
                    </p>
                </div>
            )}
        </section>
    );
}

const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <dt className="text-xs text-zinc-500">{label}</dt>
        <dd className="mt-0.5 text-zinc-200">{value}</dd>
    </div>
);
