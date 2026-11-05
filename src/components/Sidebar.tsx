"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    Home, MessageSquare, Video, Clock, Briefcase, Target, CheckSquare, AlertTriangle, StickyNote, Table,
    Library, Sparkles, BookOpen, Users, Shield, Plus, ChevronLeft, ChevronDown, X, LogOut,
    Search, Command, User, Building2, FileText, Smartphone, Monitor, Apple, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpace } from '@/context/SpaceContext';
import Avatar, { initialsOf } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import CreateSpaceModal from '@/components/modals/CreateSpaceModal';
import { humanize, roleTone } from '@/components/ui/tones';
import PushNotificationManager from '@/components/PushNotificationManager';

// Notes live in the browser (localStorage) under this key; the notes page fires the event on change.
const NOTES_KEY = 'eusai_crm_notes';
const NOTES_EVENT = 'eusai_crm_notes_updated';

// Desktop and mobile apps. Only files that actually exist in /public/downloads are links.
const APP_DOWNLOADS: { group: string; icon: React.ElementType; items: { label: string; href?: string; note: string }[] }[] = [
    { group: 'Android', icon: Smartphone, items: [{ label: 'Android app (.apk)', href: '/downloads/eusai_hub_android.apk', note: '55 MB' }] },
    { group: 'Windows', icon: Monitor, items: [
        { label: 'Installer (.exe)', href: '/downloads/EUSAI_Hub_Setup.exe', note: '11 MB' },
        { label: 'Zip archive', href: '/downloads/EUSAI_Hub_Setup.zip', note: '10 MB' },
    ] },
    { group: 'Apple', icon: Apple, items: [{ label: 'iOS and macOS', note: 'Coming soon' }] },
];

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    closeMobileMenu?: () => void;
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
    soon?: boolean;
    show?: boolean;
}

export const openCommandPalette = () =>
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));

export default function Sidebar({ isCollapsed, toggleSidebar, closeMobileMenu }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { spaces } = useSpace();

    const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);

    const userRole = (session?.user as any)?.role || 'EMPLOYEE';
    const canManageTeam = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);
    // The spaces API only lets directors create departments.
    const canCreateSpace = userRole === 'DIRECTOR';
    const [recentNotes, setRecentNotes] = useState<{ id: string; title: string }[]>([]);
    const [appsOpen, setAppsOpen] = useState(false);

    useEffect(() => {
        const loadNotes = () => {
            try {
                const parsed = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
                if (!Array.isArray(parsed)) return setRecentNotes([]);
                const sorted = [...parsed].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
                setRecentNotes(sorted.slice(0, 3).map(n => ({ id: n.id, title: n.title?.trim() || 'Untitled note' })));
            } catch {
                setRecentNotes([]);
            }
        };
        loadNotes();
        window.addEventListener('storage', loadNotes);
        window.addEventListener(NOTES_EVENT, loadNotes);
        return () => {
            window.removeEventListener('storage', loadNotes);
            window.removeEventListener(NOTES_EVENT, loadNotes);
        };
    }, []);

    const sections: { title: string; items: NavItem[] }[] = [
        {
            title: 'Overview', items: [
                { name: 'Home', href: '/', icon: Home },
                { name: 'Messages', href: '/inbox', icon: MessageSquare },
                { name: 'Meetings', href: '/meetings', icon: Video },
                { name: 'Recents', href: '/recent', icon: Clock },
            ]
        },
        {
            title: 'Work', items: [
                { name: 'Projects', href: '/projects', icon: Briefcase },
                { name: 'Milestones', href: '/milestones', icon: Target },
                { name: 'Tasks', href: '/tasks', icon: CheckSquare },
                { name: 'Issues', href: '/issues', icon: AlertTriangle },
            ]
        },
        {
            title: 'Insights', items: [
                { name: 'Reports', href: '/reports', icon: Table },
                { name: 'Library', href: '/library', icon: Library },
                { name: 'EUSAI AI', href: '/ai-assistant', icon: Sparkles },
                { name: 'Getting started', href: '/welcome', icon: BookOpen },
            ]
        },
        {
            title: 'Organization', items: [
                { name: 'Team', href: '/team', icon: Users, show: canManageTeam },
                { name: 'System admin', href: '/admin', icon: Shield, show: userRole === 'DIRECTOR' },
            ]
        },
    ];

    const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/'));

    const linkClass = (active: boolean) => cn(
        'group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all',
        isCollapsed ? 'h-10 w-10 justify-center mx-auto' : 'h-10 px-3',
        active
            ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/[0.04] text-white ring-1 ring-inset ring-blue-400/20'
            : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
    );

    const ActiveBar = () => (
        <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-blue-400 shadow-[0_0_12px_2px_rgba(96,165,250,0.7)]" />
    );

    return (
        <>
            <aside className={cn(
                'relative flex h-screen flex-col border-r border-white/[0.06] bg-[#080A0F]/90 backdrop-blur-2xl transition-[width] duration-300 ease-in-out',
                isCollapsed ? 'w-[76px]' : 'w-[264px]'
            )}>
                {/* brand */}
                <div className={cn('flex h-16 shrink-0 items-center gap-3', isCollapsed ? 'justify-center px-2' : 'px-5')}>
                    <Link href="/" onClick={closeMobileMenu} className="h-9 w-9 shrink-0 rounded-xl bg-white p-1 shadow-[0_0_24px_rgba(59,130,246,0.35)]">
                        <img src="/EUSAI-LOGO.png" alt="EUSAI" className="h-full w-full object-contain" />
                    </Link>
                    {!isCollapsed && (
                        <div className="min-w-0 flex-1">
                            <p className="font-display text-[15px] font-bold tracking-tight text-white">EUSAI Team</p>
                            <p className="text-xs text-slate-500">Enterprise workspace</p>
                        </div>
                    )}
                    <button onClick={closeMobileMenu} className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white lg:hidden" aria-label="Close menu">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-[52px] z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#11141B] text-slate-400 shadow-lg transition hover:text-white lg:flex"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform', isCollapsed && 'rotate-180')} />
                </button>

                {/* search */}
                <div className={cn('shrink-0 pb-3', isCollapsed ? 'px-2' : 'px-4')}>
                    <button
                        onClick={openCommandPalette}
                        title="Search (Ctrl K)"
                        className={cn(
                            'flex h-10 items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] text-sm text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200',
                            isCollapsed ? 'mx-auto w-10 justify-center' : 'w-full px-3'
                        )}
                    >
                        <Search className="h-4 w-4" />
                        {!isCollapsed && (
                            <>
                                <span className="flex-1 text-left">Search anything</span>
                                <kbd className="flex items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-slate-400"><Command className="h-3 w-3" />K</kbd>
                            </>
                        )}
                    </button>
                </div>

                {/* navigation */}
                <nav className={cn('flex-1 space-y-5 overflow-y-auto overflow-x-hidden pb-4 overscroll-contain', isCollapsed ? 'px-2' : 'px-3')}>
                    {sections.filter(section => section.items.some(item => item.show !== false)).map(section => (
                        <div key={section.title}>
                            {!isCollapsed
                                ? <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{section.title}</p>
                                : <div className="mx-auto mb-2 h-px w-6 bg-white/[0.06]" />}
                            <div className="space-y-0.5">
                                {section.items.filter(item => item.show !== false).map(item => {
                                    const active = isActive(item.href);
                                    return (
                                        <Link key={item.href} href={item.href} onClick={closeMobileMenu} className={linkClass(active)} title={isCollapsed ? item.name : undefined}>
                                            {active && !isCollapsed && <ActiveBar />}
                                            <item.icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-blue-300' : 'text-slate-500 group-hover:text-slate-300')} />
                                            {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}
                                            {!isCollapsed && item.soon && <span className="rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-violet-300">Soon</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* departments (spaces) */}
                    {(spaces?.length > 0 || canCreateSpace) && (
                        <div>
                            {!isCollapsed
                                ? (
                                    <div className="flex items-center justify-between px-3 pb-1.5">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Departments</p>
                                        {canCreateSpace && (
                                            <button onClick={() => setIsSpaceModalOpen(true)} className="rounded-md p-1 text-slate-500 transition hover:bg-white/[0.06] hover:text-white" aria-label="Create department">
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                )
                                : <div className="mx-auto mb-2 h-px w-6 bg-white/[0.06]" />}
                            <div className="space-y-0.5">
                                <Link href="/spaces" onClick={closeMobileMenu} className={linkClass(pathname === '/spaces')} title={isCollapsed ? 'All departments' : undefined}>
                                    {pathname === '/spaces' && !isCollapsed && <ActiveBar />}
                                    <Building2 className={cn('h-[18px] w-[18px] shrink-0', pathname === '/spaces' ? 'text-blue-300' : 'text-slate-500 group-hover:text-slate-300')} />
                                    {!isCollapsed && <span className="flex-1 truncate">All departments</span>}
                                </Link>
                                {spaces?.map((space: any) => {
                                    const active = pathname === `/spaces/${space.id}`;
                                    return (
                                        <Link key={space.id} href={`/spaces/${space.id}`} onClick={closeMobileMenu} className={linkClass(active)} title={isCollapsed ? space.name : undefined}>
                                            {active && !isCollapsed && <ActiveBar />}
                                            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                                                <span className="h-2.5 w-2.5 rounded-[4px]" style={{ backgroundColor: space.color || '#3B82F6', boxShadow: `0 0 10px ${space.color || '#3B82F6'}99` }} />
                                            </span>
                                            {!isCollapsed && <span className="flex-1 truncate">{space.name}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {/* private notes (stored in this browser) */}
                    <div>
                        {!isCollapsed
                            ? (
                                <div className="flex items-center justify-between px-3 pb-1.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Private notes</p>
                                    <Link href="/notes?new=1" onClick={closeMobileMenu} className="rounded-md p-1 text-slate-500 transition hover:bg-white/[0.06] hover:text-white" aria-label="New note" title="New note">
                                        <Plus className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            )
                            : <div className="mx-auto mb-2 h-px w-6 bg-white/[0.06]" />}
                        <div className="space-y-0.5">
                            {!isCollapsed && recentNotes.map(note => (
                                <Link key={note.id} href={`/notes?id=${note.id}`} onClick={closeMobileMenu} className={linkClass(false)} title={note.title}>
                                    <FileText className="h-[18px] w-[18px] shrink-0 text-slate-500 group-hover:text-slate-300" />
                                    <span className="flex-1 truncate">{note.title}</span>
                                </Link>
                            ))}
                            <Link href="/notes" onClick={closeMobileMenu} className={linkClass(pathname === '/notes')} title={isCollapsed ? 'Notes' : undefined}>
                                {pathname === '/notes' && !isCollapsed && <ActiveBar />}
                                <StickyNote className={cn('h-[18px] w-[18px] shrink-0', pathname === '/notes' ? 'text-blue-300' : 'text-slate-500 group-hover:text-slate-300')} />
                                {!isCollapsed && <span className="flex-1 truncate">{recentNotes.length ? 'All notes' : 'Notes'}</span>}
                            </Link>
                        </div>
                    </div>

                    {/* desktop and mobile apps */}
                    {!isCollapsed && (
                        <div>
                            <button onClick={() => setAppsOpen(o => !o)} className="flex w-full items-center justify-between px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 hover:text-slate-300" aria-expanded={appsOpen}>
                                Get the apps
                                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', appsOpen && 'rotate-180')} />
                            </button>
                            {appsOpen && (
                                <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                    {APP_DOWNLOADS.map(group => (
                                        <div key={group.group}>
                                            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400"><group.icon className="h-3.5 w-3.5" />{group.group}</p>
                                            {group.items.map(item => item.href ? (
                                                <a key={item.label} href={item.href} download className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.05] hover:text-white">
                                                    <span className="flex items-center gap-1.5 truncate"><Download className="h-3 w-3 shrink-0" />{item.label}</span>
                                                    <span className="shrink-0 text-[11px] text-slate-500">{item.note}</span>
                                                </a>
                                            ) : (
                                                <p key={item.label} className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-slate-500">
                                                    <span className="truncate">{item.label}</span>
                                                    <span className="shrink-0 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[11px]">{item.note}</span>
                                                </p>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {!isCollapsed && <PushNotificationManager />}
                </nav>

                {/* account */}
                <div className={cn('shrink-0 space-y-1 border-t border-white/[0.06] py-3', isCollapsed ? 'px-2' : 'px-3')}>
                    {session?.user && (
                        <Link href="/profile" onClick={closeMobileMenu} className={cn('flex items-center gap-3 rounded-xl transition hover:bg-white/[0.04]', isCollapsed ? 'justify-center p-1.5' : 'px-2 py-2')} title={isCollapsed ? 'Profile' : undefined}>
                            <Avatar src={(session.user as any).image} alt={session.user.name || ''} fallback={initialsOf(session.user.name)} className="h-9 w-9 text-xs" />
                            {!isCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-100">{session.user.name || 'User'}</p>
                                    <p className="truncate text-xs text-slate-500">{session.user.email}</p>
                                </div>
                            )}
                            {!isCollapsed && <Badge tone={roleTone(userRole)}>{humanize(userRole)}</Badge>}
                        </Link>
                    )}
                    <div className={cn('flex gap-1', isCollapsed ? 'flex-col items-center' : '')}>
                        <Link href="/profile" onClick={closeMobileMenu} className={cn(linkClass(pathname === '/profile'), !isCollapsed && 'flex-1')} title={isCollapsed ? 'Profile' : undefined}>
                            <User className="h-[18px] w-[18px] shrink-0 text-slate-500 group-hover:text-slate-300" />
                            {!isCollapsed && <span>Profile</span>}
                        </Link>
                        <button onClick={() => signOut({ callbackUrl: '/login' })} className={cn(linkClass(false), !isCollapsed && 'flex-1', 'hover:text-rose-300')} title={isCollapsed ? 'Log out' : undefined}>
                            <LogOut className="h-[18px] w-[18px] shrink-0 text-slate-500 group-hover:text-rose-300" />
                            {!isCollapsed && <span>Log out</span>}
                        </button>
                    </div>
                </div>
            </aside>

            <CreateSpaceModal open={isSpaceModalOpen} onClose={() => setIsSpaceModalOpen(false)} />
        </>
    );
}
