"use client";

import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import {
    LayoutDashboard,
    Briefcase,
    Users,
    FileText,
    Settings,
    Plus,
    Search,

    Target,

    GraduationCap,

    Layers,
    CheckSquare,
    X,
} from 'lucide-react';

export default function CommandCenter() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role || "EMPLOYEE";

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    // Role Logic (Matched with Sidebar.tsx)
    const canManageTeam = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);
    const canCreateSpace = ['DIRECTOR', 'MANAGER'].includes(userRole);

    const canViewResources = ['DIRECTOR', 'MANAGER'].includes(userRole);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-20">
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => setOpen(false)}
            />

            <div className="relative w-full max-w-2xl bg-[#191919]/90 supports-[backdrop-filter]:bg-[#191919]/80 backdrop-blur-xl rounded-xl shadow-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden z-[101] animate-in zoom-in-95 duration-200">
                <Command className="w-full">
                    <div className="flex items-center border-b border-[rgba(255,255,255,0.08)] px-4 py-3" cmdk-input-wrapper="">
                        <Search className="w-5 h-5 text-gray-400 mr-2" />
                        <Command.Input
                            autoFocus
                            placeholder="Type a command or search..."
                            className="w-full bg-transparent outline-none placeholder:text-gray-500 text-lg text-gray-200"
                        />
                        <button
                            onClick={() => setOpen(false)}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-py-2 custom-scrollbar">
                        <Command.Empty className="py-6 text-center text-sm text-gray-500">
                            No results found.
                        </Command.Empty>

                        <Command.Group heading="Workspace" className="text-xs font-semibold text-gray-500 mb-2 px-2">
                            <Command.Item onSelect={() => runCommand(() => router.push('/'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] cursor-pointer aria-selected:bg-[#0052CC]/20 aria-selected:text-white transition-colors group">
                                <LayoutDashboard className="w-4 h-4 text-gray-500 group-aria-selected:text-blue-400" /> Dashboard
                            </Command.Item>

                            <Command.Item onSelect={() => runCommand(() => router.push('/projects'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] cursor-pointer aria-selected:bg-[#0052CC]/20 aria-selected:text-white transition-colors group">
                                <Briefcase className="w-4 h-4 text-gray-500 group-aria-selected:text-blue-400" /> Projects
                            </Command.Item>
                            <Command.Item onSelect={() => runCommand(() => router.push('/tasks'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] cursor-pointer aria-selected:bg-[#0052CC]/20 aria-selected:text-white transition-colors group">
                                <CheckSquare className="w-4 h-4 text-gray-500 group-aria-selected:text-blue-400" /> Tasks
                            </Command.Item>
                            <Command.Item onSelect={() => runCommand(() => router.push('/milestones'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] cursor-pointer aria-selected:bg-[#0052CC]/20 aria-selected:text-white transition-colors group">
                                <Target className="w-4 h-4 text-gray-500 group-aria-selected:text-blue-400" /> Milestones
                            </Command.Item>

                            {canViewResources && (
                                <Command.Item onSelect={() => runCommand(() => router.push('/issues'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] cursor-pointer aria-selected:bg-[#0052CC]/20 aria-selected:text-white transition-colors group">
                                    <FileText className="w-4 h-4 text-gray-500 group-aria-selected:text-blue-400" /> Issues
                                </Command.Item>
                            )}

                            {/* Director Specific */}
                            {userRole === 'DIRECTOR' && (
                                <Command.Item onSelect={() => runCommand(() => router.push('/dashboard/director'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] cursor-pointer aria-selected:bg-[#0052CC]/20 aria-selected:text-white transition-colors group">
                                    <LayoutDashboard className="w-4 h-4 text-gray-500 group-aria-selected:text-blue-400" /> Director Dashboard
                                </Command.Item>
                            )}



                            <Command.Item onSelect={() => runCommand(() => router.push('/universities'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] cursor-pointer aria-selected:bg-[#0052CC]/20 aria-selected:text-white transition-colors group">
                                <GraduationCap className="w-4 h-4 text-gray-500 group-aria-selected:text-blue-400" /> Universities
                            </Command.Item>

                            {canManageTeam && (
                                <Command.Item onSelect={() => runCommand(() => router.push('/team'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] cursor-pointer aria-selected:bg-[#0052CC]/20 aria-selected:text-white transition-colors group">
                                    <Users className="w-4 h-4 text-gray-500 group-aria-selected:text-blue-400" /> Team
                                </Command.Item>
                            )}

                            {canViewResources && (
                                <Command.Item onSelect={() => runCommand(() => router.push('/resources'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] cursor-pointer aria-selected:bg-[#0052CC]/20 aria-selected:text-white transition-colors group">
                                    <Layers className="w-4 h-4 text-gray-500 group-aria-selected:text-blue-400" /> Resources
                                </Command.Item>
                            )}

                            <Command.Item onSelect={() => runCommand(() => router.push('/reports'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] cursor-pointer aria-selected:bg-[#0052CC]/20 aria-selected:text-white transition-colors group">
                                <FileText className="w-4 h-4 text-gray-500 group-aria-selected:text-blue-400" /> Reports
                            </Command.Item>
                        </Command.Group>

                        <Command.Separator className="h-px bg-gray-100 my-2" />



                        <Command.Group heading="Actions" className="text-xs font-semibold text-gray-500 mb-2 px-2">
                            {canCreateSpace && (
                                <Command.Item onSelect={() => runCommand(() => router.push('/spaces'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] cursor-pointer aria-selected:bg-[#0052CC]/20 aria-selected:text-white transition-colors group">
                                    <Plus className="w-4 h-4 text-gray-500 group-aria-selected:text-blue-400" /> Create New Space
                                </Command.Item>
                            )}
                            <Command.Item onSelect={() => runCommand(() => router.push('/projects/new'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] cursor-pointer aria-selected:bg-[#0052CC]/20 aria-selected:text-white transition-colors group">
                                <Plus className="w-4 h-4 text-gray-500 group-aria-selected:text-blue-400" /> Create Project
                            </Command.Item>
                            <Command.Item onSelect={() => runCommand(() => router.push('/tasks'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] cursor-pointer aria-selected:bg-[#0052CC]/20 aria-selected:text-white transition-colors group">
                                <Plus className="w-4 h-4 text-gray-500 group-aria-selected:text-blue-400" /> Create Task
                            </Command.Item>
                            {/* Only show for roles that submit reports */}
                            {!['DIRECTOR', 'MANAGER'].includes(userRole) && (
                                <Command.Item onSelect={() => runCommand(() => router.push('/reports/submit'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] cursor-pointer aria-selected:bg-[#0052CC]/20 aria-selected:text-white transition-colors group">
                                    <FileText className="w-4 h-4 text-gray-500 group-aria-selected:text-blue-400" /> Submit Daily Report
                                </Command.Item>
                            )}
                            <Command.Item onSelect={() => runCommand(() => router.push('/settings'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] cursor-pointer aria-selected:bg-[#0052CC]/20 aria-selected:text-white transition-colors group">
                                <Settings className="w-4 h-4 text-gray-500 group-aria-selected:text-blue-400" /> Settings
                            </Command.Item>
                        </Command.Group>
                    </Command.List>

                    <div className="border-t border-[rgba(255,255,255,0.08)] px-4 py-2 flex items-center justify-between text-xs text-gray-500 bg-[#1e1e1e]/50">
                        <div className="flex gap-2">
                            <span className="bg-[#2a2a2a] border border-[#333] px-1.5 py-0.5 rounded text-gray-400 font-medium font-mono text-[10px]">↑↓</span> to navigate
                            <span className="bg-[#2a2a2a] border border-[#333] px-1.5 py-0.5 rounded text-gray-400 font-medium font-mono text-[10px]">↵</span> to select
                            <span className="bg-[#2a2a2a] border border-[#333] px-1.5 py-0.5 rounded text-gray-400 font-medium font-mono text-[10px]">esc</span> to close
                        </div>
                        <div>
                            <span className="font-semibold text-blue-500">EUSAI</span> Command Palette
                        </div>
                    </div>
                </Command>
            </div>
        </div>
    );
}
