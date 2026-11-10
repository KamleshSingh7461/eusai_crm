"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { CalendarDays, CheckSquare, Home, LayoutGrid, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    onMoreClick: () => void;
    moreOpen: boolean;
}

const TABS = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/inbox', label: 'Messages', icon: MessageSquare },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/meetings', label: 'Meetings', icon: CalendarDays },
];

/** Phone-only bottom navigation (hidden from 768px up, where the sidebar rail takes over). */
export default function BottomTabBar({ onMoreClick, moreOpen }: Props) {
    const pathname = usePathname();
    const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
    const anyTabActive = TABS.some(t => isActive(t.href));

    const Item = ({ active, label, icon: Icon }: { active: boolean; label: string; icon: React.ElementType }) => (
        <>
            <span className="relative flex h-8 w-14 items-center justify-center">
                {active && (
                    <motion.span layoutId="tabbar-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                        className="absolute inset-0 rounded-lg bg-[#1F1F23]" />
                )}
                <Icon className={cn('relative h-[20px] w-[20px] transition-colors', active ? 'text-white' : 'text-zinc-500')} strokeWidth={active ? 2.25 : 1.75} />
            </span>
            <span className={cn('text-[11px] leading-none transition-colors', active ? 'font-medium text-white' : 'font-medium text-zinc-500')}>{label}</span>
        </>
    );

    return (
        <nav aria-label="Primary"
            className="app-tabbar fixed inset-x-0 bottom-0 z-[45] border-t border-[#1C1C1F] bg-[#09090B] pb-[env(safe-area-inset-bottom)] md:hidden">
            <div className="mx-auto flex h-[60px] max-w-lg items-stretch px-1">
                {TABS.map(t => {
                    const active = !moreOpen && isActive(t.href);
                    return (
                        <Link key={t.href} href={t.href} aria-current={active ? 'page' : undefined}
                            className="flex flex-1 flex-col items-center justify-center gap-1 active:opacity-70">
                            <Item active={active} label={t.label} icon={t.icon} />
                        </Link>
                    );
                })}
                <button onClick={onMoreClick} aria-label="More: open the full menu" aria-expanded={moreOpen}
                    className="flex flex-1 flex-col items-center justify-center gap-1 active:opacity-70">
                    <Item active={moreOpen || !anyTabActive} label="More" icon={LayoutGrid} />
                </button>
            </div>
        </nav>
    );
}
