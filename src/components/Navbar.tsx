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
import MobileTopBar from "@/components/MobileTopBar";

interface NavbarProps {
    onMenuClick?: () => void;
}

const SECTION_NAMES: Record<string, string> = {
    '': 'Home', inbox: 'Messages', meetings: 'Meetings', recent: 'Recents', projects: 'Projects', milestones: 'Milestones',
    tasks: 'Tasks', issues: 'Issues', notes: 'Notes', reports: 'Reports', library: 'Library', 'ai-assistant': 'EUSAI AI',
    welcome: 'Getting started', universities: 'Universities', resources: 'Resources', team: 'Team', admin: 'System admin',
    spaces: 'Departments', wiki: 'Knowledge', health: 'Platform health', logs: 'System logs', profile: 'Profile', holidays: 'Holidays', companies: 'Companies', 'employee-ids': 'Employee IDs', new: 'New', submit: 'Submit report', performance: 'Performance', users: 'Users',
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

const menuItemClass = "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/[0.06]";

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
                        className={cn('absolute right-0 top-full z-50 mt-2 rounded-xl border border-[#2F2F35] bg-[#18181B] p-1 shadow-2xl shadow-black/60', className)}
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
            <MobileTopBar
                crumbs={crumbs}
                createItems={createItems}
                canCreate={!isReadOnly}
                onCreate={item => { if (item.dialog) setDialog(item.dialog); else if (item.href) go(item.href); }}
            />

            {/* tablets and desktop */}
            <header className="sticky top-0 z-40 hidden h-16 items-center gap-3 border-b border-[#1C1C1F] bg-[#09090B] px-6 md:flex lg:px-8">
                {/* breadcrumbs */}
                <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 text-sm md:flex">
                    <span className="text-zinc-500">Workspace</span>
                    {crumbs.map((crumb, i) => (
                        <React.Fragment key={crumb.href}>
                            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
                            {i === crumbs.length - 1
                                ? <span className="truncate font-medium text-zinc-200">{crumb.label}</span>
                                : <Link href={crumb.href} className="truncate text-zinc-400 hover:text-zinc-200">{crumb.label}</Link>}
                        </React.Fragment>
                    ))}
                </nav>

                <div className="flex-1" />

                <button onClick={openCommandPalette} className="hidden h-9 w-64 items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 text-sm text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300 xl:flex">
                    <Search className="h-4 w-4" />
                    <span className="flex-1 truncate whitespace-nowrap text-left">Search everything</span>
                    <kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px]">Ctrl K</kbd>
                </button>

                <button onClick={openCommandPalette} aria-label="Search" title="Search (Ctrl K)"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-white/[0.06] active:bg-white/[0.08] md:h-9 md:w-9 md:border md:border-white/[0.07] md:bg-white/[0.03] xl:hidden">
                    <Search className="h-[19px] w-[19px]" />
                </button>

                <NotificationCenter />

                <button
                    onClick={() => setShowAssistant(!showAssistant)}
                    className={cn('hidden h-9 w-9 items-center justify-center rounded-lg border transition lg:flex',
                        showAssistant ? 'border-blue-400/30 bg-blue-500/15 text-blue-300' : 'border-white/[0.07] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]')}
                    title="Help assistant"
                    aria-label="Help assistant"
                >
                    <HelpCircle className="h-[18px] w-[18px]" />
                </button>

                {!isReadOnly && (
                    <div className="relative">
                        <button
                            onClick={() => setShowCreateMenu(!showCreateMenu)}
                            aria-label="Create"
                            className="flex h-9 w-9 items-center justify-center gap-2 rounded-lg md:h-9 bg-blue-600 text-sm sm:w-auto sm:px-4 font-medium text-white transition-colors hover:bg-blue-500"
                        >
                            <Plus className="h-[18px] w-[18px] sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Create</span> <ChevronDown className={cn('hidden h-4 w-4 opacity-70 transition sm:block', showCreateMenu && 'rotate-180')} />
                        </button>
                        <Dropdown open={showCreateMenu} onClose={() => setShowCreateMenu(false)} className="-right-12 w-[min(18rem,calc(100vw-1.5rem))] md:right-0">
                            {createItems.map(item => (
                                <button key={item.label} onClick={() => { if (item.dialog) { setDialog(item.dialog); setShowCreateMenu(false); } else if (item.href) go(item.href); }} className={menuItemClass}>
                                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', item.tone)}><item.icon className="h-4 w-4" /></span>
                                    <span className="min-w-0">
                                        <span className="block font-medium text-zinc-100">{item.label}</span>
                                        <span className="block text-xs text-zinc-500">{item.hint}</span>
                                    </span>
                                </button>
                            ))}
                        </Dropdown>
                    </div>
                )}

                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="ml-0.5 flex items-center gap-2 rounded-full transition md:h-9 md:rounded-lg md:border md:border-white/[0.07] md:bg-white/[0.03] md:pl-1 md:pr-3 md:hover:bg-white/[0.06]"
                        aria-label="Account menu"
                    >
                        <Avatar src={(session?.user as any)?.image} alt={session?.user?.name || ''} fallback={initialsOf(session?.user?.name)} className="h-8 w-8 text-[11px]" />
                        <span className="hidden max-w-[120px] truncate text-sm font-medium text-zinc-200 md:block">{(session?.user?.name || 'User').split(' ')[0]}</span>
                        <ChevronDown className="hidden h-4 w-4 text-zinc-500 md:block" />
                    </button>
                    <Dropdown open={showProfileMenu} onClose={() => setShowProfileMenu(false)} className="w-[min(18rem,calc(100vw-1.5rem))]">
                        <div className="flex items-center gap-3 px-3 py-3">
                            <Avatar src={(session?.user as any)?.image} alt={session?.user?.name || ''} fallback={initialsOf(session?.user?.name)} className="h-10 w-10 text-xs" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">{session?.user?.name || 'User'}</p>
                                <p className="truncate text-xs text-zinc-500">{session?.user?.email}</p>
                            </div>
                        </div>
                        <div className="px-3 pb-2"><Badge tone={roleTone(userRole)}>{humanize(userRole)}</Badge></div>
                        <div className="my-1 h-px bg-white/[0.06]" />
                        <button onClick={() => go('/profile')} className={menuItemClass}><User className="h-4 w-4 text-zinc-400" /> Profile and settings</button>
                        {isLeader && userRole !== 'MANAGEMENT' && <button onClick={() => go('/team')} className={menuItemClass}><Users className="h-4 w-4 text-zinc-400" /> Team</button>}
                        {isLeader && <button onClick={() => go('/spaces')} className={menuItemClass}><Building2 className="h-4 w-4 text-zinc-400" /> Departments</button>}
                        <button onClick={() => go('/reports/submit')} className={menuItemClass}><FileText className="h-4 w-4 text-zinc-400" /> Submit daily report</button>
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
