"use client";

import { 
    Hash, 
    AtSign, 
    Search, 
    Plus, 
    Send, 
    Smile, 
    Paperclip, 
    Image as ImageIcon, 
    MoreHorizontal, 
    ChevronDown, 
    Settings,
    Star,
    Info,
    Search as SearchIcon,
    Pin,
    Phone,
    Bot,
    Zap,
    X,
    Loader2,
    FileText,
    Download,
    UserPlus,
    Users,
    Megaphone,
    Building2,
    ShieldAlert,
    Clock,
    File,
    Menu as MenuIcon,
    ChevronLeft,
    Video,
    Mic,
    MoreVertical
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import RichText from '@/components/chat/RichText';
import ChannelItem from '@/components/chat/ChannelItem';
import { Message, Channel, User } from '@/components/chat/ChatTypes';

export default function MessengerPage() {
    const { data: session } = useSession();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoadingChannels, setIsLoadingChannels] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    
    // UI State
    const [view, setView] = useState<'LIST' | 'CHAT'>('LIST');
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const isFirstLoad = useRef(true);

    // Search/Users
    const [users, setUsers] = useState<User[]>([]);
    const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');

    // Mentions
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState(-1);

    // Uploads
    const [isUploading, setIsUploading] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessageIdRef = useRef<string | null>(null);

    const currentUserId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role?.toUpperCase();
    const isManager = userRole === 'MANAGER' || userRole === 'DIRECTOR' || userRole === 'ADMIN';

    useEffect(() => {
        fetchChannels();
        fetchUsers();
        const channelInterval = setInterval(fetchChannels, 5000);
        return () => clearInterval(channelInterval);
    }, []);

    const fetchChannels = async () => {
        try {
            const res = await fetch('/api/chat/channels');
            const data = await res.json();
            if (data.channels) {
                setChannels(data.channels);
                if (isFirstLoad.current && data.channels.length > 0 && window.innerWidth >= 1024) {
                    setSelectedChannel(data.channels[0]);
                    isFirstLoad.current = false;
                }
            }
        } catch (e) {} finally {
            setIsLoadingChannels(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            setUsers(data);
        } catch (e) {}
    };

    useEffect(() => {
        if (!selectedChannel) return;

        const fetchMessages = async (isInitial = false) => {
            if (isInitial) setIsLoadingMessages(true);
            try {
                const res = await fetch(`/api/chat/messages?channelId=${selectedChannel.id}`);
                const data = await res.json();
                const newMessages = data.messages || [];
                
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.id !== lastMessageIdRef.current || newMessages.length !== messages.length) {
                    setMessages(newMessages);
                    lastMessageIdRef.current = lastMsg?.id;
                    if (!isInitial) scrollToBottom();
                }
            } catch (e) {} finally {
                if (isInitial) {
                    setIsLoadingMessages(false);
                    scrollToBottom();
                }
            }
        };

        fetchMessages(true);
        const messageInterval = setInterval(() => fetchMessages(false), 2000);
        return () => clearInterval(messageInterval);
    }, [selectedChannel?.id, messages.length]);

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    const handleSendMessage = async () => {
        if ((!input.trim() && pendingAttachments.length === 0) || !selectedChannel || isSending) return;

        setIsSending(true);
        const optimisticId = Math.random().toString();
        const optimisticMsg: Message = {
            id: optimisticId,
            sender: {
                id: currentUserId,
                name: session?.user?.name || 'You',
                role: (session?.user as any).role,
                image: (session?.user as any).image
            },
            content: input,
            attachments: pendingAttachments,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setInput('');
        setPendingAttachments([]);
        scrollToBottom();

        try {
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: selectedChannel.id,
                    content: optimisticMsg.content,
                    attachments: optimisticMsg.attachments
                })
            });
        } catch (e) {
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
        } finally {
            setIsSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.url) setPendingAttachments(prev => [...prev, data]);
        } catch (e) {} finally {
            setIsUploading(false);
        }
    };

    const handleStartDM = async (recipientId: string) => {
        try {
            const res = await fetch('/api/chat/direct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientId })
            });
            const channel = await res.json();
            if (channel.id) {
                setChannels(prev => {
                    if (prev.find(c => c.id === channel.id)) return prev;
                    return [channel, ...prev];
                });
                setSelectedChannel(channel);
                setView('CHAT');
                setIsUserSearchOpen(false);
            }
        } catch (e) {}
    };

    const announcements = channels.filter(c => c.isSystem || c.name?.toLowerCase().includes('announcement'));
    const departments = channels.filter(c => (c.isSpaceChannel || (c.name && !c.name.toLowerCase().includes('announcement') && c.type === 'PUBLIC')) && !c.isSystem);
    const directMessages = channels.filter(c => c.type === 'DIRECT');

    return (
        <div className="flex-1 flex overflow-hidden bg-[#050505]">
            
            {/* Sidebar / List View */}
            <div className={cn(
                "flex-col border-r border-white/5 bg-[#0A0A0A] transition-all duration-300",
                view === 'CHAT' ? "hidden lg:flex w-80" : "flex w-full lg:w-80"
            )}>
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-900/20">EU</div>
                            <h1 className="text-lg font-black tracking-tighter">MESSENGER</h1>
                        </div>
                        <button onClick={() => setIsUserSearchOpen(true)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input 
                            type="text" placeholder="Search transmissions..."
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs outline-none focus:border-blue-500/30 transition-all placeholder:text-white/10"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ scrollbarWidth: 'none' }}>
                    {/* Sections */}
                    <div>
                        <p className="px-4 text-[10px] font-black text-white/10 uppercase tracking-[0.2em] mb-3">Tactical Groups</p>
                        <div className="space-y-1">
                            {announcements.map(ch => (
                                <ChannelItem key={ch.id} ch={ch} selected={selectedChannel?.id === ch.id} onClick={() => { setSelectedChannel(ch); setView('CHAT'); }} icon={Megaphone} />
                            ))}
                            {departments.map(ch => (
                                <ChannelItem key={ch.id} ch={ch} selected={selectedChannel?.id === ch.id} onClick={() => { setSelectedChannel(ch); setView('CHAT'); }} icon={Hash} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="px-4 text-[10px] font-black text-white/10 uppercase tracking-[0.2em] mb-3">Direct Links</p>
                        <div className="space-y-1">
                            {directMessages.map(dm => {
                                const otherMember = dm.members?.find(m => 
                                    m.id !== currentUserId && 
                                    m.email !== session?.user?.email
                                ) || dm.members?.[0];
                                return (
                                    <button
                                        key={dm.id} onClick={() => { setSelectedChannel(dm); setView('CHAT'); }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all group mb-1 border border-transparent",
                                            selectedChannel?.id === dm.id ? "bg-blue-600/10 text-blue-400 font-bold border-blue-500/10 shadow-lg shadow-blue-900/5" : "text-white/40 hover:bg-white/5"
                                        )}
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-black overflow-hidden">
                                            {otherMember?.image ? <img src={otherMember.image} className="w-full h-full object-cover" /> : (otherMember?.name?.charAt(0) || 'U')}
                                        </div>
                                        <span className="truncate flex-1 text-left tracking-tight">{otherMember?.name || 'Private Chat'}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Current User */}
                <div className="p-4 border-t border-white/5 bg-[#0D0D0D]">
                    <div className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center font-black text-blue-500 overflow-hidden">
                            {(session?.user as any)?.image ? <img src={(session?.user as any).image} className="w-full h-full object-cover" /> : session?.user?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{session?.user?.name}</p>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{userRole}</p>
                        </div>
                        <button className="p-2 text-white/20 hover:text-white"><Settings className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className={cn(
                "flex-1 flex-col relative",
                view === 'LIST' ? "hidden lg:flex" : "flex"
            )}>
                {selectedChannel ? (
                    <>
                        <header className="h-20 border-b border-white/5 px-6 flex items-center justify-between bg-[#050505]/80 backdrop-blur-xl z-20">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setView('LIST')} className="lg:hidden p-2 -ml-2 text-white/40 hover:text-white"><ChevronLeft className="w-6 h-6" /></button>
                                <div className="w-11 h-11 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shadow-lg shadow-blue-900/5 overflow-hidden">
                                    {selectedChannel.type === 'DIRECT' ? (
                                        (() => {
                                            const other = selectedChannel.members?.find(m => 
                                                m.id !== currentUserId && 
                                                m.email !== session?.user?.email
                                            ) || selectedChannel.members?.[0];
                                            return other?.image ? <img src={other.image} className="w-full h-full object-cover" /> : <AtSign className="w-5 h-5 text-blue-400" />;
                                        })()
                                    ) : (
                                        <Hash className="w-5 h-5 text-blue-400" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base font-black text-white tracking-tight truncate">
                                        {selectedChannel.type === 'DIRECT' 
                                            ? (selectedChannel.members?.find(m => 
                                                m.id !== currentUserId && 
                                                m.email !== session?.user?.email
                                              )?.name || 'Private Chat')
                                            : selectedChannel.name
                                        }
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Active Secure Link</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-3 text-white/20 hover:text-white hover:bg-white/5 rounded-2xl transition-all hidden sm:block"><Phone className="w-5 h-5" /></button>
                                <button className="p-3 text-white/20 hover:text-white hover:bg-white/5 rounded-2xl transition-all hidden sm:block"><Video className="w-5 h-5" /></button>
                                <div className="w-px h-8 bg-white/5 mx-2 hidden sm:block" />
                                <button onClick={() => setIsDetailsOpen(!isDetailsOpen)} className={cn("p-3 rounded-2xl transition-all", isDetailsOpen ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-white/20 hover:bg-white/5")}>
                                    <Info className="w-5 h-5" />
                                </button>
                                <button className="p-3 text-white/20 hover:text-white hover:bg-white/5 rounded-2xl transition-all lg:hidden"><MoreVertical className="w-5 h-5" /></button>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8" style={{ scrollbarWidth: 'thin' }}>
                            {isLoadingMessages ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-20"><Loader2 className="w-6 h-6 animate-spin mb-4" /><span className="text-[10px] font-black uppercase tracking-widest">Encrypting...</span></div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-10">
                                    <Bot className="w-12 h-12 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-[0.3em]">Channel Cleared</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = String(msg.sender.id) === String(currentUserId) || 
                                                 msg.sender.email === session?.user?.email;
                                    const nextMsg = messages[idx + 1];
                                    const isSameSenderAsNext = nextMsg?.sender.id === msg.sender.id;
                                    
                                    return (
                                        <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                            <div className={cn("flex items-end gap-3 max-w-[85%] lg:max-w-[70%]", isMe ? "flex-row-reverse" : "flex-row")}>
                                                {!isMe && !isSameSenderAsNext && (
                                                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 overflow-hidden shadow-lg shadow-black/40">
                                                        {msg.sender.image ? <img src={msg.sender.image} className="w-full h-full object-cover" /> : <span className="text-xs font-black text-white/20">{msg.sender.name.charAt(0)}</span>}
                                                    </div>
                                                )}
                                                <div className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start", !isMe && isSameSenderAsNext ? "ml-11" : "")}>
                                                    {!isMe && !isSameSenderAsNext && selectedChannel.type !== 'DIRECT' && (
                                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1 mb-1">{msg.sender.name}</span>
                                                    )}
                                                    <div className={cn(
                                                        "px-5 py-3.5 rounded-3xl text-[13px] font-medium leading-relaxed shadow-xl",
                                                        isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-[#1A1A1A] text-white/90 border border-white/5 rounded-bl-none"
                                                    )}>
                                                        <RichText content={msg.content} isMe={isMe} />
                                                        {msg.attachments && msg.attachments.length > 0 && (
                                                            <div className="mt-3 space-y-2">
                                                                {msg.attachments.map((file, fi) => (
                                                                    <div key={fi} className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
                                                                        {file.type?.startsWith('image/') ? <img src={file.url} className="w-12 h-12 rounded-xl object-cover" /> : <FileText className="w-5 h-5 text-blue-400" />}
                                                                        <div className="flex-1 min-w-0"><p className="text-[10px] font-black truncate text-white/60">{file.name}</p></div>
                                                                        <a href={file.url} download className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"><Download className="w-4 h-4" /></a>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {!isSameSenderAsNext && (
                                                        <span className="text-[8px] font-black text-white/10 uppercase tracking-widest mt-1 px-1">
                                                            {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="px-6 pb-8">
                            <div className="max-w-4xl mx-auto bg-[#111111] border border-white/5 rounded-[2.5rem] p-2 lg:p-3 shadow-2xl shadow-black ring-1 ring-white/5">
                                <div className="flex items-center gap-1 lg:gap-2">
                                    <button onClick={() => fileInputRef.current?.click()} className="p-3.5 text-white/20 hover:text-white/60 transition-all rounded-full hover:bg-white/5"><Paperclip className="w-5 h-5" /></button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                    
                                    <textarea 
                                        value={input} onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                                        placeholder="Transmit message..."
                                        className="flex-1 bg-transparent text-white border-none outline-none py-4 px-2 resize-none text-[14px] min-h-[56px] max-h-40 placeholder:text-white/10"
                                    />
                                    
                                    <div className="flex items-center gap-1 pr-1">
                                        <button className="p-3.5 text-white/20 hover:text-white/60 transition-all rounded-full hover:bg-white/5 hidden sm:block"><Mic className="w-5 h-5" /></button>
                                        <button className="p-3.5 text-white/20 hover:text-white/60 transition-all rounded-full hover:bg-white/5 hidden sm:block"><Smile className="w-5 h-5" /></button>
                                        <button 
                                            onClick={handleSendMessage} 
                                            disabled={isSending || (!input.trim() && pendingAttachments.length === 0)} 
                                            className="w-12 h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 transition-all rounded-full text-white flex items-center justify-center shadow-lg shadow-blue-600/30 active:scale-90 shrink-0"
                                        >
                                            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-grid-white/[0.02]">
                        <div className="w-24 h-24 rounded-[3rem] bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center border border-white/5 mb-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-blue-600/10 blur-2xl group-hover:scale-150 transition-all duration-700" />
                            <Zap className="w-10 h-10 text-blue-500 relative z-10 animate-pulse" />
                        </div>
                        <h2 className="text-lg lg:text-2xl font-black uppercase tracking-[0.5em] text-white/20">Secure Nexus</h2>
                        <p className="text-[10px] font-black text-white/5 uppercase tracking-[0.2em] mt-4">Select a frequency to initialize transmission</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isUserSearchOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={() => setIsUserSearchOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-xl bg-[#0D0D0D] border border-white/10 rounded-[3rem] p-8 lg:p-12 shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter">Initialize Link</h3>
                                <button onClick={() => setIsUserSearchOpen(false)} className="p-2 text-white/20 hover:text-white"><X className="w-6 h-6" /></button>
                            </div>
                            <div className="relative mb-8">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                                <input 
                                    autoFocus type="text" placeholder="Search personnel..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-3xl py-4 pl-12 pr-6 text-white outline-none focus:border-blue-500/50"
                                />
                            </div>
                            <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-2" style={{ scrollbarWidth: 'none' }}>
                                {users.filter(u => u.name.toLowerCase().includes(userSearchQuery.toLowerCase())).map(user => (
                                    <button key={user.id} onClick={() => handleStartDM(user.id)} className="w-full flex items-center gap-4 p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all group">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white/40 group-hover:text-blue-400 group-hover:bg-blue-600/20 transition-all">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-base font-black text-white group-hover:text-blue-400 transition-all">{user.name}</p>
                                            <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">{user.role}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
