"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    BarChart3,
    Briefcase,
    CheckSquare,
    FileText,
    Home,
    MessageSquare,
    Settings,
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
    Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpace } from '@/context/SpaceContext';
import { useSession, signOut } from 'next-auth/react';

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

    const canViewAnalytics = ['DIRECTOR', 'MANAGER'].includes(userRole);
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

    const businessModules = [
        { name: 'Dashboard', href: '/', icon: Home },
        { name: 'Projects', href: '/projects', icon: Briefcase },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare },
        { name: 'Milestones', href: '/milestones', icon: Target },
        ...(canViewResources ? [{ name: 'Issues', href: '/issues', icon: FileText }] : []),
        ...(canViewAnalytics ? [{ name: 'Analytics', href: '/analytics', icon: BarChart3 }] : []),
        { name: 'Universities', href: '/universities', icon: GraduationCap },
        ...(canManageTeam ? [{ name: 'Team', href: '/team', icon: Users }] : []),
        ...(canViewResources ? [{ name: 'Resources', href: '/resources', icon: Layers }] : []),
        { name: 'Reports', href: '/reports', icon: Table },
        ...(userRole === 'DIRECTOR' ? [{ name: 'System Admin', href: '/admin', icon: Shield }] : []),
    ];

    const canSubmitReport = !['DIRECTOR', 'MANAGER'].includes(userRole);

    const collaborationItems = [
        { name: 'Messages', href: '/messages', icon: MessageSquare },
        ...(canSubmitReport ? [{ name: 'Submit Report', href: '/reports/submit', icon: FileText }] : []),
    ];

    const utilityNav = [
        { name: 'Recent', href: '/recent', icon: Clock, hasChevron: true },
        { name: 'Starred', href: '/starred', icon: Star, hasChevron: true },
        { name: 'Apps', href: '/apps', icon: Layers, hasChevron: true },
    ];

    const spaceColors = [
        '#0052CC', '#36B37E', '#FF5630', '#FFAB00', '#6554C0', '#00B8D9', '#0747A6', '#172B4D'
    ];

    return (
        <>
            <aside className={cn(
                "bg-[#FAFBFC] h-full flex flex-col p-0 border-r border-[#DFE1E6] transition-all duration-300 ease-in-out",
                isCollapsed ? "w-16" : "w-60"
            )}>
                <div className={cn("flex flex-col mb-4", isCollapsed ? "p-2" : "pt-3 px-4 pb-2")}>
                    <div className="flex items-center justify-between">
                        <div />

                        <div className="flex items-center gap-1">
                            <button
                                onClick={toggleSidebar}
                                className={cn(
                                    "text-[#42526E] p-1 h-8 w-8 hover:bg-[#EBECF0] rounded-sm transition-transform hidden lg:flex items-center justify-center",
                                    isCollapsed ? "absolute -right-3 top-4 bg-white border border-[#DFE1E6] rounded-full p-0.5 shadow-sm rotate-180" : ""
                                )}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {/* Mobile Close Button */}
                            <button
                                onClick={closeMobileMenu}
                                className="text-[#42526E] p-1 h-8 w-8 hover:bg-[#EBECF0] rounded-sm lg:hidden flex items-center justify-center"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {!isCollapsed && (
                        <div className="flex items-center gap-1.5 px-1 py-0.5 rounded-sm hover:bg-[#EBECF0] cursor-pointer">
                            <div className="w-6 h-6 rounded-sm bg-white border border-[#DFE1E6] flex items-center justify-center overflow-hidden flex-shrink-0">
                                <img src="/EUSAI-LOGO.png" alt="EUSAI" className="w-full h-full object-contain" />
                            </div>
                            <span className="font-bold text-sm text-[#172B4D] whitespace-nowrap">EUSAI TEAM</span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar overflow-x-hidden">
                    {/* Core Business Modules */}
                    <div className="mb-4">
                        {!isCollapsed && (
                            <div className="px-3 mb-1">
                                <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider whitespace-nowrap">Workspace</span>
                            </div>
                        )}
                        {businessModules.map((item) => (
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
                                <item.icon className={cn("w-4 h-4 flex-shrink-0", pathname === item.href ? "text-[#0052CC]" : "text-[#42526E]")} />
                                {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                            </Link>
                        ))}
                    </div>

                    {/* Spaces Section */}
                    <div className="mt-4 mb-4">
                        <div className={cn("flex items-center mb-1", isCollapsed ? "justify-center" : "px-3 justify-between")}>
                            {!isCollapsed && <Link href="/spaces" className="text-xs font-bold text-[#6B778C] hover:text-[#0052CC] transition-colors whitespace-nowrap">Spaces</Link>}
                            {canCreateSpace && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setIsSpaceModalOpen(true)}
                                        className={cn("flex items-center justify-center text-[#6B778C] hover:bg-[#EBECF0] rounded-sm transition-colors", isCollapsed ? "w-8 h-8" : "w-5 h-5")}
                                        title="Create Space"
                                    >
                                        <Plus className={cn(isCollapsed ? "w-4 h-4" : "w-3.5 h-3.5")} />
                                    </button>
                                </div>
                            )}
                        </div>
                        {isLoading ? (
                            !isCollapsed && <div className="px-3 py-2 text-xs text-[#6B778C] whitespace-nowrap">Loading...</div>
                        ) : spaces.length === 0 ? (
                            !isCollapsed && <div className="px-3 py-2 text-xs text-[#6B778C] whitespace-nowrap">No spaces</div>
                        ) : (
                            spaces.slice(0, 5).map(space => (
                                <div
                                    key={space.id}
                                    onClick={() => {
                                        setActiveSpace(space);
                                        router.push(`/spaces/${space.id}`);
                                        closeMobileMenu?.();
                                    }}
                                    className={cn(
                                        "sidebar-link-eusai cursor-pointer group relative",
                                        (activeSpace?.id === space.id || pathname === `/spaces/${space.id}`) && "bg-[#DEEBFF] border-l-2 border-l-[#0052CC]",
                                        isCollapsed && "justify-center px-0 py-2"
                                    )}
                                    title={isCollapsed ? space.name : undefined}
                                >
                                    <div
                                        className={cn(
                                            "w-5 h-5 rounded-sm flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0",
                                        )}
                                        style={{ backgroundColor: space.color }}
                                    >
                                        {space.name.split(' ').map((word: string) => word[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                    {!isCollapsed && (
                                        <>
                                            <span className={cn(
                                                "text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis ml-2",
                                                activeSpace?.id === space.id ? "text-[#0052CC] font-bold" : "text-[#42526E] group-hover:text-[#172B4D]"
                                            )}>{space.name}</span>
                                            {activeSpace?.id === space.id && (
                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0052CC]" />
                                            )}
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Collaboration & Social */}
                    <div className="mt-4 mb-4">
                        {!isCollapsed && (
                            <div className="px-3 mb-1">
                                <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider whitespace-nowrap">Collaboration</span>
                            </div>
                        )}
                        {collaborationItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={closeMobileMenu}
                                className={cn(
                                    "sidebar-link-eusai group",
                                    pathname === item.href && "active",
                                    isCollapsed && "justify-center px-0 py-2"
                                )}
                                title={isCollapsed ? item.name : undefined}
                            >
                                <item.icon className={cn("w-4 h-4 flex-shrink-0", pathname === item.href ? "text-[#0052CC]" : "text-[#42526E]")} />
                                {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                            </Link>
                        ))}
                    </div>

                    {/* Utility Style Utilities */}
                    <div className="mt-4 pt-4 border-t border-[#EBECF0] space-y-0.5">
                        {utilityNav.map((item) => (
                            <div
                                key={item.name}
                                onClick={closeMobileMenu}
                                className={cn("sidebar-link-eusai group cursor-pointer", isCollapsed && "justify-center px-0 py-2")}
                                title={isCollapsed ? item.name : undefined}
                            >
                                <item.icon className="w-4 h-4 text-[#42526E] flex-shrink-0" />
                                {!isCollapsed && (
                                    <>
                                        <span className="text-xs font-medium text-[#42526E] whitespace-nowrap">{item.name}</span>
                                        {item.hasChevron && <ChevronRight className="w-3 h-3 ml-auto text-[#6B778C] opacity-0 group-hover:opacity-100" />}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </nav>

                {/* Bottom Section */}
                <div className="mt-auto p-2 border-t border-[#DFE1E6]">
                    <div className="pt-2 border-t border-[#EBECF0] mb-2 space-y-1">
                        {session?.user && (
                            <div className={cn("rounded-sm transition-colors", isCollapsed ? "p-1 flex justify-center hover:bg-[#EBECF0]" : "px-3 py-2")}>
                                <div className={cn("flex items-center gap-2", !isCollapsed && "mb-1")}>
                                    <div className="w-8 h-8 rounded-full bg-[#DEEBFF] flex items-center justify-center text-[#0052CC] font-bold text-xs overflow-hidden flex-shrink-0 ring-2 ring-white">
                                        {(session.user as any).image ? <img src={(session.user as any).image} alt="" className="w-full h-full object-cover" /> : (session.user.name?.charAt(0) || 'U').toUpperCase()}
                                    </div>
                                    {!isCollapsed && (
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-xs font-bold text-[#172B4D] truncate">{session.user.name || 'User'}</span>
                                            <span className="text-[10px] text-[#6B778C] truncate">{session.user.email}</span>
                                        </div>
                                    )}
                                </div>
                                {!isCollapsed && (
                                    <div className="inline-flex items-center px-1.5 py-0.5 roundedElement bg-[#EAE6FF] text-[#403294] text-[10px] font-bold uppercase tracking-wider">
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
                            <User className={cn("w-4 h-4 flex-shrink-0", pathname === '/profile' ? "text-[#0052CC]" : "text-[#42526E]")} />
                            {!isCollapsed && <span className="text-xs font-medium whitespace-nowrap">Profile</span>}
                        </Link>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className={cn("sidebar-link-eusai w-full text-left text-red-600 hover:bg-red-50", isCollapsed && "justify-center px-0 py-2")}
                            title={isCollapsed ? "Log Out" : undefined}
                        >
                            <LogOut className="w-4 h-4 text-red-500 flex-shrink-0" />
                            {!isCollapsed && <span className="text-xs font-medium whitespace-nowrap">Log Out</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Create Space Modal */}
            {isSpaceModalOpen && (
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
            )}
        </>
    );
}
