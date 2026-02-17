"use client";

import { Inbox, Bell, MessageSquare, CheckCircle2, Filter, AlertCircle, Clock, Search, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Types matching API responses
interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    isRead: boolean;
    createdAt: string;
    link?: string;
}

interface Message {
    id: string;
    content: string;
    senderName: string;
    senderRole?: string;
    type: 'TEXT' | 'SYSTEM' | 'ALERT' | 'FILE';
    createdAt: string;
    isMe: boolean;
}

// Unified Inbox Item
interface InboxItemData {
    id: string;
    type: 'notification' | 'message' | 'alert';
    title: string;
    message: string;
    time: string;
    timestamp: Date;
    unread: boolean;
    sender?: string;
    link?: string;
}

export default function InboxPage() {
    const [activeTab, setActiveTab] = useState<'all' | 'notifications' | 'messages'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // State for data
    const [inboxItems, setInboxItems] = useState<InboxItemData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Parallel fetching
                const [notifRes, msgRes] = await Promise.all([
                    fetch('/api/notifications'),
                    fetch('/api/messages?channelId=global-announcements') // Fetch announcements as "messages" for now
                ]);

                const notifData = await notifRes.json();
                const msgData = await msgRes.json();

                // Process Notifications
                const notifications: InboxItemData[] = (notifData.notifications || []).map((n: Notification) => ({
                    id: n.id,
                    type: n.type === 'ERROR' || n.type === 'WARNING' ? 'alert' : 'notification',
                    title: n.title,
                    message: n.message,
                    time: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }),
                    timestamp: new Date(n.createdAt),
                    unread: !n.isRead,
                    sender: 'System',
                    link: n.link
                }));

                // Process Messages (Announcements)
                const messages: InboxItemData[] = (Array.isArray(msgData) ? msgData : []).map((m: Message) => ({
                    id: m.id,
                    type: m.type === 'ALERT' ? 'alert' : 'message',
                    title: m.senderName || 'Announcement',
                    message: m.content,
                    time: formatDistanceToNow(new Date(m.createdAt), { addSuffix: true }),
                    timestamp: new Date(m.createdAt),
                    unread: false, // Messages don't have read status index yet
                    sender: m.senderName,
                }));

                // Combine and Sort
                const combined = [...notifications, ...messages].sort((a, b) =>
                    b.timestamp.getTime() - a.timestamp.getTime()
                );

                setInboxItems(combined);
                setUnreadCount(notifData.unreadCount || 0);

            } catch (error) {
                console.error("Failed to fetch inbox data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredItems = inboxItems.filter(item => {
        // Filter by tab
        if (activeTab === 'notifications' && item.type === 'message') return false;
        if (activeTab === 'messages' && item.type !== 'message') return false;

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                item.title.toLowerCase().includes(query) ||
                item.message.toLowerCase().includes(query) ||
                (item.sender && item.sender.toLowerCase().includes(query))
            );
        }
        return true;
    });

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ markAll: true })
            });
            // Optimistic update
            setInboxItems(prev => prev.map(i => i.type === 'notification' || i.type === 'alert' ? { ...i, unread: false } : i));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all read", error);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-heading mb-1 tracking-tight flex items-center gap-2">
                        Inbox
                        {unreadCount > 0 && (
                            <span className="text-xs font-normal bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">
                                {unreadCount} new
                            </span>
                        )}
                    </h1>
                    <p className="text-subheading text-sm">Manage your notifications and messages.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={markAllRead}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm md:text-xs font-medium text-subheading bg-[var(--notion-bg-secondary)] hover:bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] rounded-md transition-colors"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark all read
                    </button>
                    <div className="relative hidden md:block">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-subheading" />
                        <input
                            type="text"
                            placeholder="Search inbox..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 text-sm bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-md focus:ring-1 focus:ring-[var(--notion-border-active)] focus:outline-none placeholder:text-subheading w-64 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--notion-border-default)] gap-6 overflow-x-auto scrollbar-none">
                {[
                    { id: 'all', label: 'All', icon: Inbox },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                    { id: 'messages', label: 'Messages', icon: MessageSquare },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "pb-3 text-sm font-medium flex items-center gap-2 transition-all border-b-2 whitespace-nowrap",
                            activeTab === tab.id
                                ? "text-heading border-heading"
                                : "text-subheading border-transparent hover:text-heading hover:border-[var(--notion-border-default)]"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Mobile Search - Visible only on mobile */}
            <div className="md:hidden">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-subheading" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-md focus:ring-1 focus:ring-[var(--notion-border-active)] focus:outline-none placeholder:text-subheading"
                    />
                </div>
            </div>

            {/* Inbox List */}
            <div className="space-y-2">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-subheading gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-sm">Loading inbox...</span>
                    </div>
                ) : filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                        <InboxItem key={item.id} item={item} />
                    ))
                ) : (
                    <div className="py-12 text-center border border-dashed border-[var(--notion-border-default)] rounded-lg bg-[var(--notion-bg-secondary)]/30">
                        <Inbox className="w-10 h-10 text-subheading mx-auto mb-3 opacity-50" />
                        <p className="text-subheading text-sm">No items found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function InboxItem({ item }: { item: InboxItemData }) {
    const getIcon = () => {
        switch (item.type) {
            case 'notification': return Bell;
            case 'message': return MessageSquare;
            case 'alert': return AlertCircle;
            default: return Inbox;
        }
    };

    const Icon = getIcon();

    return (
        <div className={cn(
            "group p-4 border border-[var(--notion-border-default)] rounded-lg transition-all cursor-pointer relative overflow-hidden",
            item.unread
                ? "bg-[var(--notion-bg-secondary)] border-l-4 border-l-blue-500 shadow-sm"
                : "bg-[var(--notion-bg-primary)] hover:bg-[var(--notion-bg-secondary)] opacity-80 hover:opacity-100"
        )}>
            <div className="flex items-start gap-4">
                <div className={cn(
                    "p-2 rounded-md flex-shrink-0",
                    item.type === 'alert' ? "bg-red-500/10 text-red-500" :
                        item.unread ? "bg-blue-500/10 text-blue-500" : "bg-[var(--notion-bg-tertiary)] text-subheading"
                )}>
                    <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={cn(
                            "text-sm font-medium truncate pr-2",
                            item.unread ? "text-heading" : "text-[var(--notion-text-primary)]"
                        )}>
                            {item.title}
                        </h3>
                        <span className="text-xs text-subheading whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.time}
                        </span>
                    </div>

                    <p className="text-sm text-subheading line-clamp-2 md:line-clamp-1">
                        <span className="font-medium text-heading mr-1">{item.sender}:</span>
                        {item.message}
                    </p>
                </div>

                {item.unread && (
                    <div className="self-center ml-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                )}
            </div>
        </div>
    );
}
