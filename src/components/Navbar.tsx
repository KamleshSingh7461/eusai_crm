"use client";

import React, { useState } from 'react';
import {
    Bell,
    Search,
    Settings,
    HelpCircle,
    Plus,
    FileText,
    Briefcase,
    LayoutDashboard,
    Menu,
    LogOut,
    User,
    Video,
    Compass,
    TrendingUp,
    Shield,
    Users,
    ChevronDown
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation';
import GeminiAssistant from "@/components/GeminiAssistant";
import NotificationCenter from "@/components/NotificationCenter";
import { cn } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import NewTaskModal from "@/components/modals/NewTaskModal";
import CreateMilestoneModal from "@/components/modals/CreateMilestoneModal";

interface NavbarProps {
    onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [showAssistant, setShowAssistant] = useState(false);
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Modals
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);

    const userRole = ((session?.user as any)?.role || "EMPLOYEE").toUpperCase();
    const isExecutive = userRole === "DIRECTOR" || userRole === "MANAGEMENT";
    const isManager = isExecutive || userRole === "MANAGER";
    const isTeamLeader = isManager || userRole === "TEAM_LEADER";

    const getRoleBadgeStyle = (role: string) => {
        switch (role) {
            case 'DIRECTOR':
                return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            case 'MANAGEMENT':
                return 'bg-[#0052CC]/20 text-blue-300 border-[#0052CC]/30';
            case 'MANAGER':
                return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            case 'TEAM_LEADER':
                return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            default:
                return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

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
                        <span className="font-bold text-white text-lg tracking-tight">EUSAI CRM</span>
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
                        <span className="text-sm text-[rgba(255,255,255,0.4)] group-hover:text-[rgba(255,255,255,0.8)] transition-colors">Search tasks, spaces...</span>
                        <div className="ml-auto flex items-center gap-1">
                            <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] px-1.5 py-0.5 rounded font-mono">⌘K</span>
                        </div>
                    </button>

                    {/* Role-tailored "+ Create" Action Button */}
                    <div className="relative hidden sm:block">
                        <button
                            onClick={() => setShowCreateMenu(!showCreateMenu)}
                            className="flex items-center justify-center gap-2 h-8 px-3.5 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg transition-all font-bold text-xs shadow-md active:scale-95"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>
                                {userRole === 'DIRECTOR' ? 'Create Space' :
                                    userRole === 'MANAGEMENT' ? 'New Operation' :
                                        userRole === 'MANAGER' ? 'New Operation' :
                                            userRole === 'TEAM_LEADER' ? 'Assign Task' : 'New Task'}
                            </span>
                            <ChevronDown className={cn("w-3 h-3 transition-transform", showCreateMenu && "rotate-180")} />
                        </button>

                        {showCreateMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowCreateMenu(false)} />
                                <div className="absolute top-full right-0 mt-2 w-60 bg-[#2f3437] border border-[rgba(255,255,255,0.12)] rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">

                                    {/* Director Only Options */}
                                    {userRole === 'DIRECTOR' && (
                                        <button
                                            onClick={() => { router.push('/spaces'); setShowCreateMenu(false); }}
                                            className="w-full text-left px-4 py-2 text-xs font-bold text-white hover:bg-[rgba(255,255,255,0.06)] flex items-center gap-3 transition-colors"
                                        >
                                            <Compass className="w-4 h-4 text-purple-400" /> New Space Registry
                                        </button>
                                    )}

                                    {/* Executive / Manager Options */}
                                    {isManager && (
                                        <button
                                            onClick={() => { router.push('/projects'); setShowCreateMenu(false); }}
                                            className="w-full text-left px-4 py-2 text-xs font-bold text-white hover:bg-[rgba(255,255,255,0.06)] flex items-center gap-3 transition-colors"
                                        >
                                            <Briefcase className="w-4 h-4 text-[#0052CC]" /> New Operation / Project
                                        </button>
                                    )}

                                    {/* Milestone Creation (Manager or Above) */}
                                    {isManager && (
                                        <button
                                            onClick={() => { setIsMilestoneModalOpen(true); setShowCreateMenu(false); }}
                                            className="w-full text-left px-4 py-2 text-xs font-bold text-white hover:bg-[rgba(255,255,255,0.06)] flex items-center gap-3 transition-colors"
                                        >
                                            <TrendingUp className="w-4 h-4 text-amber-400" /> New Milestone
                                        </button>
                                    )}

                                    {/* Task Creation (All Roles) */}
                                    <button
                                        onClick={() => { setIsTaskModalOpen(true); setShowCreateMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-white hover:bg-[rgba(255,255,255,0.06)] flex items-center gap-3 transition-colors"
                                    >
                                        <FileText className="w-4 h-4 text-[#36B37E]" /> New Strategic Task
                                    </button>

                                    {/* Meeting Creation */}
                                    <button
                                        onClick={() => { router.push('/meetings'); setShowCreateMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-white hover:bg-[rgba(255,255,255,0.06)] flex items-center gap-3 transition-colors"
                                    >
                                        <Video className="w-4 h-4 text-blue-400" /> Schedule Video Call
                                    </button>

                                    <div className="h-px bg-[rgba(255,255,255,0.1)] my-1" />

                                    {/* Daily Report */}
                                    <button
                                        onClick={() => { router.push('/reports/submit'); setShowCreateMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-white hover:bg-[rgba(255,255,255,0.06)] flex items-center gap-3 transition-colors"
                                    >
                                        <LayoutDashboard className="w-4 h-4 text-purple-400" /> Submit Daily Report
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-4 w-px bg-[rgba(255,255,255,0.1)] mx-1 hidden lg:block" />

                    {/* Notification Center */}
                    <NotificationCenter />

                    {/* AI Assistant */}
                    <button
                        onClick={() => setShowAssistant(!showAssistant)}
                        className={cn(
                            "p-2 rounded-lg transition-all hidden lg:block hover:bg-[var(--notion-bg-hover)]",
                            showAssistant ? "text-[#0052CC] bg-[rgba(0,82,204,0.1)]" : "text-[rgba(255,255,255,0.6)]"
                        )}
                        title="AI Strategic Assistant"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-2.5 pl-1.5 pr-3 h-9 rounded-full bg-[#191919] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.05)] transition-all focus:outline-none"
                        >
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                                <Avatar
                                    src={(session?.user as any)?.image}
                                    alt=""
                                    fallback={(session?.user?.name?.charAt(0) || 'U').toUpperCase()}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex flex-col text-left hidden sm:flex">
                                <span className="text-xs font-bold text-white max-w-[100px] truncate leading-tight">
                                    {session?.user?.name || 'User'}
                                </span>
                                <span className="text-[9px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-wider leading-none mt-0.5">
                                    {userRole}
                                </span>
                            </div>
                        </button>

                        {showProfileMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                                <div className="absolute top-full right-0 mt-2 w-64 bg-[#2f3437] border border-[rgba(255,255,255,0.12)] rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-150">
                                    <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.1)] mb-1">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="text-sm font-bold text-white truncate">{session?.user?.name || 'User'}</p>
                                            <span className={cn("text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider border", getRoleBadgeStyle(userRole))}>
                                                {userRole}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[rgba(255,255,255,0.5)] truncate">{session?.user?.email}</p>
                                    </div>

                                    {/* Role-tailored Quick Nav */}
                                    <button onClick={() => { router.push('/profile'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.06)] flex items-center gap-3 transition-colors">
                                        <User className="w-4 h-4 text-blue-400" /> My Profile
                                    </button>

                                    {isTeamLeader && (
                                        <button onClick={() => { router.push('/team'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.06)] flex items-center gap-3 transition-colors">
                                            <Users className="w-4 h-4 text-emerald-400" /> Team & Personnel
                                        </button>
                                    )}

                                    {isManager && (
                                        <button onClick={() => { router.push('/spaces'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.06)] flex items-center gap-3 transition-colors">
                                            <Compass className="w-4 h-4 text-purple-400" /> Spaces & Departments
                                        </button>
                                    )}

                                    <button onClick={() => { router.push('/settings'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,255,255,0.06)] flex items-center gap-3 transition-colors">
                                        <Settings className="w-4 h-4 text-gray-400" /> Settings
                                    </button>

                                    <div className="h-px bg-[rgba(255,255,255,0.1)] my-1" />

                                    <button onClick={() => { signOut({ callbackUrl: '/login' }); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-red-400 hover:bg-[rgba(255,255,255,0.06)] flex items-center gap-3 transition-colors">
                                        <LogOut className="w-4 h-4" /> Log Out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Modals */}
            {isTaskModalOpen && (
                <NewTaskModal
                    isOpen={isTaskModalOpen}
                    onClose={() => setIsTaskModalOpen(false)}
                    onTaskCreated={() => router.push('/tasks')}
                />
            )}

            {isMilestoneModalOpen && (
                <CreateMilestoneModal
                    isOpen={isMilestoneModalOpen}
                    onClose={() => setIsMilestoneModalOpen(false)}
                    onCreated={() => router.push('/milestones')}
                />
            )}

            {/* Render Gemini Assistant */}
            {showAssistant && <GeminiAssistant onClose={() => setShowAssistant(false)} />}
        </>
    );
}
