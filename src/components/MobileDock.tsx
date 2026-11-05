"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, Briefcase, Plus, Menu, CheckSquare, FileText, Target, AlertTriangle, Search, MessageSquare, Users, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { openCommandPalette } from '@/components/Sidebar';

interface MobileDockProps {
    onMenuClick: () => void;
    closeMenu: () => void;
}

export default function MobileDock({ onMenuClick, closeMenu }: MobileDockProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

    const role = (session?.user as any)?.role || 'EMPLOYEE';
    const isReadOnly = role === 'MANAGEMENT';

    const go = (href: string) => {
        router.push(href);
        closeMenu();
        setIsQuickMenuOpen(false);
    };

    const quickActions = [
        { name: 'New task', icon: CheckSquare, tone: 'text-emerald-300 bg-emerald-500/15', href: '/tasks?new=1', show: ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(role) },
        { name: 'New project', icon: Briefcase, tone: 'text-blue-300 bg-blue-500/15', href: '/projects/new', show: ['DIRECTOR', 'MANAGER'].includes(role) },
        { name: 'New milestone', icon: Target, tone: 'text-violet-300 bg-violet-500/15', href: '/milestones?new=1', show: ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(role) },
        { name: 'Report an issue', icon: AlertTriangle, tone: 'text-amber-300 bg-amber-500/15', href: '/issues?new=1', show: true },
        { name: 'Start a group chat', icon: Users, tone: 'text-sky-300 bg-sky-500/15', href: '/inbox', show: true },
        { name: 'Ask EUSAI AI', icon: Sparkles, tone: 'text-fuchsia-300 bg-fuchsia-500/15', href: '/ai-assistant', show: true },
        { name: 'Submit daily report', icon: FileText, tone: 'text-cyan-300 bg-cyan-500/15', href: '/reports/submit', show: true },
    ].filter(a => a.show);

    const NavButton = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
            <button onClick={() => go(href)} aria-label={label} className={cn('relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition', active ? 'text-white' : 'text-slate-500')}>
                <Icon className={cn('h-5 w-5', active && 'text-blue-300')} />
                {label}
                {active && <motion.span layoutId="dock-dot" className="absolute -bottom-1 h-1 w-1 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,1)]" />}
            </button>
        );
    };

    return (
        <>
            <AnimatePresence>
                {isQuickMenuOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsQuickMenuOpen(false)} className="fixed inset-0 z-[46] bg-black/70 backdrop-blur-sm lg:hidden" />
                        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[47] flex flex-col items-center gap-2 px-4 lg:hidden">
                            {quickActions.map((action, index) => (
                                <motion.button
                                    key={action.name}
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                    transition={{ delay: (quickActions.length - index) * 0.04, type: 'spring', damping: 22 }}
                                    onClick={() => go(action.href)}
                                    className="pointer-events-auto flex w-full max-w-xs items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#11141B]/95 px-4 py-3 text-left text-white shadow-xl backdrop-blur-xl active:scale-95"
                                >
                                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', action.tone)}><action.icon className="h-4 w-4" /></span>
                                    <span className="text-sm font-medium">{action.name}</span>
                                </motion.button>
                            ))}
                        </div>
                    </>
                )}
            </AnimatePresence>

            <div className="fixed bottom-4 left-1/2 z-[45] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 pb-[env(safe-area-inset-bottom)] lg:hidden">
                <div className="relative flex items-center rounded-2xl border border-white/[0.08] bg-[#0B0E14]/85 px-2 py-2 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
                    <NavButton href="/" icon={Home} label="Home" />
                    <NavButton href="/inbox" icon={MessageSquare} label="Messages" />
                    <div className="flex flex-1 justify-center">
                        {!isReadOnly ? (
                            <button
                                onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
                                aria-label="Quick actions"
                                className={cn('-mt-7 flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-[#07090D] text-white transition-all duration-300',
                                    isQuickMenuOpen ? 'rotate-45 bg-rose-500' : 'bg-gradient-to-b from-blue-500 to-blue-600 shadow-[0_10px_30px_-6px_rgba(59,130,246,0.9)]')}
                            >
                                <Plus className="h-6 w-6" strokeWidth={2.5} />
                            </button>
                        ) : (
                            <button onClick={openCommandPalette} aria-label="Search" className="flex flex-col items-center gap-1 py-1.5 text-[11px] font-medium text-slate-500">
                                <Search className="h-5 w-5" />Search
                            </button>
                        )}
                    </div>
                    <NavButton href="/tasks" icon={CheckSquare} label="Tasks" />
                    <button onClick={onMenuClick} aria-label="Menu" className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium text-slate-500">
                        <Menu className="h-5 w-5" />Menu
                    </button>
                </div>
            </div>
        </>
    );
}
