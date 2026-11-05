'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import CommandCenter from "@/components/CommandCenter";
import MobileDock from "@/components/MobileDock";
import { ToastProvider } from "@/context/ToastContext";
import { SpaceProvider } from "@/context/SpaceContext";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = 'eusai-sidebar-collapsed';

/** Soft brand glow behind every page. */
function AmbientBackground() {
    return (
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 left-1/4 h-[520px] w-[720px] rounded-full bg-blue-600/[0.12] blur-[140px]" />
            <div className="absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full bg-violet-600/[0.08] blur-[140px]" />
            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
    );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                <AmbientBackground />
                <div className="relative flex min-h-screen max-w-full overflow-x-hidden">
                    <div className={cn(
                        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
                        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    )}>
                        <Sidebar
                            isCollapsed={isSidebarCollapsed}
                            toggleSidebar={toggleSidebar}
                            closeMobileMenu={() => setIsMobileMenuOpen(false)}
                        />
                    </div>

                    {isMobileMenuOpen && (
                        // above the mobile dock (z-45), below the drawer (z-50)
                        <div className="fixed inset-0 z-[48] bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
                    )}

                    <div className={cn(
                        "flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-300",
                        isSidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-[264px]"
                    )}>
                        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
                        <main className={cn("w-full flex-1", isImmersivePage ? "pb-24 lg:pb-0" : "mx-auto max-w-[1480px] px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8")}>
                            {children}
                        </main>
                    </div>
                </div>
                <MobileDock onMenuClick={() => setIsMobileMenuOpen(true)} closeMenu={() => setIsMobileMenuOpen(false)} />
            </ToastProvider>
        </SpaceProvider>
    );
}
