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
    LayoutDashboard,
    MessageSquare,
    Zap,
    Users
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
        { name: 'Inbox', href: '/inbox', icon: MessageSquare },
    ];

    const quickActions = [
        { name: 'Establish Group', icon: Users, action: () => { router.push('/inbox'); closeMenu(); } },
        { name: 'AI Consultation', icon: Sparkles, action: () => { router.push('/ai-assistant'); closeMenu(); } },
        { name: 'System Report', icon: FileText, action: () => { router.push('/reports/submit'); closeMenu(); } },
    ];

    return (
        <>
            {/* Ultra-Premium Quick Action Overlay */}
            <AnimatePresence>
                {isQuickMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsQuickMenuOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[90] lg:hidden"
                        />
                        <div className="fixed bottom-28 left-0 right-0 z-[91] flex flex-col items-center gap-4 lg:hidden px-6 pointer-events-none">
                            {quickActions.map((action, index) => (
                                <motion.button
                                    key={action.name}
                                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                                    onClick={() => {
                                        action.action();
                                        setIsQuickMenuOpen(false);
                                    }}
                                    className="pointer-events-auto w-full max-w-sm bg-[#111111] border border-white/10 text-white py-4 px-6 rounded-2xl flex items-center justify-between shadow-2xl active:scale-95 transition-all group overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="font-black text-[11px] uppercase tracking-[0.2em] relative z-10">{action.name}</span>
                                    <div className="p-2 bg-blue-600/10 rounded-lg relative z-10">
                                        <action.icon className="w-5 h-5 text-blue-400" />
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* Tactical Orbital Dock */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md lg:hidden">
                <div className="bg-[#0A0A0A]/90 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 flex items-center justify-between relative overflow-hidden">
                    
                    {/* Interior Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-blue-500/20 blur-md" />

                    {/* Nav Items Left */}
                    <div className="flex items-center justify-around flex-1 px-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => handleNavigation(item.href)}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300",
                                        isActive ? "text-blue-400 bg-blue-600/5" : "text-white/20 hover:text-white/40"
                                    )}
                                >
                                    <item.icon className={cn("w-6 h-6", isActive && "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]")} />
                                    {isActive && (
                                        <motion.div
                                            layoutId="navGlow"
                                            className="absolute -bottom-1 w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_10px_#3b82f6]"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Center Tactical Orb */}
                    <div className="relative px-2">
                        <div className="absolute -inset-6 bg-blue-600/10 blur-2xl rounded-full" />
                        <button
                            onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
                            className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 border-4 border-[#0A0A0A] shadow-2xl",
                                isQuickMenuOpen
                                    ? "bg-red-600 rotate-[135deg] shadow-red-900/40"
                                    : "bg-gradient-to-br from-blue-600 to-blue-800 shadow-blue-900/40 hover:scale-105"
                            )}
                        >
                            <Plus className="w-8 h-8 text-white stroke-[3.5px]" />
                        </button>
                    </div>

                    {/* Nav Items Right */}
                    <div className="flex items-center justify-around flex-1 px-2">
                        <button
                            onClick={() => {
                                const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
                                document.dispatchEvent(event);
                            }}
                            className="flex items-center justify-center w-12 h-12 rounded-2xl text-white/20 hover:text-white/40 transition-all"
                        >
                            <Search className="w-6 h-6" />
                        </button>

                        <button
                            onClick={onMenuClick}
                            className="flex items-center justify-center w-12 h-12 rounded-2xl text-white/20 hover:text-white/40 transition-all"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
