'use client';

import { usePathname } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import CommandCenter from "@/components/CommandCenter";
import NotificationCenter from "@/components/NotificationCenter";
import { ToastProvider } from "@/context/ToastContext";
import { useState } from 'react';
import { cn } from "@/lib/utils";
import { SpaceProvider } from "@/context/SpaceContext";
import MobileDock from "@/components/MobileDock";
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const lastNotifId = useRef<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Browser Notifications are now handled via Service Workers (Push API)
    // Audio alerts can still be initialized if needed for in-app events
    useEffect(() => {
        if (!session?.user || typeof window === 'undefined') return;

        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audioRef.current.volume = 0.5;
    }, [session]);
    const pathname = usePathname();
    const isAuthPage = pathname === '/login';

    if (isAuthPage) {
        // Auth pages: no sidebar/navbar
        return (
            <ToastProvider>
                {children}
            </ToastProvider>
        );
    }

    const isAIPage = pathname === '/ai-assistant';
    const isInboxPage = pathname === '/inbox';
    const isImmersivePage = isAIPage || isInboxPage;

    // App pages: full layout with sidebar + navbar
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <SpaceProvider>
            <ToastProvider>
                <CommandCenter />
                <div className="flex min-h-screen relative max-w-full overflow-x-hidden" style={{ backgroundColor: isImmersivePage ? '#050505' : 'var(--notion-bg-primary)' }}>
                    {/* Sidebar: Fixed position always */}
                    <aside className={cn(
                        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
                        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    )}>
                        <Sidebar
                            isCollapsed={isSidebarCollapsed}
                            toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            closeMobileMenu={() => setIsMobileMenuOpen(false)}
                        />
                    </aside>

                    {/* Mobile Overlay Backdrop */}
                    {isMobileMenuOpen && (
                        <div
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-300"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    )}

                    <div
                        className={cn(
                            "flex-1 flex flex-col min-h-screen transition-all duration-300 max-w-full overflow-x-hidden",
                            isSidebarCollapsed ? "lg:ml-16" : "lg:ml-60"
                        )}
                        style={{ backgroundColor: isImmersivePage ? '#050505' : 'var(--notion-bg-primary)' }}
                    >
                        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
                        <main
                            className={cn(
                                "flex-1 overflow-y-auto pb-32 lg:pb-8",
                                isImmersivePage ? "p-0" : "p-2 sm:p-4 md:p-8"
                            )}
                            style={{ backgroundColor: isImmersivePage ? '#050505' : 'var(--notion-bg-primary)' }}
                        >
                            {children}
                        </main>
                    </div>
                </div>
                {/* Mobile Dock - Superb Navigation */}
                {/* Mobile Dock - Superb Navigation */}
                <div className="lg:hidden">
                    <MobileDock
                        onMenuClick={() => setIsMobileMenuOpen(true)}
                        closeMenu={() => setIsMobileMenuOpen(false)}
                    />
                </div>
            </ToastProvider>
        </SpaceProvider>
    );
}
