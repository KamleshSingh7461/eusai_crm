"use client";

import React, { useState } from 'react';
import { Bell, Search, Settings, HelpCircle, Plus, FileText, Briefcase, LayoutDashboard, MessageSquare, Menu } from "lucide-react";
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

    const userRole = (session?.user as any)?.role || "EMPLOYEE";
    const isManager = userRole === "MANAGER" || userRole === "DIRECTOR";
    const isDirector = userRole === "DIRECTOR";

    return (
        <>
            <nav className="h-16 border-b border-[#EBECF0] bg-white/80 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center justify-between transition-all duration-300">
                <div className="flex items-center gap-3 flex-1">
                    {/* Mobile Menu Toggle - More refined */}
                    <button
                        onClick={onMenuClick}
                        className="p-2 -ml-1 text-[#42526E] hover:bg-[#F4F5F7] active:bg-[#DEEBFF] active:text-[#0052CC] rounded-lg lg:hidden transition-all"
                        aria-label="Toggle Menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Branding for mobile (Small Logo) */}
                    <div className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-[#EBECF0] shadow-sm overflow-hidden flex-shrink-0">
                        <img src="/EUSAI-LOGO.png" alt="E" className="w-full h-full object-contain p-1" />
                    </div>

                    <div className="h-6 w-px bg-[#DFE1E6] lg:hidden" />

                    {/* Role-Based Create Button - Cleaner mobile state */}
                    <div className="flex items-center gap-2 relative">
                        <div className="relative">
                            <button
                                onClick={() => setShowCreateMenu(!showCreateMenu)}
                                className="flex items-center justify-center gap-2 h-9 px-3 sm:px-4 py-2 bg-[#0052CC] text-white rounded-lg hover:bg-[#0065FF] active:scale-95 transition-all font-bold text-sm shadow-sm ring-2 ring-white"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Create</span>
                            </button>

                            {/* Dropdown Menu - Sleeker styling */}
                            {showCreateMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowCreateMenu(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-[#DFE1E6] rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {isManager && (
                                            <>
                                                <button onClick={() => { router.push('/projects/new'); setShowCreateMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] hover:text-[#0052CC] flex items-center gap-3 transition-colors">
                                                    <div className="p-1.5 bg-blue-50 rounded-lg text-[#0052CC]"><Briefcase className="w-4 h-4" /></div> New Project
                                                </button>
                                                <div className="h-px bg-gray-100 my-1 mx-2" />
                                            </>
                                        )}
                                        <button onClick={() => { router.push('/tasks'); setShowCreateMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] hover:text-[#0052CC] flex items-center gap-3 transition-colors">
                                            <div className="p-1.5 bg-green-50 rounded-lg text-[#36B37E]"><FileText className="w-4 h-4" /></div> New Task
                                        </button>
                                        <button onClick={() => { router.push('/reports/submit'); setShowCreateMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#172B4D] hover:bg-[#F4F5F7] hover:text-[#0052CC] flex items-center gap-3 transition-colors">
                                            <div className="p-1.5 bg-purple-50 rounded-lg text-[#6554C0]"><LayoutDashboard className="w-4 h-4" /></div> Submit Report
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Command Palette Trigger - Refined mobile search */}
                    <button
                        onClick={() => {
                            const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
                            document.dispatchEvent(event);
                        }}
                        className="p-2 text-[#42526E] hover:bg-[#F4F5F7] rounded-lg transition-all"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    {/* Notifications */}
                    <NotificationCenter />

                    {/* Mobile Profile Link (New for mobile top bar) */}
                    {session?.user && (
                        <button
                            onClick={() => router.push('/profile')}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#DEEBFF] border-2 border-white shadow-sm overflow-hidden lg:hidden"
                        >
                            {(session.user as any).image ? (
                                <img src={(session.user as any).image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] font-bold text-[#0052CC]">{(session.user.name?.charAt(0) || 'U').toUpperCase()}</span>
                            )}
                        </button>
                    )}

                    {/* Desktop Only Triggers */}
                    <div className="hidden lg:flex items-center gap-2">
                        <button
                            onClick={() => setShowAssistant(!showAssistant)}
                            className={cn(
                                "p-2 rounded-lg hover:bg-[#F4F5F7] transition-all relative font-medium",
                                showAssistant ? "bg-blue-50 text-[#0052CC]" : "text-[#42526E]"
                            )}
                            title="AI Help Assistant"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>

                        <button onClick={() => router.push('/settings')} className="p-2 rounded-lg hover:bg-[#F4F5F7] text-[#42526E] transition-all">
                            <Settings className="w-5 h-5" />
                        </button>

                        <div className="h-6 w-px bg-[#DFE1E6] mx-1" />
                    </div>
                </div>
            </nav>

            {/* Render Gemini Assistant */}
            {showAssistant && <GeminiAssistant onClose={() => setShowAssistant(false)} />}
        </>
    );
}
