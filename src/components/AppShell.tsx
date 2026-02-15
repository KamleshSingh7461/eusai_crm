'use client';

import { usePathname } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import CommandCenter from "@/components/CommandCenter";
import NotificationCenter from "@/components/NotificationCenter";
import FloatingChat from "@/components/FloatingChat";
import { ToastProvider } from "@/context/ToastContext";
import { useState } from 'react';
import { cn } from "@/lib/utils";
import { SpaceProvider } from "@/context/SpaceContext";

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
                <div className="flex min-h-screen bg-background relative">
                    {/* Sidebar: Overlay on mobile, persistent on desktop */}
                    <aside className={cn(
                        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 bg-[#FAFBFC]",
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

                    <div className={cn(
                        "flex-1 flex flex-col transition-all duration-300 ease-in-out w-full",
                        isSidebarCollapsed ? "lg:ml-0" : "lg:ml-0"
                        // Note: Sidebar is now fixed/relative combo. 
                        // If persistent on desktop, we might need margins.
                    )}>
                        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
                        <main className="flex-1 p-4 md:p-8">
                            {children}
                        </main>
                    </div>
                </div>
                <FloatingChat />
            </ToastProvider>
        </SpaceProvider>
    );
}
