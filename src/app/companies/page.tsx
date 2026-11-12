"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AtSign, Building2, CheckCircle2, CircleAlert, Globe, IdCard, Pencil, Plus, Search, ShieldCheck, Users, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Modal, { ModalIcon } from '@/components/ui/Modal';
import { FieldHint, FieldLabel, fieldClass } from '@/components/ui/Field';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import ImageField from '@/components/employees/ImageField';

interface Person { id: string; name: string | null; email: string }
interface Company {
    id: string; code: string; legalName: string; cin: string | null; gstin: string | null;
    registeredAddress: string | null; officeAddress: string | null; website: string | null;
    hrEmail: string | null; hrPhone: string | null; brandColor: string | null;
    signatoryName: string | null; signatoryTitle: string | null;
    logoUrl: string | null; signatureUrl: string | null; cardValidityMonths: number;
    emailDomains: string[]; verifyDomain: string | null; isActive: boolean;
    idsIssued: number; hrUsers: Person[];
    staff: { active: number; exited: number; missingId: number };
}

const DEFAULT_COLOR = '#2563EB';

// what has to be filled in before this company's ID cards can be printed
// (the same rule the server applies before printing)
const cardGaps = (c: Company) => [
    !c.cin && 'CIN',
    !c.registeredAddress && 'Registered address',
    !c.hrEmail && !c.hrPhone && 'HR email or phone',
    !c.signatoryName && 'Signatory',
    !c.verifyDomain && 'Verification address',
].filter(Boolean) as string[];
// not required, but the card looks unfinished without them
const cardExtras = (c: Company) => [!c.logoUrl && 'logo', !c.signatureUrl && 'signature image'].filter(Boolean) as string[];

const emptyForm = {
    code: '', legalName: '', cin: '', gstin: '', registeredAddress: '', officeAddress: '', website: '',
    hrEmail: '', hrPhone: '', brandColor: DEFAULT_COLOR, signatoryName: '', signatoryTitle: '',
    emailDomains: '', verifyDomain: '', isActive: true, hrUserIds: [] as string[], cardValidityMonths: 24,
};
type Form = typeof emptyForm;

export default function CompaniesPage() {
    const { showToast } = useToast();
    const [companies, setCompanies] = useState<Company[] | null>(null);
    const [canEdit, setCanEdit] = useState(false);
    const [denied, setDenied] = useState(false);
    const [editing, setEditing] = useState<Company | 'new' | null>(null);

    const load = useCallback(async () => {
        const res = await fetch('/api/companies');
        if (res.status === 403) { setDenied(true); setCompanies([]); return; }
        const data = await res.json().catch(() => null);
        setCompanies(data?.companies || []);
        setCanEdit(!!data?.canEdit);
    }, []);
    useEffect(() => { load(); }, [load]);

    if (denied) {
        return (
            <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
                <EmptyState icon={ShieldCheck} title="Companies are managed by Directors and HR" description="Ask a Director if you need access." />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
            <PageHeader
                title="Companies"
                description="The legal entities whose staff use the CRM. Their details appear on employee ID cards, verification pages and letters."
                actions={<>
                    <Link href="/employee-ids"><Button variant="secondary" leftIcon={<IdCard className="h-4 w-4" />}>Employee IDs</Button></Link>
                    {canEdit && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing('new')}>Add company</Button>}
                </>}
            />

            {!companies ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[0, 1, 2, 3].map(i => <div key={i} className="h-56 animate-pulse rounded-2xl bg-[#111113]" />)}
                </div>
            ) : companies.length === 0 ? (
                <EmptyState icon={Building2} title="Add your first company" description="Each legal entity gets its own employee ID prefix and card details."
                    action={canEdit ? <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing('new')}>Add company</Button> : undefined} />
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {companies.map(c => <CompanyCard key={c.id} company={c} canEdit={canEdit} onEdit={() => setEditing(c)} />)}
                </div>
            )}

            {canEdit && (
                <CompanyModal
                    company={editing}
                    onClose={() => { setEditing(null); load(); }}
                    onSaved={(msg) => { showToast(msg, 'success'); setEditing(null); load(); }}
                />
            )}
        </div>
    );
}

function CompanyCard({ company: c, canEdit, onEdit }: { company: Company; canEdit: boolean; onEdit: () => void }) {
    const gaps = cardGaps(c);
    const extras = cardExtras(c);
    const color = c.brandColor || DEFAULT_COLOR;
    return (
        <Card padding="none" className={cn('flex flex-col overflow-hidden', !c.isActive && 'opacity-70')}>
            <div className="h-1" style={{ background: color }} />
            <div className="flex items-start gap-3 p-5 pb-4">
                {c.logoUrl ? (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1"><img src={c.logoUrl} alt="" className="h-full w-full object-contain" /></div>
                ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold tracking-wide text-white" style={{ background: color }}>
                        {c.code.slice(0, 5)}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[15px] font-semibold leading-snug text-white">{c.legalName}</h2>
                        {!c.isActive && <Badge tone="slate">Inactive</Badge>}
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-zinc-500">IDs: {c.code}-YYYY-NNNN</p>
                </div>
                {canEdit && <Button size="sm" variant="ghost" onClick={onEdit} leftIcon={<Pencil className="h-3.5 w-3.5" />}>Edit</Button>}
            </div>

            <div className="grid grid-cols-3 border-y border-[#232327] text-center">
                <Stat value={c.staff.active} label="Active staff" />
                <Stat value={c.idsIssued} label="IDs issued" />
                <Stat value={c.staff.missingId} label="Need an ID" warn={c.staff.missingId > 0} />
            </div>

            <div className="flex-1 space-y-2.5 p-5 text-sm">
                <Row icon={AtSign} label="Sign-in">
                    {c.emailDomains.length ? c.emailDomains.map(d => <span key={d} className="mr-1.5 rounded-md bg-[#18181B] px-1.5 py-0.5 font-mono text-xs text-zinc-300">@{d}</span>)
                        : <span className="text-zinc-500">No email domain yet</span>}
                </Row>
                <Row icon={Globe} label="Verify at">
                    {c.verifyDomain ? <span className="font-mono text-xs text-zinc-300">{c.verifyDomain}</span> : <span className="text-zinc-500">Not set</span>}
                </Row>
                <Row icon={Users} label="HR">
                    {c.hrUsers.length ? c.hrUsers.map(u => u.name || u.email).join(', ') : <span className="text-zinc-500">Directors only</span>}
                </Row>
            </div>

            <div className={cn('flex items-start gap-2 border-t border-[#232327] px-5 py-3 text-xs', gaps.length ? 'text-amber-300' : 'text-emerald-300')}>
                {gaps.length ? <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" /> : <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" />}
                <span>{gaps.length ? `Needed for ID cards: ${gaps.join(', ')}` : extras.length ? `Ready for ID cards. Recommended: add the ${extras.join(' and ')}.` : 'Ready for ID cards'}</span>
            </div>
        </Card>
    );
}

const Stat = ({ value, label, warn }: { value: number; label: string; warn?: boolean }) => (
    <div className="px-2 py-3 [&:not(:last-child)]:border-r [&:not(:last-child)]:border-[#232327]">
        <p className={cn('text-lg font-semibold tabular-nums', warn ? 'text-amber-300' : 'text-white')}>{value}</p>
        <p className="text-[11px] text-zinc-500">{label}</p>
    </div>
);

const Row = ({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
        <span className="w-16 shrink-0 text-zinc-500">{label}</span>
        <div className="min-w-0 flex-1 break-words text-zinc-300">{children}</div>
    </div>
);

function CompanyModal({ company, onClose, onSaved }: { company: Company | 'new' | null; onClose: () => void; onSaved: (msg: string) => void }) {
    const isNew = company === 'new';
    const existing = company && company !== 'new' ? company : null;
    const [form, setForm] = useState<Form>(emptyForm);
    const [people, setPeople] = useState<Person[]>([]);
    const [hrSearch, setHrSearch] = useState('');
    const [images, setImages] = useState<{ logoUrl: string | null; signatureUrl: string | null }>({ logoUrl: null, signatureUrl: null });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!company) return;
        setError('');
        setHrSearch('');
        setImages({ logoUrl: existing?.logoUrl ?? null, signatureUrl: existing?.signatureUrl ?? null });
        setForm(existing ? {
            code: existing.code, legalName: existing.legalName, cin: existing.cin || '', gstin: existing.gstin || '',
            registeredAddress: existing.registeredAddress || '', officeAddress: existing.officeAddress || '',
            website: existing.website || '', hrEmail: existing.hrEmail || '', hrPhone: existing.hrPhone || '',
            brandColor: existing.brandColor || DEFAULT_COLOR, signatoryName: existing.signatoryName || '',
            signatoryTitle: existing.signatoryTitle || '', emailDomains: existing.emailDomains.join(', '), cardValidityMonths: existing.cardValidityMonths,
            verifyDomain: existing.verifyDomain || '', isActive: existing.isActive, hrUserIds: existing.hrUsers.map(u => u.id),
        } : emptyForm);
        if (!people.length) {
            fetch('/api/team').then(r => (r.ok ? r.json() : [])).then(d => {
                const list: any[] = Array.isArray(d) ? d : d?.users || [];
                setPeople(list.map(u => ({ id: u.id, name: u.name, email: u.email })).sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email)));
            }).catch(() => {});
        }
    }, [company]); // eslint-disable-line react-hooks/exhaustive-deps

    const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));
    const codeLocked = !!existing && existing.idsIssued > 0;
    const firstDomain = form.emailDomains.split(/[\s,]+/).map(d => d.replace(/^@/, '').trim()).find(Boolean);

    const hrMatches = useMemo(() => {
        const q = hrSearch.trim().toLowerCase();
        if (!q) return [];
        return people.filter(p => !form.hrUserIds.includes(p.id) && `${p.name} ${p.email}`.toLowerCase().includes(q)).slice(0, 6);
    }, [hrSearch, people, form.hrUserIds]);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = { ...form, emailDomains: form.emailDomains.split(/[\s,]+/).filter(Boolean) };
            const res = await fetch(isNew ? '/api/companies' : `/api/companies/${existing!.id}`, {
                method: isNew ? 'POST' : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) return setError(data.error || "Couldn't save. Try again.");
            onSaved(isNew ? `${data.company.legalName} added` : 'Company saved');
        } catch {
            setError("Couldn't reach the server. Check your connection and try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={!!company}
            onClose={onClose}
            size="lg"
            title={isNew ? 'Add a company' : 'Edit company'}
            description={isNew ? 'A legal entity whose staff use the CRM.' : existing?.legalName}
            icon={<ModalIcon><Building2 /></ModalIcon>}
            onSubmit={save}
            closeOnBackdrop={false}
            footer={<>
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" isLoading={saving}>{isNew ? 'Add company' : 'Save changes'}</Button>
            </>}
        >
            <div className="space-y-7">
                <Section title="Identity">
                    <div>
                        <FieldLabel htmlFor="co-name" required>Legal name</FieldLabel>
                        <input id="co-name" className={fieldClass} value={form.legalName} onChange={e => set('legalName', e.target.value)} placeholder="Freedom Global Sports Network Private Limited" maxLength={200} />
                        <FieldHint>Exactly as registered with the Ministry of Corporate Affairs.</FieldHint>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                        <div>
                            <FieldLabel htmlFor="co-code" required>Short code</FieldLabel>
                            <input id="co-code" className={cn(fieldClass, 'font-mono uppercase')} value={form.code} disabled={codeLocked}
                                onChange={e => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))} placeholder="FGSN" />
                            <FieldHint>{codeLocked ? "Fixed: IDs with this code have been issued." : `Employee IDs will look like ${form.code || 'CODE'}-${new Date().getFullYear()}-0001.`}</FieldHint>
                        </div>
                        <div>
                            <FieldLabel htmlFor="co-color">Brand colour</FieldLabel>
                            <div className="flex items-center gap-2">
                                <input id="co-color" type="color" value={form.brandColor} onChange={e => set('brandColor', e.target.value.toUpperCase())}
                                    className="h-10 w-12 cursor-pointer rounded-lg border border-[#2F2F35] bg-[#18181B] p-1" />
                                <input aria-label="Brand colour hex" className={cn(fieldClass, 'w-28 font-mono')} value={form.brandColor} maxLength={7}
                                    onChange={e => set('brandColor', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </Section>

                <Section title="Registration">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel htmlFor="co-cin">CIN</FieldLabel>
                            <input id="co-cin" className={cn(fieldClass, 'font-mono uppercase')} value={form.cin} maxLength={21} onChange={e => set('cin', e.target.value.toUpperCase())} placeholder="U74999DL2020PTC123456" />
                        </div>
                        <div>
                            <FieldLabel htmlFor="co-gstin">GSTIN</FieldLabel>
                            <input id="co-gstin" className={cn(fieldClass, 'font-mono uppercase')} value={form.gstin} maxLength={15} onChange={e => set('gstin', e.target.value.toUpperCase())} placeholder="07AABCU9603R1ZM" />
                        </div>
                    </div>
                    <div>
                        <FieldLabel htmlFor="co-reg">Registered office address</FieldLabel>
                        <textarea id="co-reg" rows={2} className={cn(fieldClass, 'h-auto py-2.5')} value={form.registeredAddress} maxLength={500} onChange={e => set('registeredAddress', e.target.value)} />
                    </div>
                    <div>
                        <FieldLabel htmlFor="co-office">Office address, if different</FieldLabel>
                        <textarea id="co-office" rows={2} className={cn(fieldClass, 'h-auto py-2.5')} value={form.officeAddress} maxLength={500} onChange={e => set('officeAddress', e.target.value)} />
                    </div>
                </Section>

                <Section title="Contact for verification">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel htmlFor="co-hremail">HR email</FieldLabel>
                            <input id="co-hremail" type="email" className={fieldClass} value={form.hrEmail} onChange={e => set('hrEmail', e.target.value)} placeholder={`hr@${firstDomain || 'company.com'}`} />
                        </div>
                        <div>
                            <FieldLabel htmlFor="co-hrphone">HR phone</FieldLabel>
                            <input id="co-hrphone" type="tel" className={fieldClass} value={form.hrPhone} maxLength={20} onChange={e => set('hrPhone', e.target.value)} placeholder="+91 98765 43210" />
                        </div>
                    </div>
                    <div>
                        <FieldLabel htmlFor="co-web">Website</FieldLabel>
                        <input id="co-web" className={fieldClass} value={form.website} onChange={e => set('website', e.target.value)} placeholder={`www.${firstDomain || 'company.com'}`} />
                    </div>
                </Section>

                <Section title="Logo, signature and cards" hint={isNew ? 'Add the logo and signature after saving the company.' : 'Saved as soon as you upload them.'}>
                    {existing && (
                        <div className="grid gap-5 sm:grid-cols-2">
                            <ImageField kind="LOGO" targetId={existing.id} url={images.logoUrl} label="Logo"
                                hint="PNG with a transparent background works best." onChange={u => setImages(i => ({ ...i, logoUrl: u }))} />
                            <ImageField kind="SIGNATURE" targetId={existing.id} url={images.signatureUrl} label="Signature"
                                hint="Sign in dark ink on white paper and photograph it; the background is removed." onChange={u => setImages(i => ({ ...i, signatureUrl: u }))} />
                        </div>
                    )}
                    <div className="sm:w-1/2">
                        <FieldLabel htmlFor="co-validity">New cards are valid for</FieldLabel>
                        <select id="co-validity" className={fieldClass} value={form.cardValidityMonths} onChange={e => set('cardValidityMonths', Number(e.target.value))}>
                            <option value={12}>1 year</option>
                            <option value={24}>2 years</option>
                            <option value={36}>3 years</option>
                            <option value={60}>5 years</option>
                        </select>
                    </div>
                </Section>

                <Section title="Authorised signatory" hint="Their name and title are printed under the signature on ID cards and letters.">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <FieldLabel htmlFor="co-sig">Name</FieldLabel>
                            <input id="co-sig" className={fieldClass} value={form.signatoryName} maxLength={120} onChange={e => set('signatoryName', e.target.value)} />
                        </div>
                        <div>
                            <FieldLabel htmlFor="co-sigt">Title</FieldLabel>
                            <input id="co-sigt" className={fieldClass} value={form.signatoryTitle} maxLength={120} onChange={e => set('signatoryTitle', e.target.value)} placeholder="Director" />
                        </div>
                    </div>
                </Section>

                <Section title="Sign-in and verification">
                    <div>
                        <FieldLabel htmlFor="co-domains">Email domains</FieldLabel>
                        <input id="co-domains" className={cn(fieldClass, 'font-mono')} value={form.emailDomains} onChange={e => set('emailDomains', e.target.value)} placeholder="fgsnlive.com" />
                        <FieldHint>People with these email addresses can be invited and can sign in. Separate several with commas.</FieldHint>
                    </div>
                    <div>
                        <FieldLabel htmlFor="co-verify">Verification address</FieldLabel>
                        <input id="co-verify" className={cn(fieldClass, 'font-mono')} value={form.verifyDomain} onChange={e => set('verifyDomain', e.target.value)}
                            placeholder={firstDomain ? `verify.${firstDomain}` : 'verify.company.com'} />
                        <FieldHint>Printed in the QR code on ID cards. Set it once its domain record points to the CRM server, and keep it for as long as cards with it exist.</FieldHint>
                    </div>
                </Section>

                <Section title="HR people" hint="They can fill in employee details, generate IDs and mark people as exited for this company. Directors can always do this.">
                    {form.hrUserIds.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {form.hrUserIds.map(id => {
                                const p = people.find(x => x.id === id) || existing?.hrUsers.find(x => x.id === id);
                                return (
                                    <span key={id} className="inline-flex items-center gap-1.5 rounded-lg border border-[#2F2F35] bg-[#18181B] py-1 pl-2.5 pr-1 text-sm text-zinc-200">
                                        {p?.name || p?.email || 'Unknown'}
                                        <button type="button" aria-label={`Remove ${p?.name || 'person'}`} onClick={() => set('hrUserIds', form.hrUserIds.filter(x => x !== id))}
                                            className="rounded p-0.5 text-zinc-500 hover:bg-[#2F2F35] hover:text-white"><X className="h-3.5 w-3.5" /></button>
                                    </span>
                                );
                            })}
                        </div>
                    )}
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input aria-label="Find someone to add as HR" className={cn(fieldClass, 'pl-9')} value={hrSearch} onChange={e => setHrSearch(e.target.value)} placeholder="Search people by name or email" />
                    </div>
                    {hrMatches.length > 0 && (
                        <div className="overflow-hidden rounded-lg border border-[#232327]">
                            {hrMatches.map(p => (
                                <button key={p.id} type="button" onClick={() => { set('hrUserIds', [...form.hrUserIds, p.id]); setHrSearch(''); }}
                                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-[#18181B] [&:not(:last-child)]:border-b [&:not(:last-child)]:border-[#232327]">
                                    <span className="truncate text-zinc-200">{p.name || p.email}<span className="ml-2 text-xs text-zinc-500">{p.email}</span></span>
                                    <Plus className="h-4 w-4 shrink-0 text-zinc-500" />
                                </button>
                            ))}
                        </div>
                    )}
                </Section>

                {!isNew && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#232327] p-3.5">
                        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-blue-500" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
                        <span className="text-sm">
                            <span className="font-medium text-zinc-200">Active</span>
                            <span className="block text-zinc-500">Turn off if the company closes or merges. No new IDs can be issued and its email domains stop working for sign-in. Cards already issued keep verifying, with their real status.</span>
                        </span>
                    </label>
                )}

                {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
            </div>
        </Modal>
    );
}

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
    <section className="space-y-4">
        <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
        </div>
        {children}
    </section>
);
