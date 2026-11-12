"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { formatDistanceToNowStrict } from 'date-fns';
import {
    BadgeCheck, Building2, CalendarDays, Check, Clock, Eye, EyeOff, KeyRound, Layers, LogOut, Mail, ShieldCheck, UserRound, Users,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { FieldHint, FieldLabel, fieldClass } from '@/components/ui/Field';
import { humanize, roleTone } from '@/components/ui/tones';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import MyIdCard from '@/components/employees/MyIdCard';

interface Me {
    id: string; name: string | null; email: string; role: string; image: string | null; department: string | null;
    createdAt: string; lastLogin: string | null; hasPassword: boolean; googleLinked: boolean; teamSize: number;
    company: { legalName: string; code: string; brandColor: string | null } | null;
    memberSpaces: { id: string; name: string; color: string }[];
    reportingManagers: { id: string; name: string | null; email: string; role: string; image: string | null }[];
    hrCompanies: { code: string; legalName: string }[];
}

// What each role can do, in plain words (kept in step with the app's real permissions).
const ROLE_ABILITIES: Record<string, string[]> = {
    DIRECTOR: ['See and manage every company, department, project and person', 'Add companies, issue employee IDs and print ID cards', 'Mark holidays and manage users and roles', 'See every report and export it'],
    MANAGEMENT: ['See every team, project and report, read-only', 'Follow performance and daily report compliance', 'Export reports'],
    MANAGER: ['Run your departments: projects, milestones and tasks', "Review your team's daily reports and performance", 'Invite people to your departments'],
    TEAM_LEADER: ['Assign and review tasks for the people who report to you', "See your team's daily reports", 'Work on your own tasks and milestones'],
    EMPLOYEE: ['Work on the tasks and milestones assigned to you', 'Submit your daily report every working day', 'Raise issues and join meetings'],
    INTERN: ['Work on the tasks assigned to you', 'Submit your daily report every working day', 'Raise issues and join meetings'],
};

const monthYear = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
/** "Just now", "5 min ago", "3 hours ago", "2 days ago": short enough for a phone */
function sinceShort(iso: string) {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const { showToast } = useToast();
    const [me, setMe] = useState<Me | null>(null);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [nameError, setNameError] = useState('');

    const load = useCallback(async () => {
        const res = await fetch('/api/me');
        if (!res.ok) return;
        const data: Me = await res.json();
        setMe(data);
        setName(data.name || '');
    }, []);
    useEffect(() => { load(); }, [load]);

    const role = me?.role || (session?.user as any)?.role || 'EMPLOYEE';
    const displayName = me?.name || session?.user?.name || 'Your profile';
    const nameChanged = !!me && name.trim().replace(/\s+/g, ' ') !== (me.name || '');

    const saveName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nameChanged) return;
        setSaving(true);
        setNameError('');
        const res = await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
        const data = await res.json().catch(() => ({}));
        setSaving(false);
        if (!res.ok) return setNameError(data.error || "Couldn't save your name. Try again.");
        setMe(m => (m ? { ...m, name: data.name } : m));
        setName(data.name);
        await update({ name: data.name });
        showToast('Name updated', 'success');
    };

    const abilities = useMemo(() => {
        const list = [...(ROLE_ABILITIES[role] || ROLE_ABILITIES.EMPLOYEE)];
        if (me?.hrCompanies.length && role !== 'DIRECTOR') list.push(`Act as HR for ${me.hrCompanies.map(c => c.code).join(', ')}: employee IDs and ID cards`);
        return list;
    }, [role, me]);

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
            <PageHeader
                title="Your profile"
                description="Your details, ID card, work setup and sign-in."
                actions={<Button variant="ghost" leftIcon={<LogOut className="h-4 w-4" />} onClick={() => signOut({ callbackUrl: '/login' })}>Sign out</Button>}
            />

            {/* ---------- identity ---------- */}
            <section className="overflow-hidden rounded-2xl border border-[#232327] bg-[#111113]">
                <div className="h-20 border-b border-[#232327] sm:h-24" style={{ background: me?.company?.brandColor ? `${me.company.brandColor}2E` : '#16161A' }} />
                <div className="-mt-10 flex flex-col gap-5 px-5 pb-6 sm:-mt-12 sm:flex-row sm:items-end sm:px-6">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-4 ring-[#111113] sm:h-24 sm:w-24">
                        <Avatar src={me?.image || session?.user?.image} alt={displayName} fallback={initialsOf(displayName)} className="h-full w-full rounded-2xl text-2xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-2xl font-semibold tracking-tight text-white">{displayName}</h2>
                            <Badge tone={roleTone(role)}>{humanize(role)}</Badge>
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400"><Mail className="h-3.5 w-3.5" />{me?.email || session?.user?.email}</p>
                    </div>
                </div>
                <dl className="grid grid-cols-2 gap-px border-t border-[#232327] bg-[#232327] sm:grid-cols-4">
                    <Meta icon={Building2} label="Company" value={me ? (me.company?.code ? <span title={me.company.legalName}>{me.company.code}</span> : 'Not assigned') : null} />
                    <Meta icon={Layers} label="Departments" value={me ? (me.memberSpaces.length || '—') : null} />
                    <Meta icon={CalendarDays} label="Member since" value={me ? monthYear(me.createdAt) : null} />
                    <Meta icon={Clock} label="Last sign-in" value={me ? (me.lastLogin ? sinceShort(me.lastLogin) : '—') : null} />
                </dl>
            </section>

            <MyIdCard />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                {/* ---------- personal details ---------- */}
                <Panel icon={UserRound} title="Personal details" description="How you appear to colleagues across the CRM.">
                    <form onSubmit={saveName} className="space-y-5">
                        <div>
                            <FieldLabel htmlFor="p-name">Full name</FieldLabel>
                            <input id="p-name" className={cn(fieldClass, nameError && 'border-rose-500/60')} value={name} maxLength={80} autoComplete="name"
                                onChange={e => { setName(e.target.value); setNameError(''); }} disabled={!me} />
                            {nameError ? <FieldHint error>{nameError}</FieldHint> : <FieldHint>Shown on tasks, reports and messages. Your ID card keeps the name it was printed with.</FieldHint>}
                        </div>
                        <ReadOnly label="Email" value={me?.email || session?.user?.email || ''} hint="Your sign-in address. An administrator can change it." />
                        <ReadOnly label="Role" value={humanize(role)} hint="Set by a Director." />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={!nameChanged} isLoading={saving} leftIcon={<Check className="h-4 w-4" />}>Save changes</Button>
                        </div>
                    </form>
                </Panel>

                {/* ---------- work setup ---------- */}
                <Panel icon={Users} title="Your work" description="Where you sit in the organisation.">
                    <div className="space-y-5">
                        <div>
                            <p className="text-xs font-medium text-zinc-500">Reports to</p>
                            {!me ? <Skeleton /> : me.reportingManagers.length ? (
                                <ul className="mt-2 space-y-2">
                                    {me.reportingManagers.map(m => (
                                        <li key={m.id} className="flex items-center gap-3 rounded-xl border border-[#232327] bg-[#141416] px-3 py-2.5">
                                            <Avatar src={m.image} alt={m.name || m.email} fallback={initialsOf(m.name || m.email)} className="h-8 w-8 text-xs" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-zinc-100">{m.name || m.email}</p>
                                                <p className="text-xs text-zinc-500">{humanize(m.role)}</p>
                                            </div>
                                            <a href={`mailto:${m.email}`} aria-label={`Email ${m.name || m.email}`} className="rounded-lg p-2 text-zinc-500 hover:bg-[#1F1F23] hover:text-white"><Mail className="h-4 w-4" /></a>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="mt-1.5 text-sm text-zinc-400">Nobody: you report directly to the leadership.</p>}
                        </div>
                        <div>
                            <p className="text-xs font-medium text-zinc-500">Departments</p>
                            {!me ? <Skeleton /> : me.memberSpaces.length ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {me.memberSpaces.map(s => (
                                        <Link key={s.id} href={`/spaces/${s.id}`} className="inline-flex items-center gap-2 rounded-lg border border-[#2F2F35] bg-[#18181B] px-2.5 py-1.5 text-sm text-zinc-200 hover:border-[#3A3A41]">
                                            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}
                                        </Link>
                                    ))}
                                </div>
                            ) : <p className="mt-1.5 text-sm text-zinc-400">You're not in a department yet.</p>}
                        </div>
                        {me && me.teamSize > 0 && (
                            <p className="flex items-center gap-2 text-sm text-zinc-300"><Users className="h-4 w-4 text-zinc-500" />{me.teamSize} {me.teamSize === 1 ? 'person reports' : 'people report'} to you</p>
                        )}
                        <div className="border-t border-[#232327] pt-4">
                            <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500"><BadgeCheck className="h-3.5 w-3.5" />As {humanize(role).toLowerCase()} you can</p>
                            <ul className="mt-2.5 space-y-2">
                                {abilities.map(a => (
                                    <li key={a} className="flex gap-2.5 text-sm text-zinc-300">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{a}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Panel>
            </div>

            {/* ---------- sign-in and security ---------- */}
            <Panel icon={ShieldCheck} title="Sign-in and security" description="How you get into the CRM.">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                    <ul className="space-y-3">
                        <Method title="Google account" status={me ? (me.googleLinked ? 'Connected' : 'Not used yet') : ''} on={!!me?.googleLinked}
                            note={`Sign in with Continue with Google using ${me?.email || 'your work email'}.`} />
                        <Method title="Email and password" status={me ? (me.hasPassword ? 'Set' : 'Not set') : ''} on={!!me?.hasPassword}
                            note="Useful on devices where you can't use Google, like the desktop or phone app." />
                    </ul>
                    {me && <PasswordForm hasPassword={me.hasPassword} onDone={() => setMe(m => (m ? { ...m, hasPassword: true } : m))} />}
                </div>
            </Panel>
        </div>
    );
}

function Panel({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl border border-[#232327] bg-[#111113]">
            <header className="flex items-center gap-3 border-b border-[#232327] px-5 py-4 sm:px-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1F1F23] text-zinc-300 ring-1 ring-inset ring-[#2F2F35]"><Icon className="h-[18px] w-[18px]" /></span>
                <div>
                    <h2 className="text-[15px] font-semibold text-white">{title}</h2>
                    <p className="text-xs text-zinc-500">{description}</p>
                </div>
            </header>
            <div className="p-5 sm:p-6">{children}</div>
        </section>
    );
}

const Meta = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode | null }) => (
    <div className="flex items-center gap-3 bg-[#111113] px-5 py-4">
        <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
        <div className="min-w-0">
            <dt className="text-[11px] text-zinc-500">{label}</dt>
            <dd className="break-words text-sm font-medium text-zinc-100">{value ?? <span className="inline-block h-3.5 w-16 animate-pulse rounded bg-[#1F1F23] align-middle" />}</dd>
        </div>
    </div>
);

const ReadOnly = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
    <div>
        <p className="mb-1.5 text-[13px] font-medium text-zinc-300">{label}</p>
        <p className="flex h-10 items-center rounded-lg border border-[#232327] bg-[#141416] px-3 text-sm text-zinc-400">{value}</p>
        <FieldHint>{hint}</FieldHint>
    </div>
);

const Skeleton = () => <div className="mt-2 h-12 animate-pulse rounded-xl bg-[#141416]" />;

function Method({ title, status, note, on }: { title: string; status: string; note: string; on: boolean }) {
    return (
        <li className="rounded-xl border border-[#232327] bg-[#141416] p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-zinc-100">{title}</p>
                {status && <Badge tone={on ? 'emerald' : 'slate'} dot>{status}</Badge>}
            </div>
            <p className="mt-1 text-xs text-zinc-500">{note}</p>
        </li>
    );
}

function PasswordForm({ hasPassword, onDone }: { hasPassword: boolean; onDone: () => void }) {
    const { showToast } = useToast();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [show, setShow] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const strength = next.length === 0 ? 0 : [next.length >= 8, /[A-Z]/.test(next) && /[a-z]/.test(next), /\d/.test(next), /[^A-Za-z0-9]/.test(next), next.length >= 12].filter(Boolean).length;
    const strengthLabel = ['', 'Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (next.length < 8) return setError('Use at least 8 characters.');
        if (next !== confirm) return setError("The two new passwords don't match.");
        setBusy(true);
        const res = await fetch(hasPassword ? '/api/auth/password/change' : '/api/auth/password/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(hasPassword ? { currentPassword: current, newPassword: next } : { newPassword: next }),
        });
        const data = await res.json().catch(() => ({}));
        setBusy(false);
        if (!res.ok) return setError(data.error || "Couldn't save the password. Try again.");
        setCurrent(''); setNext(''); setConfirm('');
        showToast(hasPassword ? 'Password changed' : 'Password set. You can now sign in with your email too.', 'success');
        onDone();
    };

    const type = show ? 'text' : 'password';
    return (
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-[#232327] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-white"><KeyRound className="h-4 w-4 text-zinc-400" />{hasPassword ? 'Change your password' : 'Set a password'}</p>
                <button type="button" onClick={() => setShow(s => !s)} className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
                    {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{show ? 'Hide' : 'Show'}
                </button>
            </div>
            {hasPassword && (
                <div>
                    <FieldLabel htmlFor="pw-current">Current password</FieldLabel>
                    <input id="pw-current" type={type} autoComplete="current-password" className={fieldClass} value={current} onChange={e => setCurrent(e.target.value)} required />
                </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <FieldLabel htmlFor="pw-new">New password</FieldLabel>
                    <input id="pw-new" type={type} autoComplete="new-password" className={fieldClass} value={next} onChange={e => setNext(e.target.value)} required minLength={8} maxLength={128} />
                </div>
                <div>
                    <FieldLabel htmlFor="pw-confirm">Repeat new password</FieldLabel>
                    <input id="pw-confirm" type={type} autoComplete="new-password" className={fieldClass} value={confirm} onChange={e => setConfirm(e.target.value)} required />
                </div>
            </div>
            {next && (
                <div className="flex items-center gap-3">
                    <div className="flex flex-1 gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                            <span key={i} className={cn('h-1 flex-1 rounded-full', i <= strength ? (strength <= 2 ? 'bg-rose-500' : strength === 3 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-[#232327]')} />
                        ))}
                    </div>
                    <span className="w-12 text-right text-xs text-zinc-400">{strengthLabel}</span>
                </div>
            )}
            <p className="text-xs text-zinc-500">At least 8 characters. Mixing upper and lower case, numbers and symbols makes it stronger.</p>
            {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
            <div className="flex justify-end">
                <Button type="submit" variant="secondary" isLoading={busy}>{hasPassword ? 'Change password' : 'Set password'}</Button>
            </div>
        </form>
    );
}
