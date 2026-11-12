"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { Building2, CheckCircle2, ChevronLeft, ChevronRight, Clock3, FileText, LogOut, Plus, Search, Sparkles, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { humanize, roleTone } from '@/components/ui/tones';
import NotificationCenter from '@/components/NotificationCenter';
import { openCommandPalette } from '@/components/Sidebar';

export interface CreateItem { label: string; hint: string; icon: React.ElementType; tone: string; href?: string; dialog?: 'task' | 'milestone' | 'department' }

interface Props {
    crumbs: { label: string; href: string }[];
    createItems: CreateItem[];
    canCreate: boolean;
    onCreate: (item: CreateItem) => void;
}

const REPORTING_ROLES = ['EMPLOYEE', 'INTERN', 'TEAM_LEADER', 'MANAGER'];
const IMMERSIVE = ['/inbox', '/ai-assistant'];

function greeting(d = new Date()) {
    const h = d.getHours();
    return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** Slide-up panel used for Create and the account menu on phones. */
function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: React.ReactNode; label: string }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label={label}>
                    <motion.div className="absolute inset-0 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
                    <motion.div
                        className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-[#2F2F35] bg-[#111113] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2 shadow-xl shadow-black/40"
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 32, stiffness: 340 }}
                        drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
                        onDragEnd={(_, info) => { if (info.offset.y > 90 || info.velocity.y > 600) onClose(); }}
                    >
                        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-zinc-700" />
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

/** Phone header: hides on scroll down, glass once scrolled, greeting hero on Home, bottom sheets for menus. */
export default function MobileTopBar({ crumbs, createItems, canCreate, onCreate }: Props) {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const user = session?.user as any;
    const role = (user?.role || 'EMPLOYEE').toUpperCase();
    const firstName = (user?.name || '').split(' ')[0];

    const isHome = pathname === '/';
    const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2] : null;
    const title = isHome ? 'Home' : crumbs[crumbs.length - 1]?.label;
    const immersive = IMMERSIVE.includes(pathname);

    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [pastHero, setPastHero] = useState(false);
    const [sheet, setSheet] = useState<'create' | 'account' | null>(null);
    const [reportDone, setReportDone] = useState<boolean | null>(null);
    const [dayOff, setDayOff] = useState<string | null>(null);
    const lastY = useRef(0);

    // scroll: glass after a few px, hide when scrolling down, show when scrolling up
    useEffect(() => {
        lastY.current = window.scrollY;
        const onScroll = () => {
            const y = window.scrollY;
            const delta = y - lastY.current;
            setScrolled(y > 8);
            setPastHero(y > 96);
            if (immersive || y < 120) setHidden(false);
            else if (delta > 6) setHidden(true);
            else if (delta < -6) setHidden(false);
            lastY.current = y;
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [immersive, pathname]);

    useEffect(() => setSheet(null), [pathname]);

    // today's daily report status, for the people who submit one
    useEffect(() => {
        if (!user?.id || !REPORTING_ROLES.includes(role)) { setReportDone(null); setDayOff(null); return; }
        const d = format(new Date(), 'yyyy-MM-dd');
        fetch(`/api/reports/daily?type=my&startDate=${d}&endDate=${d}`)
            .then(r => (r.ok ? r.json() : null))
            .then(j => setReportDone(j ? (j.reports || []).length > 0 : null))
            .catch(() => setReportDone(null));
        // weekends and holidays: no report due, so no amber reminder
        fetch(`/api/holidays?from=${d}&to=${d}`)
            .then(r => (r.ok ? r.json() : null))
            .then(j => setDayOff(j && !j.today?.isWorkingDay ? j.today?.reason || 'Day off' : null))
            .catch(() => setDayOff(null));
    }, [user?.id, role, pathname]);

    const statusDot = reportDone === null ? null : reportDone ? 'bg-emerald-400' : dayOff ? null : 'bg-amber-400';
    const showTitle = !isHome || pastHero;

    const AvatarRing = ({ size = 'h-9 w-9' }: { size?: string }) => (
        <span className="relative inline-flex shrink-0">
            <span className="rounded-full ring-1 ring-[#2F2F35]">
                <Avatar src={user?.image} alt={user?.name || ''} fallback={initialsOf(user?.name)} className={cn(size, 'text-[11px]')} />
            </span>
            {statusDot && <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-[#09090B]', statusDot)} />}
        </span>
    );

    const iconBtn = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-200 transition active:scale-90 active:bg-white/[0.1]';

    return (
        <>
            <motion.header
                animate={{ y: hidden ? '-110%' : 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                className={cn('sticky top-0 z-40 md:hidden', 'bg-[#09090B] pt-[env(safe-area-inset-top)]')}
            >
                <div className="relative flex h-14 items-center gap-1.5 px-3">
                    {parent ? (
                        <button onClick={() => router.push(parent.href)} aria-label={`Back to ${parent.label}`}
                            className="flex h-9 max-w-[38%] shrink-0 items-center gap-0.5 rounded-lg pl-1 pr-2.5 text-sm font-medium text-zinc-300 transition active:scale-95">
                            <ChevronLeft className="h-5 w-5 shrink-0 text-zinc-400" />
                            <span className="truncate">{parent.label}</span>
                        </button>
                    ) : (
                        <button onClick={() => setSheet('account')} aria-label="Your account" className="rounded-full transition active:scale-95">
                            <AvatarRing />
                        </button>
                    )}

                    {/* centred title: always on inner pages, fades in on Home once the greeting scrolls away */}
                    <AnimatePresence>
                        {showTitle && (
                            <motion.p key={title}
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.18 }}
                                className="pointer-events-none absolute left-1/2 max-w-[40%] -translate-x-1/2 truncate text-center font-display text-[15px] font-semibold tracking-tight text-white">
                                {title}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <div className="ml-auto flex items-center gap-0.5">
                        {(!isHome || pastHero) && <button onClick={openCommandPalette} aria-label="Search" className={iconBtn}><Search className="h-[19px] w-[19px]" /></button>}
                        <NotificationCenter />
                        {canCreate && (
                            <button onClick={() => setSheet('create')} aria-label="Create"
                                className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors active:bg-blue-500">
                                <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} />
                            </button>
                        )}
                    </div>
                </div>
                {/* hairline once content scrolls under the bar */}
                <div className={cn('h-px bg-[#1C1C1F] transition-opacity duration-200', scrolled || !isHome ? 'opacity-100' : 'opacity-0')} />
            </motion.header>

            {/* Home greeting: scrolls away with the page */}
            {isHome && (
                <section className="relative px-4 pb-1 pt-3 md:hidden">
                    <p className="relative text-[13px] font-medium text-zinc-500">{format(new Date(), 'EEEE, d MMMM')}</p>
                    <h1 className="relative mt-0.5 font-display text-[26px] font-semibold leading-tight tracking-[-0.03em] text-white">
                        {greeting()},{' '}
                        <span>{firstName || 'there'}</span>
                    </h1>

                    <div className="relative mt-3 flex flex-wrap gap-2">
                        {reportDone === false && dayOff && (
                            <span className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
                                <CheckCircle2 className="h-3.5 w-3.5 text-zinc-400" />No report due today · {dayOff}
                            </span>
                        )}
                        {reportDone === false && !dayOff && (
                            <Link href="/reports/submit" className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 ring-1 ring-inset ring-amber-500/20">
                                <Clock3 className="h-3.5 w-3.5" />Daily report due by 11:59 PM<ChevronRight className="h-3.5 w-3.5 opacity-70" />
                            </Link>
                        )}
                        {reportDone === true && (
                            <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
                                <CheckCircle2 className="h-3.5 w-3.5" />Today’s report submitted
                            </span>
                        )}
                        <span className="flex items-center rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">{humanize(role)}</span>
                    </div>

                    <div className="relative mt-4 flex h-11 items-center rounded-xl border border-[#232327] bg-[#111113] pl-3 pr-1.5">
                        <button onClick={openCommandPalette} className="flex h-full flex-1 items-center gap-2.5 text-left text-[15px] text-zinc-500" aria-label="Search or jump to">
                            <Search className="h-[18px] w-[18px] text-zinc-400" />Search or jump to…
                        </button>
                        <Link href="/ai-assistant" aria-label="Ask EUSAI AI"
                            className="flex h-8 items-center gap-1.5 rounded-lg bg-[#1F1F23] px-2.5 text-xs font-medium text-zinc-200 ring-1 ring-inset ring-[#2F2F35]">
                            <Sparkles className="h-3.5 w-3.5" />Ask AI
                        </Link>
                    </div>
                </section>
            )}

            <Sheet open={sheet === 'create'} onClose={() => setSheet(null)} label="Create">
                <p className="mb-3 px-1 font-display text-lg font-semibold text-white">Create</p>
                <div className="grid grid-cols-2 gap-2.5">
                    {createItems.map((item, i) => (
                        <motion.button key={item.label}
                            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, type: 'spring', damping: 24 }}
                            onClick={() => { setSheet(null); onCreate(item); }}
                            className="flex min-h-[96px] flex-col items-start justify-between rounded-xl border border-[#232327] bg-[#18181B] p-3.5 text-left transition-colors active:bg-[#1F1F23]">
                            <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', item.tone)}><item.icon className="h-5 w-5" /></span>
                            <span>
                                <span className="block text-sm font-semibold text-white">{item.label}</span>
                                <span className="block text-[11px] leading-snug text-zinc-500">{item.hint}</span>
                            </span>
                        </motion.button>
                    ))}
                </div>
            </Sheet>

            <Sheet open={sheet === 'account'} onClose={() => setSheet(null)} label="Your account">
                <div className="mb-4 flex items-center gap-3.5 rounded-xl border border-[#232327] bg-[#18181B] p-4">
                    <AvatarRing size="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-base font-semibold text-white">{user?.name || 'You'}</p>
                        <p className="truncate text-xs text-zinc-400">{user?.email}</p>
                        <div className="mt-1.5"><Badge tone={roleTone(role)}>{humanize(role)}</Badge></div>
                    </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-[#232327] bg-[#18181B]">
                    {[
                        { label: 'Profile and settings', icon: User, href: '/profile', show: true },
                        { label: 'Team', icon: Users, href: '/team', show: ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(role) },
                        { label: 'Departments', icon: Building2, href: '/spaces', show: ['DIRECTOR', 'MANAGER', 'TEAM_LEADER', 'MANAGEMENT'].includes(role) },
                        { label: 'Submit daily report', icon: FileText, href: '/reports/submit', show: REPORTING_ROLES.includes(role) },
                        { label: 'Ask EUSAI AI', icon: Sparkles, href: '/ai-assistant', show: true },
                    ].filter(r => r.show).map(r => (
                        <Link key={r.href} href={r.href} className="flex items-center gap-3 border-b border-[#232327] px-4 py-3.5 text-[15px] text-zinc-200 last:border-0 active:bg-[#1F1F23]">
                            <r.icon className="h-[18px] w-[18px] text-zinc-400" /><span className="flex-1">{r.label}</span><ChevronRight className="h-4 w-4 text-zinc-600" />
                        </Link>
                    ))}
                </div>
                <button onClick={() => signOut({ callbackUrl: '/login' })}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#232327] bg-[#18181B] py-3.5 text-[15px] font-medium text-red-400 active:bg-[#1F1F23]">
                    <LogOut className="h-[18px] w-[18px]" />Log out
                </button>
            </Sheet>
        </>
    );
}
