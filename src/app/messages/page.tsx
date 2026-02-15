"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    Search,
    Send,
    Paperclip,
    MoreHorizontal,
    Circle,
    Hash,
    Users,
    Loader2,
    Briefcase,
    Megaphone,
    UserPlus
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    senderImage?: string;
    isMe: boolean;
    createdAt: string;
    type?: string;
    attachments?: { url: string; name: string; type: string }[];
}

interface Channel {
    id: string;
    name: string;
    type: 'PUBLIC' | 'PROJECT' | 'DEPARTMENT' | 'DM';
    description?: string;
    participants?: string[]; // IDs for DMs
}

export default function MessagesPage() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [channels, setChannels] = useState<Channel[]>([
        { id: 'global-general', name: 'General', type: 'PUBLIC' },
        { id: 'global-announcements', name: 'Announcements', type: 'PUBLIC' }
    ]);
    const [activeChannel, setActiveChannel] = useState<Channel>(channels[0]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [members, setMembers] = useState<any[]>([]); // For DM search
    const [showAttachInput, setShowAttachInput] = useState(false);
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();
    const bottomRef = useRef<HTMLDivElement>(null);

    // Initial Data Fetch (Projects & Team)
    useEffect(() => {
        const fetchContext = async () => {
            try {
                // Fetch Projects
                const projRes = await fetch('/api/projects');
                if (projRes.ok) {
                    const projects = await projRes.json();
                    const projectChannels = projects.map((p: any) => ({
                        id: `project-${p.id}`,
                        name: p.name,
                        type: 'PROJECT',
                        description: p.description
                    }));
                    setChannels(prev => {
                        // Avoid duplicates if re-fetching
                        const existingIds = new Set(prev.map(c => c.id));
                        const newChannels = projectChannels.filter((c: any) => !existingIds.has(c.id));
                        return [...prev, ...newChannels];
                    });
                }

                // Fetch Users for DMs
                const teamRes = await fetch('/api/team');
                if (teamRes.ok) {
                    const team = await teamRes.json();
                    // Filter out self
                    setMembers(team.users?.filter((u: any) => u.id !== (session?.user as any)?.id) || []);
                }

            } catch (error) {
                console.error("Failed to fetch context", error);
            }
        };

        if (session) fetchContext();
    }, [session]);

    // Fetch Messages when Channel Changes
    useEffect(() => {
        fetchMessages();
        // Close sidebar on mobile when channel is selected
        if (window.innerWidth < 1024) {
            setIsMobileSidebarOpen(false);
        }
        // Polling interaction - optional, simplified for now
        const interval = setInterval(fetchMessages, 10000);
        return () => clearInterval(interval);
    }, [activeChannel]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessages = async () => {
        // setIsLoading(true); // Don't show loader on poll
        try {
            const response = await fetch(`/api/messages?channelId=${activeChannel.id}`);
            if (response.ok) {
                const data = await response.json();
                setMessages(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newMessage,
                    channelId: activeChannel.id,
                    type: 'TEXT',
                    attachments: attachmentUrl ? [{
                        url: attachmentUrl,
                        name: 'Attachment',
                        type: attachmentUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? 'IMAGE' : 'FILE'
                    }] : []
                })
            });

            if (response.ok) {
                const msg = await response.json();
                setMessages(prev => [...prev, msg]);
                setNewMessage('');
                setAttachmentUrl('');
                setShowAttachInput(false);
            } else {
                showToast('Failed to send message', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setAttachmentUrl(data.url);
                setShowAttachInput(true);
            } else {
                showToast('Upload failed', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Upload error', 'error');
        }
    };

    const startDM = (user: any) => {
        const myId = (session?.user as any)?.id;
        if (!myId || !user.id) return;

        const sortedIds = [myId, user.id].sort();
        const dmChannelId = `dm-${sortedIds.join('-')}`;

        const dmChannel: Channel = {
            id: dmChannelId,
            name: user.name,
            type: 'DM',
            participants: [myId, user.id]
        };

        // Check if exists
        const exists = channels.find(c => c.id === dmChannelId);
        if (!exists) {
            setChannels(prev => [...prev, dmChannel]);
        }
        setActiveChannel(exists || dmChannel);
        setSearchQuery(''); // Clear search
    };

    // Filtered Members for Search
    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-64px)] lg:h-[calc(100vh-100px)] flex card-jira p-0 rounded-sm border-[#DFE1E6] bg-white overflow-hidden shadow-sm lg:m-6">
            {/* Sidebar */}
            <div className={cn(
                "w-full lg:w-80 border-r border-[#DFE1E6] flex flex-col bg-[#FAFBFC] transition-all absolute lg:relative inset-0 z-20 lg:z-auto",
                !isMobileSidebarOpen && "hidden lg:flex"
            )}>
                <div className="p-4 border-b border-[#DFE1E6]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B778C]" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find people or channels..."
                            className="w-full bg-white border border-[#DFE1E6] rounded-sm py-2 pl-10 pr-4 text-xs text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-6 custom-scrollbar">
                    {/* Search Results (if searching) */}
                    {searchQuery && (
                        <div>
                            <h3 className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest px-3 mb-2">People</h3>
                            <div className="space-y-1">
                                {filteredMembers.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => startDM(user)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-sm hover:bg-[#EBECF0] text-[#42526E]"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-[#DEEBFF] text-[#0052CC] flex items-center justify-center text-[10px] font-bold">
                                            {user.name?.[0]}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium">{user.name}</p>
                                            <p className="text-[10px] text-[#6B778C]">{user.role}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!searchQuery && (
                        <>
                            {/* Public Channels */}
                            <div>
                                <h3 className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest px-3 mb-2">Channels</h3>
                                <div className="space-y-0.5">
                                    {channels.filter(c => c.type === 'PUBLIC').map(channel => (
                                        <button
                                            key={channel.id}
                                            onClick={() => setActiveChannel(channel)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-sm transition-all ${activeChannel.id === channel.id
                                                ? 'bg-[#E9F2FF] text-[#0052CC]'
                                                : 'hover:bg-[#EBECF0] text-[#42526E]'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {channel.id === 'global-announcements' ?
                                                    <Megaphone className="w-4 h-4" /> :
                                                    <Hash className="w-4 h-4" />
                                                }
                                                <span className="text-sm font-medium">{channel.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Projects */}
                            <div>
                                <h3 className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest px-3 mb-2">Projects</h3>
                                <div className="space-y-0.5">
                                    {channels.filter(c => c.type === 'PROJECT').map(channel => (
                                        <button
                                            key={channel.id}
                                            onClick={() => setActiveChannel(channel)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-sm transition-all ${activeChannel.id === channel.id
                                                ? 'bg-[#E9F2FF] text-[#0052CC]'
                                                : 'hover:bg-[#EBECF0] text-[#42526E]'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="w-4 h-4" />
                                                <span className="text-sm font-medium truncate max-w-[180px]">{channel.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* DMs */}
                            <div>
                                <h3 className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest px-3 mb-2">Messages</h3>
                                <div className="space-y-0.5">
                                    {channels.filter(c => c.type === 'DM').map(channel => (
                                        <button
                                            key={channel.id}
                                            onClick={() => setActiveChannel(channel)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-sm transition-all ${activeChannel.id === channel.id
                                                ? 'bg-[#E9F2FF] text-[#0052CC]'
                                                : 'hover:bg-[#EBECF0] text-[#42526E]'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full bg-[#DFE1E6] flex items-center justify-center text-[8px] font-bold">
                                                    {channel.name[0]}
                                                </div>
                                                <span className="text-sm font-medium">{channel.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Main Chat */}
            <div className="flex-1 flex flex-col bg-white h-full relative">
                {/* Header */}
                <div className="h-16 px-4 md:px-6 border-b border-[#DFE1E6] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 md:gap-3">
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 hover:bg-[#EBECF0] rounded-sm text-[#42526E]"
                        >
                            <Users className="w-5 h-5" />
                        </button>
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-[#DEEBFF] rounded-lg flex items-center justify-center text-[#0052CC]">
                            {activeChannel.type === 'DM' ?
                                <span className="font-bold text-base md:text-lg">{activeChannel.name[0]}</span> :
                                <Hash className="w-4 h-4 md:w-5 h-5" />
                            }
                        </div>
                        <div>
                            <h2 className="text-sm md:text-lg font-bold text-[#172B4D] truncate max-w-[150px] md:max-w-none">{activeChannel.name}</h2>
                            <p className="text-xs text-[#6B778C]">
                                {activeChannel.id === 'global-announcements' ? 'Official Updates' :
                                    activeChannel.type === 'DM' ? 'Direct Message' :
                                        'Team Collaboration'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F4F5F7] scroll-smooth">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3 text-[#6B778C]">
                            <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
                            <p className="text-sm">Syncing secure stream...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-2 text-[#6B778C] opacity-50">
                            <MessageSquare className="w-12 h-12" />
                            <p className="text-sm">Start the conversation in {activeChannel.name}</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId;
                            return (
                                <div key={msg.id} className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex shrink-0 items-center justify-center text-[10px] md:text-xs font-bold ring-2 ring-white
                                        ${msg.isMe ? 'bg-[#0052CC] text-white' : 'bg-[#DFE1E6] text-[#42526E]'} 
                                        ${!showAvatar ? 'opacity-0' : ''}
                                    `}>
                                        {msg.senderName?.[0] || '?'}
                                    </div>

                                    <div className={`flex flex-col max-w-[85%] md:max-w-[60%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                        {showAvatar && (
                                            <span className="text-[11px] text-[#6B778C] mb-1 px-1 font-medium">
                                                {msg.senderName}, {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                        <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm
                                            ${msg.isMe
                                                ? 'bg-[#0052CC] text-white rounded-tr-sm'
                                                : 'bg-white text-[#172B4D] border border-[#EBECF0] rounded-tl-sm'}
                                        `}>
                                            {msg.content}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {msg.attachments.map((att, i) => (
                                                        <div key={i}>
                                                            {att.type === 'IMAGE' ? (
                                                                <img src={att.url} alt="attachment" className="max-w-[200px] rounded-md border border-white/20" />
                                                            ) : (
                                                                <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline text-xs opacity-90 hover:opacity-100">
                                                                    <Paperclip className="w-3 h-3" /> {att.url}
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-[#DFE1E6] shrink-0">
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />

                    {showAttachInput && (
                        <div className="mb-2 flex items-center gap-2 animate-in slide-in-from-bottom-2">
                            <input
                                value={attachmentUrl}
                                onChange={e => setAttachmentUrl(e.target.value)}
                                placeholder="Paste image or file link (http://...)"
                                className="flex-1 text-xs border border-[#DFE1E6] rounded px-2 py-1"
                                autoFocus
                            />
                            <button type="button" onClick={() => setShowAttachInput(false)} className="text-xs text-red-500">Cancel</button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`p-2 text-[#6B778C] hover:text-[#172B4D] transition-colors ${attachmentUrl ? 'text-[#0052CC]' : ''}`}
                            title="Attach File"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <input
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            placeholder={`Message ${activeChannel.name}...`}
                            className="w-full bg-[#FAFBFC] border border-[#DFE1E6] hover:bg-white hover:border-[#B3BAC5] focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] rounded-md py-2.5 md:py-3 pl-4 pr-12 text-sm text-[#172B4D] transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || isSending}
                            className={`absolute right-2 p-2 rounded-md transition-all
                                ${newMessage.trim() && !isSending
                                    ? 'bg-[#0052CC] text-white hover:bg-[#0747A6]'
                                    : 'bg-[#F4F5F7] text-[#A5ADBA] cursor-not-allowed'}
                            `}
                        >
                            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </form>
                    <p className="text-[10px] text-[#6B778C] mt-2 text-center">
                        <strong>Tip:</strong> Press Enter to send. Messages are visible to channel participants immediately.
                    </p>
                </div>
            </div>
        </div>
    );
}
