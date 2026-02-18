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

export default function AppShell({ children }: { children: React.ReactNode }) {
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

    // App pages: full layout with sidebar + navbar
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <SpaceProvider>
            <ToastProvider>
                <CommandCenter />
                <div className="flex min-h-screen relative max-w-full overflow-x-hidden" style={{ backgroundColor: 'var(--notion-bg-primary)' }}>
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

                    {/* Main Content - Add left margin to account for fixed sidebar */}
                    <div
                        className={cn(
                            "flex-1 flex flex-col min-h-screen transition-all duration-300 max-w-full overflow-x-hidden",
                            isSidebarCollapsed ? "lg:ml-16" : "lg:ml-60"
                        )}
                        style={{ backgroundColor: 'var(--notion-bg-primary)' }}
                    >
                        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
                        <main
                            className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8 pb-24 lg:pb-8"
                            style={{ backgroundColor: 'var(--notion-bg-primary)' }}
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
