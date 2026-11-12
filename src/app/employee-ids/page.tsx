"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Building2, CircleAlert, IdCard, Pencil, Search, ShieldCheck, UserX } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge, { StatusPill } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { fieldClass } from '@/components/ui/Field';
import EmploymentModal, { type CompanyLite, type EmployeeRow } from '@/components/employees/EmploymentModal';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
    { val: '', label: 'Everyone' },
    { val: 'ACTIVE', label: 'Active' },
    { val: 'ON_NOTICE', label: 'On notice' },
    { val: 'EXITED', label: 'Exited' },
];

const fmtDate = (d: string | null) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export default function EmployeeIdsPage() {
    const { data: session } = useSession();
    const me = (session?.user as any)?.id as string | undefined;
    const [rows, setRows] = useState<EmployeeRow[] | null>(null);
    const [companies, setCompanies] = useState<CompanyLite[]>([]);
    const [canManageAll, setCanManageAll] = useState(false);
    const [denied, setDenied] = useState(false);
    const [companyId, setCompanyId] = useState('');
    const [status, setStatus] = useState('');
    const [needsId, setNeedsId] = useState(false);
    const [q, setQ] = useState('');
    const [editing, setEditing] = useState<EmployeeRow | null>(null);

    const load = useCallback(async () => {
        const res = await fetch('/api/employees');
        if (res.status === 403) { setDenied(true); setRows([]); return; }
        const data = await res.json().catch(() => null);
        setRows(data?.employees || []);
        setCompanies(data?.companies || []);
        setCanManageAll(!!data?.canManageAll);
    }, []);
    useEffect(() => { load(); }, [load]);

    // filtering happens here: the whole list is a few hundred rows at most
    const shown = useMemo(() => {
        if (!rows) return [];
        const term = q.trim().toLowerCase();
        return rows.filter(r =>
            (!companyId || (companyId === 'none' ? !r.company : r.company?.id === companyId)) &&
            (!status || r.employmentStatus === status) &&
            (!needsId || (!r.employeeCode && r.employmentStatus !== 'EXITED')) &&
            (!term || [r.name, r.email, r.employeeCode, r.designation].some(v => v?.toLowerCase().includes(term)))
        );
    }, [rows, companyId, status, needsId, q]);

    const counts = useMemo(() => {
        const list = rows || [];
        const current = list.filter(r => r.employmentStatus !== 'EXITED');
        return {
            current: current.length,
            withId: current.filter(r => r.employeeCode).length,
            needsId: current.filter(r => !r.employeeCode).length,
            exited: list.length - current.length,
        };
    }, [rows]);

    const onSaved = (e: EmployeeRow) => setRows(prev => (prev || []).map(r => (r.id === e.id ? e : r)));

    if (denied) {
        return (
            <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
                <EmptyState icon={ShieldCheck} title="Employee IDs are managed by HR" description="A Director can add you as HR for a company on the Companies page." />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
            <PageHeader
                title="Employee IDs"
                description="Each person's employing company, designation and joining date. The employee ID is generated once all three are filled in."
                actions={canManageAll ? <Link href="/companies"><Button variant="secondary" leftIcon={<Building2 className="h-4 w-4" />}>Companies</Button></Link> : undefined}
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Tile label="Current staff" value={counts.current} />
                <Tile label="Have an ID" value={counts.withId} tone="text-emerald-300" />
                <Tile label="Need details" value={counts.needsId} tone={counts.needsId ? 'text-amber-300' : undefined}
                    onClick={() => { setNeedsId(true); setStatus(''); }} active={needsId} />
                <Tile label="Exited" value={counts.exited} onClick={() => { setStatus('EXITED'); setNeedsId(false); }} active={status === 'EXITED'} />
            </div>

            {/* filters */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input aria-label="Search people" className={cn(fieldClass, 'pl-9')} value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, email, ID or designation" />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                    <select aria-label="Company" className={cn(fieldClass, 'sm:w-52')} value={companyId} onChange={e => setCompanyId(e.target.value)}>
                        <option value="">All companies</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.legalName}</option>)}
                        <option value="none">Not assigned</option>
                    </select>
                    <select aria-label="Status" className={cn(fieldClass, 'sm:w-36')} value={status} onChange={e => setStatus(e.target.value)}>
                        {STATUS_FILTERS.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
                    </select>
                </div>
                {needsId && (
                    <button type="button" onClick={() => setNeedsId(false)} className="h-10 shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 text-sm text-amber-200 hover:bg-amber-500/15">
                        Needs details ✕
                    </button>
                )}
            </div>

            {!rows ? (
                <div className="space-y-2">{[0, 1, 2, 3, 4].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-[#111113]" />)}</div>
            ) : shown.length === 0 ? (
                <EmptyState icon={IdCard} title={rows.length ? 'Nobody matches these filters' : 'No employees yet'}
                    description={rows.length ? 'Try another company or status, or clear the search.' : 'People appear here once they are invited to the CRM.'} />
            ) : (
                <>
                    {/* desktop table */}
                    <div className="hidden overflow-hidden rounded-2xl border border-[#232327] bg-[#111113] lg:block">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#232327] text-left text-xs text-zinc-500">
                                    <th className="px-4 py-3 font-medium">Person</th>
                                    <th className="px-4 py-3 font-medium">Employee ID</th>
                                    <th className="px-4 py-3 font-medium">Company</th>
                                    <th className="px-4 py-3 font-medium">Designation</th>
                                    <th className="px-4 py-3 font-medium">Joined</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="w-20 px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {shown.map(r => (
                                    <tr key={r.id} className="border-b border-[#1C1C1F] last:border-0 hover:bg-[#151517]">
                                        <td className="px-4 py-3"><Person row={r} /></td>
                                        <td className="px-4 py-3"><IdCell row={r} /></td>
                                        <td className="px-4 py-3"><CompanyChip company={r.company} /></td>
                                        <td className="max-w-[200px] truncate px-4 py-3 text-zinc-300">{r.designation || <span className="text-zinc-600">—</span>}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-zinc-400">{fmtDate(r.dateOfJoining)}</td>
                                        <td className="px-4 py-3"><StatusCell row={r} /></td>
                                        <td className="px-4 py-3 text-right">
                                            <Button size="sm" variant="ghost" onClick={() => setEditing(r)} leftIcon={<Pencil className="h-3.5 w-3.5" />}>Edit</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* phone list */}
                    <div className="space-y-2 lg:hidden">
                        {shown.map(r => (
                            <button key={r.id} type="button" onClick={() => setEditing(r)}
                                className="w-full rounded-xl border border-[#232327] bg-[#111113] p-3.5 text-left active:bg-[#151517]">
                                <div className="flex items-start justify-between gap-3">
                                    <Person row={r} />
                                    <StatusCell row={r} />
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                                    <IdCell row={r} />
                                    <CompanyChip company={r.company} />
                                    {r.designation && <span className="text-zinc-400">{r.designation}</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-zinc-500">Showing {shown.length} of {rows.length}</p>
                </>
            )}

            <EmploymentModal employee={editing} onClose={() => setEditing(null)} onSaved={onSaved} selfId={me} />
        </div>
    );
}

function Tile({ label, value, tone, onClick, active }: { label: string; value: number; tone?: string; onClick?: () => void; active?: boolean }) {
    const Tag: any = onClick ? 'button' : 'div';
    return (
        <Tag type={onClick ? 'button' : undefined} onClick={onClick}
            className={cn('rounded-xl border bg-[#111113] p-4 text-left', active ? 'border-[#3A3A41]' : 'border-[#232327]', onClick && 'transition-colors hover:border-[#2F2F35]')}>
            <p className={cn('text-2xl font-semibold tabular-nums text-white', tone)}>{value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
        </Tag>
    );
}

const Person = ({ row }: { row: EmployeeRow }) => (
    <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1F1F23] text-xs font-semibold text-zinc-300">
            {row.image ? <img src={row.image} alt="" className="h-full w-full object-cover" /> : (row.name || row.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
            <p className="truncate font-medium text-zinc-100">{row.name || 'Unnamed'}</p>
            <p className="truncate text-xs text-zinc-500">{row.email}</p>
        </div>
    </div>
);

const IdCell = ({ row }: { row: EmployeeRow }) =>
    row.employeeCode ? (
        <span className="font-mono text-[13px] font-medium tracking-wide text-white">{row.employeeCode}</span>
    ) : row.employmentStatus === 'EXITED' ? (
        <span className="text-zinc-600">—</span>
    ) : (
        <span className="inline-flex items-center gap-1 text-xs text-amber-300" title={`Missing: ${row.missing.join(', ')}`}>
            <CircleAlert className="h-3.5 w-3.5 shrink-0" />{row.missing.length === 1 ? `Needs ${row.missing[0]}` : `Needs ${row.missing.length} details`}
        </span>
    );

const CompanyChip = ({ company }: { company: CompanyLite | null }) =>
    company ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300" title={company.legalName}>
            <span className="h-2 w-2 rounded-full" style={{ background: company.brandColor || '#2563EB' }} />{company.code}
        </span>
    ) : <span className="text-xs text-amber-300">Not assigned</span>;

const StatusCell = ({ row }: { row: EmployeeRow }) => (
    <span className="inline-flex items-center gap-1.5">
        <StatusPill status={row.employmentStatus} />
        {row.loginBlocked && row.employmentStatus !== 'EXITED' && (
            <Badge tone="slate" icon={<UserX className="h-3 w-3" />}>Suspended</Badge>
        )}
    </span>
);
