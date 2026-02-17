"use client";

import React, { useState } from 'react';
import {
    Home,
    Briefcase,
    Plus,
    Search,
    Menu,
    Sparkles,
    CheckSquare,
    X,
    FileText,
    LayoutDashboard
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface MobileDockProps {
    onMenuClick: () => void;
    closeMenu: () => void;
}

export default function MobileDock({ onMenuClick, closeMenu }: MobileDockProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

    const handleNavigation = (href: string) => {
        router.push(href);
        closeMenu();
    };

    const navItems = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Projects', href: '/projects', icon: Briefcase },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    ];

    const quickActions = [
        { name: 'New Task', icon: CheckSquare, action: () => { router.push('/tasks'); closeMenu(); } },
        { name: 'New Project', icon: Briefcase, action: () => { router.push('/projects/new'); closeMenu(); } },
        { name: 'Ask AI', icon: Sparkles, action: () => { router.push('/ai-assistant'); closeMenu(); } },
        { name: 'Submit Report', icon: FileText, action: () => { router.push('/reports/submit'); closeMenu(); } },
    ];

    const handleSearch = () => {
        // Trigger the command palette
        const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
        document.dispatchEvent(event);
    };

    return (
        <>
            {/* Quick Action Overlay */}
            <AnimatePresence>
                {isQuickMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsQuickMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
                        />
                        <div className="fixed bottom-24 left-0 right-0 z-[91] flex flex-col items-center gap-3 lg:hidden px-4 pointer-events-none">
                            {quickActions.map((action, index) => (
                                <motion.button
                                    key={action.name}
                                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                    transition={{ delay: index * 0.05, type: 'spring', damping: 20 }}
                                    onClick={() => {
                                        action.action();
                                        setIsQuickMenuOpen(false);
                                    }}
                                    className="pointer-events-auto bg-[#191919]/90 backdrop-blur-xl border border-[rgba(255,255,255,0.1)] text-white w-full max-w-xs py-3 px-4 rounded-xl flex items-center justify-between shadow-xl active:scale-95 transition-transform"
                                >
                                    <span className="font-medium">{action.name}</span>
                                    <div className="p-2 bg-[#0052CC]/20 rounded-lg">
                                        <action.icon className="w-5 h-5 text-[#0052CC]" />
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* Floating Dock */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md lg:hidden">
                <div className="bg-[#0f0f0f]/80 backdrop-blur-2xl border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl p-2 flex items-center justify-between relative overflow-hidden ring-1 ring-white/5">

                    {/* Glass Reflection Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

                    {/* Left Items */}
                    <div className="flex items-center justify-around flex-1">
                        {navItems.slice(0, 2).map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => handleNavigation(item.href)}
                                    className={cn(
                                        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 relative group",
                                        isActive ? "text-white" : "text-[rgba(255,255,255,0.5)] hover:bg-white/5"
                                    )}
                                >
                                    <item.icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110")} />
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute -bottom-2 w-1 h-1 rounded-full bg-[#0052CC]"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Center Action Button */}
                    <div className="px-2 -mt-8 relative">
                        <div className="absolute -inset-4 bg-gradient-to-t from-black/50 to-transparent blur-md rounded-full -z-10" />
                        <button
                            onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
                            className={cn(
                                "w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-[#0052CC]/40 transition-all duration-300 border-2 border-[#191919]",
                                isQuickMenuOpen
                                    ? "bg-[#FF5630] rotate-45"
                                    : "bg-[#0052CC] hover:scale-105 active:scale-95"
                            )}
                        >
                            <Plus className="w-8 h-8 text-white stroke-[3px]" />
                        </button>
                    </div>

                    {/* Right Items */}
                    <div className="flex items-center justify-around flex-1">
                        <button
                            onClick={handleSearch}
                            className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 text-[rgba(255,255,255,0.5)] hover:bg-white/5"
                        >
                            <Search className="w-6 h-6" />
                        </button>

                        <button
                            onClick={onMenuClick}
                            className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 text-[rgba(255,255,255,0.5)] hover:bg-white/5"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

