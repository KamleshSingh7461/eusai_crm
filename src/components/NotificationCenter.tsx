"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, Info, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    isRead: boolean;
    link?: string;
    createdAt: string;
}

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const popupRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch and polling
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
        } catch (error) {
            console.error("Failed to mark as read", error);
            fetchNotifications(); // Revert on error
        }
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true })
            });
        } catch (error) {
            fetchNotifications();
        }
    };

    const clearAll = async () => {
        setNotifications([]);
        setUnreadCount(0);
        try {
            await fetch('/api/notifications?clearAll=true', { method: 'DELETE' });
        } catch (error) {
            fetchNotifications();
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
            setIsOpen(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'WARNING': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'ERROR': return <AlertOctagon className="w-4 h-4 text-red-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={popupRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-200 md:rounded-lg md:text-zinc-300 transition hover:bg-white/[0.06] active:bg-white/[0.08] md:h-9 md:w-9 md:border md:border-white/[0.07] md:bg-white/[0.03]"
                title="Notifications"
                aria-label="Notifications"
            >
                <Bell className={cn("h-[19px] w-[19px]", isOpen && "text-[#3B82F6]")} />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-semibold text-white ring-2 ring-[#07090D] animate-in zoom-in duration-200">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsOpen(false)} />
                    <div className="fixed left-3 right-3 top-[calc(3.5rem+env(safe-area-inset-top)+0.5rem)] w-auto md:top-[4.5rem] lg:absolute lg:right-0 lg:top-full lg:left-auto lg:mt-2 lg:w-96 bg-[#18181B] rounded-2xl shadow-xl shadow-black/40 border border-white/[0.08] z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-[#FFFFFF14] flex items-center justify-between bg-white/[0.03]/50">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm text-[#E6EAF0]">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="bg-blue-500/15 text-blue-300 text-[11px] font-semibold px-1.5 py-0.5 rounded-full">{unreadCount} New</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="p-1.5 text-xs font-medium text-[#3B82F6] hover:bg-blue-500/10 rounded-sm transition-colors flex items-center gap-1"
                                        title="Mark all as read"
                                    >
                                        <Check className="w-3.5 h-3.5" /> Mark all read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-sm transition-colors"
                                        title="Clear all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar flex-1 bg-white/[0.03]">
                            {loading && notifications.length === 0 ? (
                                <div className="p-5 sm:p-8 text-center text-zinc-400">
                                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                                    <p className="text-xs">Loading...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-5 sm:p-8 text-center">
                                    <div className="w-12 h-12 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Bell className="w-6 h-6 text-zinc-400" />
                                    </div>
                                    <p className="text-sm font-medium text-fg">All caught up!</p>
                                    <p className="text-xs text-zinc-400 mt-1">No new notifications to show.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={cn(
                                                "p-4 hover:bg-white/[0.03] cursor-pointer transition-colors relative group",
                                                !notification.isRead && "bg-blue-500/10/30"
                                            )}
                                        >
                                            <div className="flex gap-3 items-start">
                                                <div className="mt-0.5 flex-shrink-0">
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={cn("text-sm font-medium text-[#E6EAF0]", !notification.isRead && "font-semibold")}>
                                                            {notification.title}
                                                        </p>
                                                        <span className="text-[11px] text-zinc-400 whitespace-nowrap flex-shrink-0">
                                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-[#A0A9B8] mt-0.5 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                {!notification.isRead && (
                                                    <div className="w-2 h-2 bg-[#1F1F23] rounded-full mt-1.5 flex-shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
