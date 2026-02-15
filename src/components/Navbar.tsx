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
            <nav className="h-16 md:h-14 border-b border-[#DFE1E6] bg-white sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 md:gap-8 flex-1">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={onMenuClick}
                        className="p-2 -ml-1 text-[#42526E] hover:bg-[#F4F5F7] rounded-sm lg:hidden transition-colors"
                        aria-label="Toggle Menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Role-Based Create Button */}
                    <div className="flex items-center gap-2 md:gap-4 relative">
                        <div className="relative">
                            <button
                                onClick={() => setShowCreateMenu(!showCreateMenu)}
                                className="flex items-center justify-center gap-2 h-9 w-9 sm:h-auto sm:w-auto px-0 sm:px-4 py-2 bg-[#0052CC] text-white rounded-sm hover:bg-[#0065FF] transition-all font-medium text-sm shadow-sm active:scale-95"
                            >
                                <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Create</span>
                            </button>

                            {/* Dropdown Menu - State-based for mobile/desktop toggle */}
                            {showCreateMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowCreateMenu(false)} />
                                    <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-[#DFE1E6] rounded-sm shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                        {isManager && (
                                            <>
                                                <button onClick={() => { router.push('/projects/new'); setShowCreateMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] hover:text-[#0052CC] flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4" /> New Project
                                                </button>
                                                <div className="h-px bg-gray-100 my-1" />
                                            </>
                                        )}
                                        <button onClick={() => { router.push('/tasks'); setShowCreateMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] hover:text-[#0052CC] flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> New Task
                                        </button>
                                        <button onClick={() => { router.push('/reports/submit'); setShowCreateMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] hover:text-[#0052CC] flex items-center gap-2">
                                            <LayoutDashboard className="w-4 h-4" /> Submit Report
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Command Palette Trigger - Collapses on mobile */}
                    <div className="max-w-md w-full flex-1 md:flex-initial lg:flex-1 ml-2 md:ml-0">
                        <div
                            className="relative group cursor-pointer"
                            onClick={() => {
                                const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
                                document.dispatchEvent(event);
                            }}
                        >
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B778C] hidden md:block" />
                            <div className="md:hidden flex items-center justify-center p-2 hover:bg-[#F4F5F7] rounded-full text-[#42526E]">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search"
                                readOnly
                                className="hidden md:block w-full bg-[#F4F5F7] border-transparent rounded-sm py-1.5 pl-10 pr-4 text-sm focus:outline-none cursor-pointer hover:bg-[#EBECF0] transition-all placeholder:text-gray-500 text-gray-700 placeholder:content-['Search_(Ctrl+K)']"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <NotificationCenter />


                    {/* Gemini Help Trigger */}
                    <button
                        onClick={() => setShowAssistant(!showAssistant)}
                        className={cn(
                            "hidden md:flex p-2 rounded-full hover:bg-[#F4F5F7] transition-colors relative",
                            showAssistant ? "bg-blue-50 text-blue-600" : "text-[#42526E]"
                        )}
                        title="AI Help Assistant"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>

                    <button onClick={() => router.push('/settings')} className="hidden md:flex p-2 rounded-full hover:bg-[#F4F5F7] text-[#42526E]">
                        <Settings className="w-5 h-5" />
                    </button>

                    <div className="hidden md:block h-6 w-px bg-[#DFE1E6] mx-1" />
                </div>
            </nav>

            {/* Render Gemini Assistant */}
            {showAssistant && <GeminiAssistant onClose={() => setShowAssistant(false)} />}
        </>
    );
}
