"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Briefcase, CheckSquare, FileText, Target, AlertTriangle, HelpCircle, LogOut, User, ChevronRight, ChevronDown, Search, Video, Building2, Users } from 'lucide-react';
import NewTaskModal from '@/components/modals/NewTaskModal';
import CreateMilestoneModal from '@/components/modals/CreateMilestoneModal';
import CreateSpaceModal from '@/components/modals/CreateSpaceModal';
import GeminiAssistant from "@/components/GeminiAssistant";
import NotificationCenter from "@/components/NotificationCenter";
import { cn } from "@/lib/utils";
import Avatar, { initialsOf } from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { humanize, roleTone } from "@/components/ui/tones";
import { openCommandPalette } from "@/components/Sidebar";

interface NavbarProps {
    onMenuClick?: () => void;
}

const SECTION_NAMES: Record<string, string> = {
    '': 'Home', inbox: 'Messages', meetings: 'Meetings', recent: 'Recents', projects: 'Projects', milestones: 'Milestones',
    tasks: 'Tasks', issues: 'Issues', notes: 'Notes', reports: 'Reports', library: 'Library', 'ai-assistant': 'EUSAI AI',
    welcome: 'Getting started', universities: 'Universities', resources: 'Resources', team: 'Team', admin: 'System admin',
    spaces: 'Departments', wiki: 'Knowledge', health: 'Platform health', logs: 'System logs', profile: 'Profile', new: 'New', submit: 'Submit report', performance: 'Performance', users: 'Users',
};

/** "/reports/submit" -> [Reports, Submit report]; ids become "Details". */
function useBreadcrumbs() {
    const pathname = usePathname();
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return [{ label: 'Home', href: '/' }];
    return parts.map((part, i) => ({
        label: SECTION_NAMES[part] ?? 'Details',
        href: '/' + parts.slice(0, i + 1).join('/'),
    }));
}

const menuItemClass = "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/[0.06]";

function Dropdown({ open, onClose, className, children }: { open: boolean; onClose: () => void; className?: string; children: React.ReactNode }) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className={cn('absolute right-0 top-full z-50 mt-2 rounded-2xl border border-white/[0.08] bg-[#11141B]/95 p-1.5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl', className)}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// The sidebar opens from the mobile dock's menu button, so onMenuClick is optional here.
export default function Navbar(_props: NavbarProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const crumbs = useBreadcrumbs();
    const [showAssistant, setShowAssistant] = useState(false);
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    // Create-menu dialogs open in place, without leaving the current page
    const [dialog, setDialog] = useState<'task' | 'milestone' | 'department' | null>(null);

    const userRole = (session?.user as any)?.role || "EMPLOYEE";
    const isReadOnly = userRole === 'MANAGEMENT';
    const canCreateProject = userRole === "MANAGER" || userRole === "DIRECTOR";
    const canCreateMilestone = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);
    const isLeader = canCreateMilestone || userRole === 'MANAGEMENT';

    const go = (href: string) => {
        router.push(href);
        setShowCreateMenu(false);
        setShowProfileMenu(false);
    };

    const createItems: { show: boolean; label: string; hint: string; icon: React.ElementType; tone: string; href?: string; dialog?: 'task' | 'milestone' | 'department' }[] = [
        { show: userRole === 'DIRECTOR', label: 'New department', hint: 'Group projects and people', icon: Building2, tone: 'text-violet-300 bg-violet-500/15', dialog: 'department' as const },
        { show: canCreateProject, label: 'New project', hint: 'Plan a new initiative', icon: Briefcase, tone: 'text-blue-300 bg-blue-500/15', href: '/projects/new' },
        { show: canCreateMilestone, label: 'New task', hint: 'Assign work to your team', icon: CheckSquare, tone: 'text-emerald-300 bg-emerald-500/15', dialog: 'task' as const },
        { show: canCreateMilestone, label: 'New milestone', hint: 'MOU, logo, business order', icon: Target, tone: 'text-violet-300 bg-violet-500/15', dialog: 'milestone' as const },
        { show: true, label: 'Schedule video call', hint: 'Google Meet with your team', icon: Video, tone: 'text-sky-300 bg-sky-500/15', href: '/meetings' },
        { show: true, label: 'Report an issue', hint: 'Flag a blocker', icon: AlertTriangle, tone: 'text-amber-300 bg-amber-500/15', href: '/issues?new=1' },
        { show: true, label: 'Submit daily report', hint: "Log today's work", icon: FileText, tone: 'text-cyan-300 bg-cyan-500/15', href: '/reports/submit' },
    ].filter(item => item.show);

    return (
        <>
            <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-[#07090D]/70 px-4 backdrop-blur-2xl sm:px-6 lg:px-8">
                {/* mobile brand */}
                <Link href="/" className="flex items-center gap-2 lg:hidden">
                    <span className="h-8 w-8 rounded-lg bg-white p-0.5"><img src="/EUSAI-LOGO.png" alt="EUSAI" className="h-full w-full object-contain" /></span>
                    <span className="font-display text-base font-bold text-white">EUSAI</span>
                </Link>

                {/* breadcrumbs */}
                <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 text-sm lg:flex">
                    <span className="text-slate-500">Workspace</span>
                    {crumbs.map((crumb, i) => (
                        <React.Fragment key={crumb.href}>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
                            {i === crumbs.length - 1
                                ? <span className="truncate font-medium text-slate-200">{crumb.label}</span>
                                : <Link href={crumb.href} className="truncate text-slate-400 hover:text-slate-200">{crumb.label}</Link>}
                        </React.Fragment>
                    ))}
                </nav>

                <div className="flex-1" />

                <button onClick={openCommandPalette} className="hidden h-10 w-64 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 text-sm text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-300 xl:flex">
                    <Search className="h-4 w-4" />
                    <span className="flex-1 truncate whitespace-nowrap text-left">Search everything</span>
                    <kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px]">Ctrl K</kbd>
                </button>

                <NotificationCenter />

                <button
                    onClick={() => setShowAssistant(!showAssistant)}
                    className={cn('hidden h-10 w-10 items-center justify-center rounded-xl border transition lg:flex',
                        showAssistant ? 'border-blue-400/30 bg-blue-500/15 text-blue-300' : 'border-white/[0.07] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]')}
                    title="Help assistant"
                    aria-label="Help assistant"
                >
                    <HelpCircle className="h-[18px] w-[18px]" />
                </button>

                {!isReadOnly && (
                    <div className="relative hidden lg:block">
                        <button
                            onClick={() => setShowCreateMenu(!showCreateMenu)}
                            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-4 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(59,130,246,0.8),inset_0_1px_0_rgba(255,255,255,0.25)] transition hover:from-blue-400 hover:to-blue-500"
                        >
                            <Plus className="h-4 w-4" /> Create <ChevronDown className={cn('h-4 w-4 opacity-70 transition', showCreateMenu && 'rotate-180')} />
                        </button>
                        <Dropdown open={showCreateMenu} onClose={() => setShowCreateMenu(false)} className="w-72">
                            {createItems.map(item => (
                                <button key={item.label} onClick={() => { if (item.dialog) { setDialog(item.dialog); setShowCreateMenu(false); } else if (item.href) go(item.href); }} className={menuItemClass}>
                                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', item.tone)}><item.icon className="h-4 w-4" /></span>
                                    <span className="min-w-0">
                                        <span className="block font-medium text-slate-100">{item.label}</span>
                                        <span className="block text-xs text-slate-500">{item.hint}</span>
                                    </span>
                                </button>
                            ))}
                        </Dropdown>
                    </div>
                )}

                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] pl-1 pr-2 transition hover:bg-white/[0.06] sm:pr-3"
                        aria-label="Account menu"
                    >
                        <Avatar src={(session?.user as any)?.image} alt={session?.user?.name || ''} fallback={initialsOf(session?.user?.name)} className="h-8 w-8 text-[11px]" />
                        <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-200 sm:block">{(session?.user?.name || 'User').split(' ')[0]}</span>
                        <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
                    </button>
                    <Dropdown open={showProfileMenu} onClose={() => setShowProfileMenu(false)} className="w-72">
                        <div className="flex items-center gap-3 px-3 py-3">
                            <Avatar src={(session?.user as any)?.image} alt={session?.user?.name || ''} fallback={initialsOf(session?.user?.name)} className="h-10 w-10 text-xs" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">{session?.user?.name || 'User'}</p>
                                <p className="truncate text-xs text-slate-500">{session?.user?.email}</p>
                            </div>
                        </div>
                        <div className="px-3 pb-2"><Badge tone={roleTone(userRole)}>{humanize(userRole)}</Badge></div>
                        <div className="my-1 h-px bg-white/[0.06]" />
                        <button onClick={() => go('/profile')} className={menuItemClass}><User className="h-4 w-4 text-slate-400" /> Profile and settings</button>
                        {isLeader && userRole !== 'MANAGEMENT' && <button onClick={() => go('/team')} className={menuItemClass}><Users className="h-4 w-4 text-slate-400" /> Team</button>}
                        {isLeader && <button onClick={() => go('/spaces')} className={menuItemClass}><Building2 className="h-4 w-4 text-slate-400" /> Departments</button>}
                        <button onClick={() => go('/reports/submit')} className={menuItemClass}><FileText className="h-4 w-4 text-slate-400" /> Submit daily report</button>
                        <div className="my-1 h-px bg-white/[0.06]" />
                        <button onClick={() => signOut({ callbackUrl: '/login' })} className={cn(menuItemClass, 'text-rose-300 hover:bg-rose-500/10')}><LogOut className="h-4 w-4" /> Log out</button>
                    </Dropdown>
                </div>
            </header>

            {showAssistant && <GeminiAssistant onClose={() => setShowAssistant(false)} />}
            {dialog === 'task' && <NewTaskModal isOpen onClose={() => setDialog(null)} onTaskCreated={() => { setDialog(null); router.push('/tasks'); }} />}
            {dialog === 'milestone' && <CreateMilestoneModal isOpen onClose={() => setDialog(null)} onSuccess={() => { setDialog(null); router.push('/milestones'); }} />}
            <CreateSpaceModal open={dialog === 'department'} onClose={() => setDialog(null)} />
        </>
    );
}
