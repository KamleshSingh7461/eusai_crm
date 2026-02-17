"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Search,
    Video,
    Sparkles,
    Inbox,
    Library,
    FileText,
    Clock,
    Settings,
    ChevronDown,
    ChevronRight,
    Plus,
    MoreHorizontal,
    LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import { useSpace } from '@/context/SpaceContext';

interface NotionSidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    closeMobileMenu?: () => void;
}

interface NavItem {
    name: string;
    href: string;
    icon: any;
    badge?: number;
}

interface NavSection {
    title: string;
    items: NavItem[];
    collapsible: boolean;
}

export default function NotionSidebar({ isCollapsed, toggleSidebar, closeMobileMenu }: NotionSidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { activeSpace, spaces, setActiveSpace } = useSpace();

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        workspaces: true,
        favorites: true
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Main navigation items (always visible)
    const mainNav: NavItem[] = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Meetings', href: '/meetings', icon: Video },
        { name: 'EUSAI AI', href: '/ai-assistant', icon: Sparkles },
        { name: 'Inbox', href: '/inbox', icon: Inbox },
        { name: 'Library', href: '/library', icon: Library },
    ];

    const utilityNav: NavItem[] = [
        { name: 'Reports', href: '/reports', icon: FileText },
        { name: 'Recent', href: '/recent', icon: Clock },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    const renderNavItem = (item: NavItem) => {
        const isActive = pathname === item.href;

        return (
            <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={cn(
                    "group flex items-center gap-3 px-2 py-1.5 rounded-sm text-sm transition-all",
                    "hover:bg-[var(--notion-bg-hover)]",
                    isActive
                        ? "bg-[var(--notion-bg-tertiary)]"
                        : ""
                )}
                style={{
                    color: isActive ? 'var(--notion-text-primary)' : 'var(--notion-text-secondary)'
                }}
            >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!isCollapsed && (
                    <>
                        <span className="flex-1 truncate font-medium">{item.name}</span>
                        {item.badge && (
                            <span
                                className="px-1.5 py-0.5 text-xs rounded-sm font-medium"
                                style={{
                                    backgroundColor: 'var(--notion-accent-blue)',
                                    color: '#fff'
                                }}
                            >
                                {item.badge}
                            </span>
                        )}
                    </>
                )}
            </Link>
        );
    };

    const renderWorkspaceItem = (space: any) => {
        const isActive = activeSpace?.id === space.id;

        return (
            <button
                key={space.id}
                onClick={() => {
                    setActiveSpace(space);
                    closeMobileMenu?.();
                }}
                className={cn(
                    "group flex items-center gap-2.5 px-2 py-1.5 rounded-sm text-sm transition-all w-full",
                    "hover:bg-[var(--notion-bg-hover)]",
                    isActive ? "bg-[var(--notion-bg-tertiary)]" : ""
                )}
                style={{
                    color: isActive ? 'var(--notion-text-primary)' : 'var(--notion-text-secondary)'
                }}
            >
                <div
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: space.color || '#0052CC' }}
                />
                {!isCollapsed && (
                    <span className="flex-1 text-left truncate font-medium">{space.name}</span>
                )}
            </button>
        );
    };

    return (
        <aside
            className={cn(
                "h-full flex flex-col transition-all duration-300 ease-in-out border-r",
                isCollapsed ? "w-16" : "w-60"
            )}
            style={{
                backgroundColor: 'var(--notion-bg-sidebar)',
                borderColor: 'var(--notion-border-default)'
            }}
        >
            {/* User Profile Section */}
            {!isCollapsed && (
                <div className="p-3 border-b" style={{ borderColor: 'var(--notion-border-default)' }}>
                    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-sm hover:bg-[var(--notion-bg-hover)] cursor-pointer transition-all">
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                            style={{
                                backgroundColor: 'var(--notion-accent-blue)',
                                color: '#fff'
                            }}
                        >
                            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--notion-text-primary)' }}>
                                {session?.user?.name || 'User'}
                            </p>
                        </div>
                        <MoreHorizontal className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--notion-text-tertiary)' }} />
                    </div>
                </div>
            )}

            {/* Search & Quick Actions */}
            {!isCollapsed && (
                <div className="p-3 space-y-1">
                    <button
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-sm text-sm transition-all hover:bg-[var(--notion-bg-hover)]"
                        style={{ color: 'var(--notion-text-secondary)' }}
                    >
                        <Search className="w-[18px] h-[18px]" />
                        <span className="flex-1 text-left">Search</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--notion-bg-tertiary)', color: 'var(--notion-text-tertiary)' }}>
                            Ctrl K
                        </span>
                    </button>
                </div>
            )}

            {/* Main Navigation */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-3 space-y-0.5">
                    {mainNav.map(renderNavItem)}
                </div>

                {/* Workspaces Section */}
                <div className="p-3">
                    <button
                        onClick={() => toggleSection('workspaces')}
                        className="flex items-center gap-2 w-full px-2 py-1 mb-1 rounded-sm hover:bg-[var(--notion-bg-hover)] transition-all"
                    >
                        {expandedSections.workspaces ? (
                            <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--notion-text-tertiary)' }} />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--notion-text-tertiary)' }} />
                        )}
                        {!isCollapsed && (
                            <>
                                <span className="text-xs font-semibold uppercase tracking-wider flex-1 text-left" style={{ color: 'var(--notion-text-tertiary)' }}>
                                    Workspaces
                                </span>
                                <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" style={{ color: 'var(--notion-text-tertiary)' }} />
                            </>
                        )}
                    </button>

                    {expandedSections.workspaces && (
                        <div className="space-y-0.5 mt-1">
                            {spaces?.slice(0, 5).map(renderWorkspaceItem)}
                            {spaces && spaces.length > 5 && !isCollapsed && (
                                <button
                                    className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--notion-bg-hover)] transition-all flex items-center gap-2"
                                    style={{ color: 'var(--notion-text-tertiary)' }}
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                    <span>{spaces.length - 5} more...</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Utility Navigation */}
                <div className="p-3 space-y-0.5 border-t" style={{ borderColor: 'var(--notion-border-default)' }}>
                    {utilityNav.map(renderNavItem)}
                </div>
            </div>

            {/* Logout Button */}
            <div className="p-3 border-t" style={{ borderColor: 'var(--notion-border-default)' }}>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-3 px-2 py-1.5 rounded-sm text-sm transition-all hover:bg-[var(--notion-bg-hover)]"
                    style={{ color: 'var(--notion-text-secondary)' }}
                >
                    <LogOut className="w-[18px] h-[18px]" />
                    {!isCollapsed && <span className="flex-1 text-left font-medium">Log out</span>}
                </button>
            </div>
        </aside>
    );
}
