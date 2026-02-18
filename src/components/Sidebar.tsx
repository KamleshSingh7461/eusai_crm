"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    BarChart3,
    Briefcase,
    CheckSquare,
    FileText,
    Home,
    Users,
    User,
    Plus,
    Layout,
    Grid,
    ChevronRight,
    Search,
    Clock,
    Star,
    Layers,
    Calendar,
    Filter,
    Table,
    Target,
    MoreHorizontal,
    ExternalLink,
    ChevronLeft,
    GraduationCap,
    X,
    LogOut,
    Loader2,
    Shield,
    Sparkles,
    Inbox as InboxIcon,
    Video,
    Library as LibraryIcon,
    FileEdit,
    Zap,
    StickyNote,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpace } from '@/context/SpaceContext';
import { useSession, signOut } from 'next-auth/react';
import ExpandableSection from '@/components/ui/ExpandableSection';

import { useToast } from '@/context/ToastContext';
import { useState } from 'react';

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    closeMobileMenu?: () => void;
}

export default function Sidebar({ isCollapsed, toggleSidebar, closeMobileMenu }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const { activeSpace, setActiveSpace, spaces, isLoading, refreshSpaces } = useSpace();
    const { showToast } = useToast();

    // Space Creation Modal State
    const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [spaceForms, setSpaceForms] = useState({
        name: '',
        description: '',
        color: '#0052CC',
        type: 'STANDARD'
    });

    const userRole = (session?.user as any)?.role || 'EMPLOYEE';
    const canManageTeam = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);
    const canCreateSpace = ['DIRECTOR', 'MANAGER'].includes(userRole);


    const canViewResources = ['DIRECTOR', 'MANAGER'].includes(userRole);

    const handleCreateSpace = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/spaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(spaceForms)
            });

            if (res.ok) {
                showToast('Space created successfully', 'success');
                setIsSpaceModalOpen(false);
                setSpaceForms({ name: '', description: '', color: '#0052CC', type: 'STANDARD' });
                refreshSpaces();
            } else {
                showToast('Failed to create space', 'error');
            }
        } catch (error) {
            showToast('Error creating space', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Notion-style Top Level Navigation
    const topLevelNav = [
        { name: 'Search', href: '#', icon: Search, action: 'search' },
        { name: 'Home', href: '/', icon: Home },
        { name: 'Meetings', href: '/meetings', icon: Video },
        { name: 'EUSAI AI (Coming Soon)', href: '/ai-assistant', icon: Sparkles },
        { name: 'Inbox', href: '/inbox', icon: InboxIcon },
        { name: 'Issues', href: '/issues', icon: AlertTriangle },
        { name: 'Library', href: '/library', icon: LibraryIcon },
        { name: 'Report', href: '/reports', icon: Table },
        { name: 'Recents', href: '/recent', icon: Clock },
    ];

    const spaceColors = [
        '#0052CC', '#36B37E', '#FF5630', '#FFAB00', '#6554C0', '#00B8D9', '#0747A6', '#172B4D'
    ];

    return (
        <>
            <aside className={cn(
                "h-screen flex flex-col p-0 border-r border-[#2f2f2f] transition-all duration-300 ease-in-out overscroll-contain backdrop-blur-xl bg-[#191919]/90 supports-[backdrop-filter]:bg-[#191919]/80",
                isCollapsed ? "w-16" : "w-60"
            )}>
                <div className={cn("flex flex-col mb-4", isCollapsed ? "pt-3 px-2 pb-2" : "pt-3 px-4 pb-2")}>
                    <div className="flex items-center justify-between">
                        <div />

                        <div className="flex items-center gap-1">
                            <button
                                onClick={toggleSidebar}
                                className={cn(
                                    "text-[rgba(255,255,255,0.6)] p-1 h-8 w-8 hover:bg-[#2c2c2c] rounded-sm transition-transform hidden lg:flex items-center justify-center",
                                    isCollapsed ? "absolute -right-3 top-14 bg-[#191919] border border-[#2f2f2f] rounded-full p-0.5 shadow-sm rotate-180" : ""
                                )}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {/* Mobile Close Button */}
                            <button
                                onClick={closeMobileMenu}
                                className="text-[rgba(255,255,255,0.6)] p-1 h-8 w-8 hover:bg-[#2c2c2c] rounded-sm lg:hidden flex items-center justify-center"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Logo Section */}
                    <div className={cn("flex items-center gap-3 px-2 py-1 mb-2 transition-all duration-300", isCollapsed ? "justify-center" : "")}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img src="/EUSAI-LOGO.png" alt="EUSAI" className="w-full h-full object-contain" />
                        </div>
                        {!isCollapsed && (
                            <span className="font-bold text-base text-[rgba(255,255,255,0.9)] whitespace-nowrap tracking-tight animate-in fade-in duration-300">EUSAI TEAM</span>
                        )}
                    </div>
                </div>

                <nav
                    className="flex-1 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden overscroll-contain"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255,255,255,0.2) transparent',
                        overscrollBehavior: 'contain'
                    }}
                >
                    {/* Top-Level Navigation (Notion Style - No Groups) */}
                    <div className="space-y-0.5 mb-4">
                        {topLevelNav.map((item) => (
                            item.action === 'search' ? (
                                <div
                                    key={item.name}
                                    className={cn(
                                        "sidebar-link-eusai cursor-pointer group",
                                        isCollapsed && "justify-center px-0 py-2"
                                    )}
                                    title={isCollapsed ? item.name : undefined}
                                >
                                    <item.icon className="w-4 h-4 text-[rgba(255,255,255,0.6)] flex-shrink-0" />
                                    {!isCollapsed && (
                                        <>
                                            <span className="whitespace-nowrap">{item.name}</span>
                                            <span className="ml-auto text-[10px] text-[rgba(255,255,255,0.4)] hidden group-hover:block">⌘K</span>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeMobileMenu}
                                    className={cn(
                                        "sidebar-link-eusai relative group",
                                        pathname === item.href && "active",
                                        isCollapsed && "justify-center px-0 py-2"
                                    )}
                                    title={isCollapsed ? item.name : undefined}
                                >
                                    <item.icon className={cn("w-4 h-4 flex-shrink-0", pathname === item.href ? "text-white" : "text-[rgba(255,255,255,0.6)]")} />
                                    {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                                </Link>
                            )
                        ))}
                    </div>

                    {/* Private Section */}
                    {!isCollapsed && (
                        <ExpandableSection
                            title="Private"
                            defaultExpanded={false}
                            storageKey="sidebar-private-expanded"
                            className="mb-3"
                            actions={
                                <button className="p-1 hover:bg-[#DFE1E6] rounded-sm transition-colors">
                                    <Plus className="w-3.5 h-3.5 text-[#6B778C]" />
                                </button>
                            }
                        >
                            <div className="space-y-0.5">
                                <Link
                                    href="/welcome"
                                    onClick={closeMobileMenu}
                                    className={cn(
                                        "sidebar-link-eusai text-xs pl-6",
                                        pathname === '/welcome' && "active"
                                    )}
                                >
                                    <FileEdit className={cn("w-3.5 h-3.5 flex-shrink-0", pathname === '/welcome' ? "text-[#0052CC]" : "text-[#6B778C]")} />
                                    <span className="whitespace-nowrap">Welcome to EUSAI</span>
                                </Link>
                                <div
                                    className="sidebar-link-eusai text-xs pl-6 cursor-pointer text-[#97A0AF] hover:text-[#42526E]"
                                >
                                    <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="whitespace-nowrap">Add New</span>
                                </div>
                            </div>
                        </ExpandableSection>
                    )}

                    {/* Teamspaces Section */}
                    {!isCollapsed && (
                        <ExpandableSection
                            title="Teamspaces"
                            defaultExpanded={true}
                            storageKey="sidebar-teamspaces-expanded"
                            className="mb-3"
                        >
                            <div className="space-y-0.5">
                                {/* Projects with nested Milestones & Tasks */}
                                <ExpandableSection
                                    title="Projects"
                                    icon={<Briefcase className="w-3.5 h-3.5" />}
                                    defaultExpanded={true}
                                    storageKey="sidebar-projects-expanded"
                                >
                                    <div className="space-y-0.5">
                                        <Link
                                            href="/projects"
                                            onClick={closeMobileMenu}
                                            className={cn(
                                                "sidebar-link-eusai text-xs pl-12",
                                                pathname === '/projects' && "active"
                                            )}
                                        >
                                            <Grid className={cn("w-3.5 h-3.5 flex-shrink-0", pathname === '/projects' ? "text-[#0052CC]" : "text-[#6B778C]")} />
                                            <span className="whitespace-nowrap">All Projects</span>
                                        </Link>
                                        <Link
                                            href="/milestones"
                                            onClick={closeMobileMenu}
                                            className={cn(
                                                "sidebar-link-eusai text-xs pl-12",
                                                pathname === '/milestones' && "active"
                                            )}
                                        >
                                            <Target className={cn("w-3.5 h-3.5 flex-shrink-0", pathname === '/milestones' ? "text-[#0052CC]" : "text-[#6B778C]")} />
                                            <span className="whitespace-nowrap">Milestones</span>
                                        </Link>
                                        <Link
                                            href="/tasks"
                                            onClick={closeMobileMenu}
                                            className={cn(
                                                "sidebar-link-eusai text-xs pl-12",
                                                pathname === '/tasks' && "active"
                                            )}
                                        >
                                            <CheckSquare className={cn("w-3.5 h-3.5 flex-shrink-0", pathname === '/tasks' ? "text-[#0052CC]" : "text-[#6B778C]")} />
                                            <span className="whitespace-nowrap">Tasks</span>
                                        </Link>
                                    </div>
                                </ExpandableSection>


                                {/* Notes Maker */}
                                <Link
                                    href="/notes"
                                    onClick={closeMobileMenu}
                                    className={cn(
                                        "sidebar-link-eusai text-xs pl-6",
                                        pathname === '/notes' && "active"
                                    )}
                                >
                                    <StickyNote className={cn("w-3.5 h-3.5 flex-shrink-0", pathname === '/notes' ? "text-[#0052CC]" : "text-[#6B778C]")} />
                                    <span className="whitespace-nowrap">Notes Maker</span>
                                </Link>

                                {/* Individual Spaces */}
                                {spaces && spaces.length > 0 && (
                                    <ExpandableSection
                                        title="Your Spaces"
                                        icon={<Layers className="w-3.5 h-3.5" />}
                                        defaultExpanded={true}
                                        storageKey="sidebar-spaces-expanded"
                                    >
                                        <div className="space-y-0.5">
                                            {spaces.map((space: any) => (
                                                <Link
                                                    key={space.id}
                                                    href={`/spaces/${space.id}`}
                                                    onClick={closeMobileMenu}
                                                    className={cn(
                                                        "sidebar-link-eusai text-xs pl-12",
                                                        pathname === `/spaces/${space.id}` && "active"
                                                    )}
                                                >
                                                    <div
                                                        className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                                                        style={{ backgroundColor: space.color || '#0052CC' }}
                                                    />
                                                    <span className="whitespace-nowrap truncate">{space.name}</span>
                                                </Link>
                                            ))}
                                            {canCreateSpace && (
                                                <div
                                                    onClick={() => setIsSpaceModalOpen(true)}
                                                    className="sidebar-link-eusai text-xs pl-12 cursor-pointer text-[rgba(255,255,255,0.5)] hover:text-[rgba(255,255,255,0.8)]"
                                                >
                                                    <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="whitespace-nowrap">Create Space</span>
                                                </div>
                                            )}
                                        </div>
                                    </ExpandableSection>
                                )}
                            </div>
                        </ExpandableSection>
                    )}

                    {/* EUSAI Apps Section */}
                    {!isCollapsed && (
                        <ExpandableSection
                            title="EUSAI Apps"
                            defaultExpanded={false}
                            storageKey="sidebar-apps-expanded"
                            icon={<Zap className="w-3.5 h-3.5" />}
                            className="mb-3"
                        >
                            <div className="space-y-0.5">
                                <div className="sidebar-link-eusai text-xs pl-6 cursor-pointer opacity-50">
                                    <Layers className="w-3.5 h-3.5 flex-shrink-0 text-[#6B778C]" />
                                    <span className="whitespace-nowrap">Coming Soon...</span>
                                </div>
                            </div>
                        </ExpandableSection>
                    )}

                    {/* Additional Sections based on Role */}
                    {!isCollapsed && (
                        <div className="pt-4 border-t border-[#EBECF0] space-y-0.5">

                            {canViewResources && (
                                <>
                                    <Link
                                        href="/resources"
                                        onClick={closeMobileMenu}
                                        className={cn(
                                            "sidebar-link-eusai",
                                            pathname === '/resources' && "active"
                                        )}
                                    >
                                        <Layers className={cn("w-4 h-4 flex-shrink-0", pathname === '/resources' ? "text-[#0052CC]" : "text-[#42526E]")} />
                                        <span className="whitespace-nowrap">Resources</span>
                                    </Link>
                                </>
                            )}
                            <Link
                                href="/universities"
                                onClick={closeMobileMenu}
                                className={cn(
                                    "sidebar-link-eusai",
                                    pathname === '/universities' && "active"
                                )}
                            >
                                <GraduationCap className={cn("w-4 h-4 flex-shrink-0", pathname === '/universities' ? "text-[#0052CC]" : "text-[#42526E]")} />
                                <span className="whitespace-nowrap">Universities</span>
                            </Link>
                            {canManageTeam && (
                                <Link
                                    href="/team"
                                    onClick={closeMobileMenu}
                                    className={cn(
                                        "sidebar-link-eusai",
                                        pathname === '/team' && "active"
                                    )}
                                >
                                    <Users className={cn("w-4 h-4 flex-shrink-0", pathname === '/team' ? "text-[#0052CC]" : "text-[#42526E]")} />
                                    <span className="whitespace-nowrap">Team</span>
                                </Link>
                            )}
                            {userRole === 'DIRECTOR' && (
                                <Link
                                    href="/admin"
                                    onClick={closeMobileMenu}
                                    className={cn(
                                        "sidebar-link-eusai",
                                        pathname === '/admin' && "active"
                                    )}
                                >
                                    <Shield className={cn("w-4 h-4 flex-shrink-0", pathname === '/admin' ? "text-[#0052CC]" : "text-[#42526E]")} />
                                    <span className="whitespace-nowrap">System Admin</span>
                                </Link>
                            )}
                        </div>
                    )}
                </nav>

                {/* Bottom Section - Fixed at bottom */}
                <div className="flex-shrink-0 border-t border-[#2f2f2f]">
                    <div className={cn("pt-2 mb-2 space-y-1", isCollapsed ? "px-2" : "px-3")}>
                        {session?.user && (
                            <div className={cn("rounded-sm transition-colors", isCollapsed ? "p-1 flex justify-center hover:bg-[#2c2c2c]" : "px-3 py-2")}>
                                <div className={cn("flex items-center gap-2", !isCollapsed && "mb-1")}>
                                    <div className="w-8 h-8 rounded-full bg-[#191919] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-white font-bold text-xs overflow-hidden flex-shrink-0">
                                        {(session.user as any).image ? <img src={(session.user as any).image} alt="" className="w-full h-full object-cover" /> : (session.user.name?.charAt(0) || 'U').toUpperCase()}
                                    </div>
                                    {!isCollapsed && (
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-xs font-bold text-[rgba(255,255,255,0.9)] truncate">{session.user.name || 'User'}</span>
                                            <span className="text-[10px] text-[rgba(255,255,255,0.5)] truncate">{session.user.email}</span>
                                        </div>
                                    )}
                                </div>
                                {!isCollapsed && (
                                    <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.7)] text-[10px] font-bold uppercase tracking-wider">
                                        {(session.user as any).role || 'Employee'}
                                    </div>
                                )}
                            </div>
                        )}
                        <Link
                            href="/profile"
                            onClick={closeMobileMenu}
                            className={cn(
                                "sidebar-link-eusai",
                                pathname === '/profile' && "active",
                                isCollapsed && "justify-center px-0 py-2"
                            )} title={isCollapsed ? "Profile" : undefined}>
                            <User className={cn("w-4 h-4 flex-shrink-0", pathname === '/profile' ? "text-[#0052CC]" : "text-[rgba(255,255,255,0.6)]")} />
                            {!isCollapsed && <span className="text-xs font-medium whitespace-nowrap">Profile</span>}
                        </Link>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className={cn("sidebar-link-eusai w-full text-left", isCollapsed && "justify-center px-0 py-2")}
                            title={isCollapsed ? "Log Out" : undefined}
                        >
                            <LogOut className="w-4 h-4 text-[rgba(255,255,255,0.6)] flex-shrink-0" />
                            {!isCollapsed && <span className="text-xs font-medium whitespace-nowrap">Log Out</span>}
                        </button>
                    </div>
                </div>
            </aside >

            {/* Create Space Modal */}
            {
                isSpaceModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#091E42]/50 backdrop-blur-sm p-4">
                        <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                            <div className="px-6 py-4 flex items-center justify-between border-b border-[#DFE1E6]">
                                <h2 className="text-lg font-bold text-[#172B4D]">Create New Space</h2>
                                <button onClick={() => setIsSpaceModalOpen(false)} className="text-[#6B778C] hover:text-[#172B4D] transition-colors">
                                    <ChevronRight className="w-5 h-5 rotate-90" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSpace} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#6B778C] uppercase tracking-wider mb-1">Space Name</label>
                                    <input
                                        required
                                        value={spaceForms.name}
                                        onChange={(e) => setSpaceForms({ ...spaceForms, name: e.target.value })}
                                        className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm py-2 px-3 text-sm text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all"
                                        placeholder="e.g. University Relations"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#6B778C] uppercase tracking-wider mb-1">Description</label>
                                    <textarea
                                        value={spaceForms.description}
                                        onChange={(e) => setSpaceForms({ ...spaceForms, description: e.target.value })}
                                        className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm py-2 px-3 text-sm text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all min-h-[80px]"
                                        placeholder="Describe the purpose of this space..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#6B778C] uppercase tracking-wider mb-1">Type</label>
                                        <select
                                            value={spaceForms.type}
                                            onChange={(e) => setSpaceForms({ ...spaceForms, type: e.target.value })}
                                            className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm py-2 px-3 text-sm text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all"
                                        >
                                            <option value="STANDARD">Standard</option>
                                            <option value="DEPARTMENT">Department</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#6B778C] uppercase tracking-wider mb-1">Theme Color</label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {spaceColors.map(color => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setSpaceForms({ ...spaceForms, color })}
                                                    className={cn(
                                                        "w-6 h-6 rounded-sm border-2 transition-all",
                                                        spaceForms.color === color ? "border-[#172B4D] scale-110" : "border-transparent"
                                                    )}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#DFE1E6] mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsSpaceModalOpen(false)}
                                        className="px-4 py-2 text-sm font-bold text-[#42526E] hover:bg-[#EBECF0] rounded-sm transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2 bg-[#0052CC] text-white text-sm font-bold rounded-sm hover:bg-[#0747A6] transition-colors flex items-center gap-2 disabled:bg-[#DEEBFF] disabled:text-[#0052CC] disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Create Space
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </>
    );
}
