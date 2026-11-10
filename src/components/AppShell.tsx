'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import CommandCenter from "@/components/CommandCenter";
import BottomTabBar from "@/components/BottomTabBar";
import { ToastProvider } from "@/context/ToastContext";
import { SpaceProvider } from "@/context/SpaceContext";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = 'eusai-sidebar-collapsed';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    // 768-1023px: the sidebar stays on screen as an icon rail and expands as an overlay.
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px) and (max-width: 1023.98px)');
        const update = () => setIsTablet(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        try {
            setIsSidebarCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
        } catch { }
    }, []);

    // Close the mobile drawer whenever the route changes.
    useEffect(() => setIsMobileMenuOpen(false), [pathname]);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(prev => {
            try { localStorage.setItem(COLLAPSE_KEY, prev ? '0' : '1'); } catch { }
            return !prev;
        });
    };

    // Login, the public legal pages and the design preview render without the app shell.
    if (['/login', '/privacy', '/terms', '/design-preview'].includes(pathname)) {
        return <ToastProvider>{children}</ToastProvider>;
    }

    // Chat and the AI assistant use the full content area, edge to edge.
    const isImmersivePage = pathname === '/inbox' || pathname === '/ai-assistant';

    return (
        <SpaceProvider>
            <ToastProvider>
                <CommandCenter />
                <div className="relative flex min-h-screen max-w-full overflow-x-clip">
                    <div className={cn(
                        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
                        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                    )}>
                        <Sidebar
                            isCollapsed={isTablet ? !isMobileMenuOpen : isSidebarCollapsed}
                            toggleSidebar={isTablet ? () => setIsMobileMenuOpen(v => !v) : toggleSidebar}
                            closeMobileMenu={() => setIsMobileMenuOpen(false)}
                        />
                    </div>

                    {isMobileMenuOpen && (
                        // above the tab bar (z-45), below the drawer (z-50)
                        <div className="fixed inset-0 z-[48] bg-black/70 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
                    )}

                    <div className={cn(
                        "flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-300",
                        "md:ml-[76px]", isSidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-[264px]"
                    )}>
                        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
                        <main className={cn("w-full flex-1", isImmersivePage ? "pb-[var(--tabbar-h)]" : "mx-auto max-w-[1480px] px-4 pb-[calc(var(--tabbar-h)+2rem)] pt-6 sm:px-6 md:pb-12 lg:px-10 lg:pt-8")}>
                            {children}
                        </main>
                    </div>
                </div>
                <BottomTabBar moreOpen={isMobileMenuOpen} onMoreClick={() => setIsMobileMenuOpen(v => !v)} />
            </ToastProvider>
        </SpaceProvider>
    );
}
