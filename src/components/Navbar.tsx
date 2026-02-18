"use client";

import React, { useState } from 'react';
import { Bell, Search, Settings, HelpCircle, Plus, FileText, Briefcase, LayoutDashboard, Menu, LogOut, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation';
import GeminiAssistant from "@/components/GeminiAssistant";
import NotificationCenter from "@/components/NotificationCenter";
import { cn } from "@/lib/utils";

interface NavbarProps {
    onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [showAssistant, setShowAssistant] = useState(false);
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const userRole = (session?.user as any)?.role || "EMPLOYEE";
    const isManager = userRole === "MANAGER" || userRole === "DIRECTOR";

    const handleSearchClick = () => {
        const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
        document.dispatchEvent(event);
    };

    return (
        <>
            <nav className="h-16 border-b border-[rgba(255,255,255,0.08)] backdrop-blur-xl sticky top-0 z-40 px-4 flex items-center justify-between transition-all duration-300 bg-[#1c1c1c]/90 lg:bg-[#191919]/80 supports-[backdrop-filter]:bg-[#1c1c1c]/80 lg:supports-[backdrop-filter]:bg-[#191919]/60">
                {/* Left Section: Mobile Menu & Logo */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMenuClick}
                        className="hidden p-2 -ml-1 rounded-lg transition-all hover:bg-[var(--notion-bg-hover)]"
                        style={{ color: 'var(--notion-text-secondary)' }}
                        aria-label="Toggle Menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="lg:hidden flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-transparent overflow-hidden flex-shrink-0">
                            <img src="/EUSAI-LOGO.png" alt="E" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-bold text-white text-lg tracking-tight">EUSAI TEAM</span>
                    </div>
                </div>

                {/* Center/Right Section */}
                <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">

                    {/* Search Bar - Desktop */}
                    <button
                        onClick={handleSearchClick}
                        className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.2)] transition-all w-64 group"
                    >
                        <Search className="w-4 h-4 text-[rgba(255,255,255,0.4)] group-hover:text-[rgba(255,255,255,0.8)] transition-colors" />
                        <span className="text-sm text-[rgba(255,255,255,0.4)] group-hover:text-[rgba(255,255,255,0.8)] transition-colors">Search...</span>
                        <div className="ml-auto flex items-center gap-1">
                            <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] px-1.5 py-0.5 rounded font-mono">⌘K</span>
                        </div>
                    </button>

                    {/* Create Button - Desktop Only */}
                    <div className="relative hidden lg:block">
                        <button
                            onClick={() => setShowCreateMenu(!showCreateMenu)}
                            className="flex items-center justify-center gap-2 h-8 px-3 bg-[#0052CC] text-white rounded hover:bg-[#0065FF] active:scale-95 transition-all font-bold text-xs shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Create</span>
                        </button>

                        {showCreateMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowCreateMenu(false)} />
                                <div className="absolute top-full right-0 mt-2 w-56 bg-[#2f3437] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
                                    {isManager && (
                                        <>
                                            <button onClick={() => { router.push('/projects/new'); setShowCreateMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.05)] flex items-center gap-3 transition-colors">
                                                <Briefcase className="w-4 h-4 text-[#0052CC]" /> New Project
                                            </button>
                                            <div className="h-px bg-[rgba(255,255,255,0.1)] my-1" />
                                        </>
                                    )}
                                    <button onClick={() => { router.push('/tasks'); setShowCreateMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.05)] flex items-center gap-3 transition-colors">
                                        <FileText className="w-4 h-4 text-[#36B37E]" /> New Task
                                    </button>
                                    <button onClick={() => { router.push('/reports/submit'); setShowCreateMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.05)] flex items-center gap-3 transition-colors">
                                        <LayoutDashboard className="w-4 h-4 text-[#6554C0]" /> Submit Report
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-4 w-px bg-[rgba(255,255,255,0.1)] mx-1 hidden lg:block" />

                    {/* Notification Center */}
                    <NotificationCenter />

                    {/* Mobile Search Trigger  - Hidden in favor of Dock */}
                    <button
                        onClick={handleSearchClick}
                        className="hidden p-2 rounded-lg transition-all hover:bg-[var(--notion-bg-hover)]"
                        style={{ color: 'var(--notion-text-secondary)' }}
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    {/* Assistant */}
                    <button
                        onClick={() => setShowAssistant(!showAssistant)}
                        className={cn(
                            "p-2 rounded-lg transition-all hidden lg:block hover:bg-[var(--notion-bg-hover)]",
                            showAssistant ? "text-[#0052CC] bg-[rgba(0,82,204,0.1)]" : "text-[rgba(255,255,255,0.6)]"
                        )}
                        title="AI Help Assistant"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-2 pl-1 pr-2 h-8 rounded-full bg-[#191919] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.05)] transition-all focus:outline-none"
                        >
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                                {(session?.user as any)?.image ? (
                                    <img src={(session?.user as any).image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#0052CC] text-white text-[10px] font-bold">
                                        {(session?.user?.name?.charAt(0) || 'U').toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-medium text-[rgba(255,255,255,0.9)] max-w-[100px] truncate hidden sm:block">
                                {session?.user?.name || 'User'}
                            </span>
                            {/* Mobile Name - condensed */}
                            <span className="text-xs font-medium text-[rgba(255,255,255,0.9)] max-w-[80px] truncate sm:hidden">
                                {(session?.user?.name || 'User').split(' ')[0]}
                            </span>
                        </button>

                        {showProfileMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                                <div className="absolute top-full right-0 mt-2 w-64 bg-[#2f3437] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.1)] mb-1">
                                        <p className="text-sm font-bold text-white truncate">{session?.user?.name || 'User'}</p>
                                        <p className="text-xs text-[rgba(255,255,255,0.5)] truncate">{session?.user?.email}</p>
                                    </div>

                                    <button onClick={() => { router.push('/profile'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.05)] flex items-center gap-3 transition-colors">
                                        <User className="w-4 h-4 text-[rgba(255,255,255,0.5)]" /> My Profile
                                    </button>
                                    <button onClick={() => { router.push('/settings'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.05)] flex items-center gap-3 transition-colors">
                                        <Settings className="w-4 h-4 text-[rgba(255,255,255,0.5)]" /> Settings
                                    </button>

                                    <div className="h-px bg-[rgba(255,255,255,0.1)] my-1" />

                                    <button onClick={() => { signOut({ callbackUrl: '/login' }); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[rgba(255,255,255,0.05)] flex items-center gap-3 transition-colors">
                                        <LogOut className="w-4 h-4" /> Log Out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Render Gemini Assistant */}
            {showAssistant && <GeminiAssistant onClose={() => setShowAssistant(false)} />}
        </>
    );
}
