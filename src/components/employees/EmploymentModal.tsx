"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BadgeCheck, IdCard, Info, Loader2 } from 'lucide-react';
import Modal, { ModalIcon } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { FieldHint, FieldLabel, fieldClass } from '@/components/ui/Field';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import ImageField from '@/components/employees/ImageField';
import CardHistory from '@/components/employees/CardHistory';

export interface CompanyLite { id: string; code: string; legalName: string; isActive: boolean; brandColor?: string | null }

export interface EmployeeRow {
    id: string;
    name: string | null;
    email: string;
    role: string;
    department?: string | null;
    image?: string | null;
    company: CompanyLite | null;
    employeeCode: string | null;
    designation: string | null;
    dateOfJoining: string | null;
    employmentStatus: 'ACTIVE' | 'ON_NOTICE' | 'EXITED';
    exitDate: string | null;
    loginBlocked: boolean;
    missing: string[];
    photoUrl: string | null;
    card: { cardNumber: string; issuedAt: string; validUntil: string | null } | null;
    cardBlockers: string[];
}

const STATUSES = [
    { val: 'ACTIVE', label: 'Active', active: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
    { val: 'ON_NOTICE', label: 'On notice', active: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
    { val: 'EXITED', label: 'Exited', active: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
] as const;

const today = () => new Date().toISOString().slice(0, 10);

interface Props {
    employee: EmployeeRow | null;
    onClose: () => void;
    onSaved: (e: EmployeeRow) => void;
    /** the viewer's own id: nobody can mark themselves as exited */
    selfId?: string;
}

/** Edit someone's employment record: employing company, designation, joining date and status. */
export default function EmploymentModal({ employee, onClose, onSaved, selfId }: Props) {
    const { showToast } = useToast();
    const [companies, setCompanies] = useState<CompanyLite[] | null>(null);
    const [companyId, setCompanyId] = useState('');
    const [designation, setDesignation] = useState('');
    const [fullName, setFullName] = useState('');
    const [joining, setJoining] = useState('');
    const [status, setStatus] = useState<EmployeeRow['employmentStatus']>('ACTIVE');
    const [exitDate, setExitDate] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!employee) return;
        setCompanyId(employee.company?.id || '');
        setDesignation(employee.designation || '');
        setFullName(employee.name || '');
        setJoining(employee.dateOfJoining || '');
        setStatus(employee.employmentStatus);
        setExitDate(employee.exitDate || '');
        setPhotoUrl(employee.photoUrl);
        setError('');
        if (!companies) {
            fetch('/api/companies').then(r => (r.ok ? r.json() : null)).then(d => setCompanies(d?.companies || [])).catch(() => setCompanies([]));
        }
        // reset only when another person is opened, so a photo upload doesn't wipe unsaved edits
    }, [employee?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const chosen = companies?.find(c => c.id === companyId) || (employee?.company?.id === companyId ? employee.company : null);
    const companyChanged = !!employee && (employee.company?.id || '') !== companyId;
    const willIssue = !!companyId && designation.trim().length >= 2 && !!joining && (!employee?.employeeCode || companyChanged);
    const previewCode = useMemo(() => (willIssue && chosen ? `${chosen.code}-${joining.slice(0, 4)}-····` : null), [willIssue, chosen, joining]);
    const exiting = status === 'EXITED' && employee?.employmentStatus !== 'EXITED';
    const returning = status !== 'EXITED' && employee?.employmentStatus === 'EXITED';
    const isSelf = !!employee && employee.id === selfId;

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employee) return;
        if (!companyId) return setError('Choose the company that employs this person.');
        if (status === 'EXITED' && !exitDate) return setError('Enter the last working day.');
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`/api/employees/${employee.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...(isSelf ? {} : { name: fullName.trim() }),
                    companyId, designation: designation.trim(), dateOfJoining: joining || null,
                    employmentStatus: status, exitDate: status === 'ACTIVE' ? null : exitDate || null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) return setError(data.error || "Couldn't save. Try again.");
            showToast(
                data.issued ? `Employee ID ${data.issued} generated` : exiting ? `${employee.name || employee.email} marked as exited` : 'Employment details saved',
                'success'
            );
            onSaved({ ...data.employee, photoUrl });
            onClose();
        } catch {
            setError("Couldn't reach the server. Check your connection and try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={!!employee}
            onClose={onClose}
            size="md"
            title="Employment details"
            description={employee ? `${employee.name || 'Unnamed'} · ${employee.email}` : undefined}
            icon={<ModalIcon><IdCard /></ModalIcon>}
            onSubmit={save}
            footer={<>
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" variant={exiting ? 'danger' : 'primary'} isLoading={saving}>
                    {exiting ? 'Mark as exited' : willIssue ? 'Save and generate ID' : 'Save'}
                </Button>
            </>}
        >
            {employee && (
                <div className="space-y-5">
                    {/* current ID, or what will happen to it */}
                    <div className="flex items-start gap-3 rounded-xl border border-[#232327] bg-[#18181B] p-3.5">
                        <BadgeCheck className={cn('mt-0.5 h-5 w-5 shrink-0', employee.employeeCode && !companyChanged ? 'text-emerald-400' : 'text-zinc-500')} />
                        <div className="min-w-0 text-sm">
                            {employee.employeeCode && !companyChanged ? (
                                <><p className="text-zinc-400">Employee ID</p><p className="font-mono text-base font-semibold tracking-wide text-white">{employee.employeeCode}</p></>
                            ) : previewCode ? (
                                <><p className="text-zinc-400">Saving generates the ID</p><p className="font-mono text-base font-semibold tracking-wide text-white">{previewCode}</p></>
                            ) : (
                                <p className="text-zinc-400">The employee ID is generated once company, designation and joining date are filled in.</p>
                            )}
                            {employee.employeeCode && companyChanged && (
                                <p className="mt-1 text-xs text-amber-300">Moving to another company gives them a new ID. {employee.employeeCode} stops being used.</p>
                            )}
                        </div>
                    </div>

                    <ImageField
                        kind="PHOTO"
                        targetId={employee.id}
                        url={photoUrl}
                        label="ID card photo"
                        hint="A recent passport-style photo: face clearly visible, plain background. Saved as soon as you confirm it."
                        onChange={url => { setPhotoUrl(url); onSaved({ ...employee, photoUrl: url, cardBlockers: url ? employee.cardBlockers.filter(b => b !== 'photo') : Array.from(new Set([...employee.cardBlockers, 'photo'])) }); }}
                    />

                    <div>
                        <FieldLabel htmlFor="emp-name" required>Full name</FieldLabel>
                        <input id="emp-name" className={fieldClass} value={fullName} maxLength={80} disabled={isSelf}
                            onChange={e => setFullName(e.target.value)} placeholder="As on their government ID" />
                        <FieldHint>{isSelf ? "You can't change your own name. Ask HR or another Director." : 'Their official name, as on their government ID. Printed on new ID cards; already printed cards keep the old one.'}</FieldHint>
                    </div>

                    <div>
                        <FieldLabel htmlFor="emp-company" required>Employing company</FieldLabel>
                        <select id="emp-company" className={fieldClass} value={companyId} onChange={e => setCompanyId(e.target.value)} disabled={!companies}>
                            <option value="">{companies ? 'Choose a company' : 'Loading companies…'}</option>
                            {(companies || []).filter(c => c.isActive || c.id === employee.company?.id).map(c => (
                                <option key={c.id} value={c.id}>{c.legalName} ({c.code})</option>
                            ))}
                        </select>
                        <FieldHint>The legal entity whose payroll they are on. It's printed on their ID card.</FieldHint>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel htmlFor="emp-designation" required>Designation</FieldLabel>
                            <input id="emp-designation" className={fieldClass} value={designation} maxLength={80}
                                onChange={e => setDesignation(e.target.value)} placeholder="Senior associate, partnerships" />
                        </div>
                        <div>
                            <FieldLabel htmlFor="emp-joining" required>Date of joining</FieldLabel>
                            <input id="emp-joining" type="date" className={fieldClass} value={joining} onChange={e => setJoining(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <FieldLabel>Status</FieldLabel>
                        <div role="radiogroup" aria-label="Employment status" className="grid grid-cols-3 gap-1.5">
                            {STATUSES.map(s => {
                                const blocked = s.val === 'EXITED' && isSelf && employee.employmentStatus !== 'EXITED';
                                return (
                                    <button key={s.val} type="button" role="radio" aria-checked={status === s.val} disabled={blocked}
                                        title={blocked ? "You can't mark yourself as exited" : undefined}
                                        onClick={() => { setStatus(s.val); if (s.val === 'EXITED' && !exitDate) setExitDate(today()); }}
                                        className={cn('h-9 rounded-lg border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                                            status === s.val ? s.active : 'border-[#2F2F35] bg-[#18181B] text-zinc-400 hover:text-zinc-200')}>
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {status !== 'ACTIVE' && (
                        <div>
                            <FieldLabel htmlFor="emp-exit" required={status === 'EXITED'}>Last working day</FieldLabel>
                            <input id="emp-exit" type="date" className={fieldClass} value={exitDate} min={joining || undefined} onChange={e => setExitDate(e.target.value)} />
                        </div>
                    )}

                    {exiting && (
                        <div className="flex gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/[0.07] p-3.5 text-sm text-rose-200">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                            <p>They won't be able to sign in any more, and their ID card will show as no longer valid. Their tasks, reports and history stay. You can mark them active again later.</p>
                        </div>
                    )}
                    {returning && (
                        <div className="flex gap-2.5 rounded-xl border border-blue-500/25 bg-blue-500/[0.07] p-3.5 text-sm text-blue-200">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                            <p>Marking them active again lets them sign in again.</p>
                        </div>
                    )}

                    {employee.employeeCode && (
                        <div className="border-t border-[#232327] pt-5">
                            <FieldLabel>ID cards</FieldLabel>
                            <CardHistory userId={employee.id} onChanged={() => onSaved({ ...employee, photoUrl, card: null })} />
                        </div>
                    )}

                    {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
                    {!companies && <p className="flex items-center gap-2 text-xs text-zinc-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading companies…</p>}
                </div>
            )}
        </Modal>
    );
}
