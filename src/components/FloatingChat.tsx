"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    X,
    Send,
    ChevronLeft,
    Search,
    Loader2,
    Hash,
    Briefcase,
    Maximize2,
    Minimize2,
    GripHorizontal
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { motion, useDragControls } from 'framer-motion';

interface Message {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    isMe: boolean;
    createdAt: string;
}

interface Channel {
    id: string;
    name: string;
    type: 'PUBLIC' | 'PROJECT' | 'DEPARTMENT' | 'DM';
}

export default function FloatingChat() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const dragControls = useDragControls();
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [view, setView] = useState<'channels' | 'messages'>('channels');
    const [channels, setChannels] = useState<Channel[]>([
        { id: 'global-general', name: 'General', type: 'PUBLIC' },
        { id: 'global-announcements', name: 'Announcements', type: 'PUBLIC' }
    ]);
    const [activeChannel, setActiveChannel] = useState<Channel>(channels[0]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Initial Data Fetch
    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const projRes = await fetch('/api/projects');
                if (projRes.ok) {
                    const projects = await projRes.json();
                    const projectChannels = projects.map((p: any) => ({
                        id: `project-${p.id}`,
                        name: p.name,
                        type: 'PROJECT'
                    }));
                    setChannels(prev => {
                        const existingIds = new Set(prev.map(c => c.id));
                        const newOnes = projectChannels.filter((c: any) => !existingIds.has(c.id));
                        return [...prev, ...newOnes];
                    });
                }
            } catch (err) {
                console.error(err);
            }
        };

        if (session && isOpen) fetchChannels();
    }, [session, isOpen]);

    // Fetch Messages
    useEffect(() => {
        if (isOpen && view === 'messages') {
            fetchMessages();
            const interval = setInterval(fetchMessages, 10000);
            return () => clearInterval(interval);
        }
    }, [isOpen, view, activeChannel]);

    // Auto-scroll
    useEffect(() => {
        if (view === 'messages') {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, view]);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/messages?channelId=${activeChannel.id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newMessage,
                    channelId: activeChannel.id,
                    type: 'TEXT'
                })
            });

            if (res.ok) {
                const msg = await res.json();
                setMessages(prev => [...prev, msg]);
                setNewMessage('');
            } else {
                showToast('Failed to send', 'error');
            }
        } catch (err) {
            showToast('Error sending message', 'error');
        } finally {
            setIsSending(false);
        }
    };

    if (!session) return null;

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragControls={dragControls}
            dragListener={false}
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[60] flex flex-col items-end gap-4 pointer-events-none"
        >
            {/* Chat Window */}
            {isOpen && (
                <div className={cn(
                    "bg-white shadow-2xl border border-[#DFE1E6] flex flex-col overflow-hidden transition-all duration-300 pointer-events-auto",
                    "w-80 h-[500px] rounded-2xl relative",
                    isMaximized && "fixed inset-4 w-auto h-auto md:relative md:w-[600px] md:h-[700px]"
                )}>
                    {/* Header - DRAG HANDLE */}
                    <div
                        onPointerDown={(e) => dragControls.start(e)}
                        className="h-14 px-4 bg-[#0052CC] text-white flex items-center justify-between shrink-0 cursor-move"
                    >
                        <div className="flex items-center gap-2">
                            {view === 'messages' && (
                                <button onPointerDown={(e) => e.stopPropagation()} onClick={() => setView('channels')} className="p-1 hover:bg-white/20 rounded-md pointer-events-auto">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            )}
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">
                                    {view === 'channels' ? 'Messages' : activeChannel.name}
                                </span>
                                {view === 'messages' && <span className="text-[10px] opacity-80">Online Collaboration</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 pointer-events-auto">
                            <button onPointerDown={(e) => e.stopPropagation()} onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 hover:bg-white/20 rounded-md transition-colors">
                                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                            <button onPointerDown={(e) => e.stopPropagation()} onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-md transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden flex flex-col bg-[#F4F5F7]">
                        {view === 'channels' ? (
                            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                <div className="px-2 py-1 mb-1">
                                    <p className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider">Active Channels</p>
                                </div>
                                {channels.map(channel => (
                                    <button
                                        key={channel.id}
                                        onClick={() => {
                                            setActiveChannel(channel);
                                            setView('messages');
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#DEEBFF] text-[#172B4D] transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-white border border-[#DFE1E6] flex items-center justify-center text-[#0052CC] group-hover:border-[#0052CC]">
                                            {channel.type === 'PROJECT' ? <Briefcase className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 text-left truncate">
                                            <p className="text-sm font-semibold truncate">{channel.name}</p>
                                            <p className="text-[10px] text-[#6B778C]">{channel.type}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#F4F5F7] custom-scrollbar">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-[#6B778C] opacity-50 px-8 text-center">
                                            <MessageSquare className="w-8 h-8 mb-2" />
                                            <p className="text-xs">No messages yet. Start the conversation!</p>
                                        </div>
                                    ) : (
                                        messages.map((msg, idx) => (
                                            <div key={msg.id} className={cn("flex flex-col", msg.isMe ? "items-end" : "items-start")}>
                                                {!msg.isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId) && (
                                                    <span className="text-[9px] text-[#6B778C] ml-2 mb-1 uppercase font-bold">{msg.senderName}</span>
                                                )}
                                                <div className={cn(
                                                    "px-3 py-2 rounded-2xl text-[13px] shadow-sm max-w-[85%]",
                                                    msg.isMe ? "bg-[#0052CC] text-white rounded-tr-none" : "bg-white text-[#172B4D] border border-[#EBECF0] rounded-tl-none"
                                                )}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={bottomRef} />
                                </div>

                                {/* Quick Input */}
                                <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#DFE1E6] flex gap-2 items-center">
                                    <input
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-[#F4F5F7] border-none rounded-full px-4 py-2 text-xs focus:ring-1 focus:ring-[#0052CC] text-[#172B4D]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || isSending}
                                        className="p-2 bg-[#0052CC] text-white rounded-full hover:bg-[#0747A6] disabled:opacity-50 transition-colors"
                                    >
                                        {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Bubble - ALSO A DRAG HANDLE */}
            <button
                onPointerDown={(e) => dragControls.start(e)}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-4 rounded-full shadow-2xl transition-all duration-300 pointer-events-auto group relative cursor-move",
                    isOpen ? "bg-red-500 scale-90 rotate-45" : "bg-[#0052CC] hover:bg-[#0065FF] hover:-translate-y-1 active:scale-95"
                )}
            >
                {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
                {!isOpen && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center animate-bounce">
                        <span className="text-[10px] font-bold text-white">!</span>
                    </div>
                )}
            </button>
        </motion.div>
    );
}
