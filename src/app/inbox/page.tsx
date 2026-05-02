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
    Menu as MenuIcon
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Message {
    id: string;
    sender: {
        id: string;
        name: string;
        image?: string;
        role: string;
    };
    content: string;
    attachments?: any[];
    createdAt: string;
}

interface Channel {
    id: string;
    name: string | null;
    description: string | null;
    type: 'PUBLIC' | 'PRIVATE' | 'DIRECT';
    isSpaceChannel?: boolean;
    isSystem?: boolean;
    members?: { id: string, name: string, image?: string, role: string }[];
    spaceId?: string;
}

interface User {
    id: string;
    name: string;
    image?: string;
    role: string;
}

export default function InboxPage() {
    const { data: session } = useSession();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoadingChannels, setIsLoadingChannels] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    
    // UI State for Responsiveness
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false); // Default false on small screens
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
    // Notifications
    useEffect(() => {
        if ("Notification" in window) {
            Notification.requestPermission();
        }
    }, []);

    const showNotification = (title: string, body: string, icon?: string, force = false) => {
        if (Notification.permission === "granted" && (document.hidden || force)) {
            new Notification(title, {
                body,
                icon: icon || "/EUSAI-LOGO.png",
                badge: "/EUSAI-LOGO.png",
                tag: "eusai-notification",
                renotify: true
            });
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => {});
            } catch(e) {}
        }
    };

    const testNotification = () => {
        if (Notification.permission !== "granted") {
            Notification.requestPermission().then(perm => {
                if (perm === "granted") showNotification("Alerts Enabled", "Tactical notifications are now operational.", undefined, true);
            });
        } else {
            showNotification("Test Alert", "This is a tactical verification ping.", undefined, true);
        }
    };

    // Create Channel Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessageIdRef = useRef<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const currentUserId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role?.toUpperCase();
    const isManager = userRole === 'MANAGER' || userRole === 'DIRECTOR' || userRole === 'ADMIN';

    // Responsiveness Check
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
                setIsDetailsOpen(false);
            } else {
                setIsSidebarOpen(true);
                setIsDetailsOpen(true);
            }
        };
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                
                if (isFirstLoad.current && !selectedChannel && data.channels.length > 0) {
                    setSelectedChannel(data.channels[0]);
                    isFirstLoad.current = false;
                } else if (selectedChannel) {
                    const updated = data.channels.find((c: any) => c.id === selectedChannel.id);
                    if (updated) setSelectedChannel(updated);
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
                    // Check if we should notify: new message from someone else
                    if (lastMessageIdRef.current && lastMsg && lastMsg.sender.id !== currentUserId) {
                        showNotification(`New from ${lastMsg.sender.name}`, lastMsg.content);
                    }

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
        const messageInterval = setInterval(() => fetchMessages(false), 1500);
        return () => clearInterval(messageInterval);
    }, [selectedChannel?.id, messages.length]);

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    const handleCreateChannel = async () => {
        if (!newChannelName.trim() || isSending) return;
        setIsSending(true);
        try {
            const res = await fetch('/api/chat/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newChannelName, type: 'PUBLIC' })
            });
            const channel = await res.json();
            if (channel.id) {
                setChannels(prev => [channel, ...prev]);
                setSelectedChannel(channel);
                setIsCreateModalOpen(false);
                setNewChannelName('');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }
        } catch (e) {} finally {
            setIsSending(false);
        }
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
            const res = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: selectedChannel.id,
                    content: optimisticMsg.content,
                    attachments: optimisticMsg.attachments
                })
            });

            const realMessage = await res.json();
            if (realMessage.id) {
                setMessages(prev => prev.map(m => m.id === optimisticId ? realMessage : m));
                lastMessageIdRef.current = realMessage.id;

                if (selectedChannel.id.startsWith('space-') || selectedChannel.id.startsWith('sys-')) {
                    const resChannels = await fetch('/api/chat/channels');
                    const dataChannels = await resChannels.json();
                    if (dataChannels.channels) {
                        setChannels(dataChannels.channels);
                        const newRealChannel = dataChannels.channels.find((c: any) => 
                            c.spaceId === selectedChannel.id.replace('space-', '') || 
                            (selectedChannel.id === 'sys-announcements' && c.name?.toLowerCase().includes('announcement'))
                        );
                        if (newRealChannel) setSelectedChannel(newRealChannel);
                    }
                }
            }
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
                setIsUserSearchOpen(false);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }
        } catch (e) {}
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setInput(val);
        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = val.substring(0, cursorPosition);
        const words = textBeforeCursor.split(/\s/);
        const lastWord = words[words.length - 1];

        if (lastWord.startsWith('@')) {
            const query = lastWord.substring(1);
            setMentionQuery(query);
            setMentionIndex(cursorPosition - lastWord.length);
        } else {
            setMentionQuery(null);
        }
    };

    const insertMention = (user: User) => {
        if (mentionIndex === -1) return;
        const mentionString = `@[${user.name}](user:${user.id}) `;
        const before = input.substring(0, mentionIndex);
        const after = input.substring(mentionIndex + (mentionQuery?.length || 0) + 1).trimStart();
        setInput(before + mentionString + after);
        setMentionQuery(null);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const filteredMentionUsers = users.filter(u => 
        u.name.toLowerCase().includes((mentionQuery || '').toLowerCase())
    ).slice(0, 5);

    if (isLoadingChannels) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#050505]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    const announcements = channels.filter(c => c.isSystem || c.name?.toLowerCase().includes('announcement'));
    const departments = channels.filter(c => (c.isSpaceChannel || (c.name && !c.name.toLowerCase().includes('announcement') && c.type === 'PUBLIC')) && !c.isSystem);
    const directMessages = channels.filter(c => c.type === 'DIRECT');
    const sharedFiles = messages.flatMap(m => m.attachments || []).slice(0, 5);

    return (
        <div className="flex h-[calc(100vh-64px)] bg-[#0A0A0A] overflow-hidden relative">
            
            {/* Mobile Menu Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && window.innerWidth < 1024 && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40]"
                    />
                )}
            </AnimatePresence>

            {/* Left Sidebar */}
            <motion.div 
                className={cn(
                    "fixed lg:relative z-[50] lg:z-auto h-full w-72 border-r border-white/5 flex flex-col bg-[#0D0D0D] transition-transform duration-300 lg:translate-x-0",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-5 border-b border-white/5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-black text-sm shadow-xl shadow-blue-900/20">EU</div>
                            <div>
                                <span className="text-sm font-black text-white/90 block leading-tight">EUSAI Hub</span>
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Command Center</span>
                            </div>
                        </div>
                        {window.innerWidth < 1024 && (
                            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-white/20"><X className="w-5 h-5" /></button>
                        )}
                    </div>
                    
                    {isManager && (
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full py-2.5 bg-white/5 hover:bg-blue-600 border border-white/5 hover:border-blue-500 rounded-xl transition-all flex items-center justify-center gap-2 group"
                        >
                            <Plus className="w-4 h-4 text-white/40 group-hover:text-white" />
                            <span className="text-[10px] font-black text-white/60 group-hover:text-white uppercase tracking-widest">New Tactical Group</span>
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-6" style={{ scrollbarWidth: 'none' }}>
                    <div>
                        <div className="px-3 flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Megaphone className="w-3.5 h-3.5 text-orange-500/50" />
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Announcements</p>
                            </div>
                        </div>
                        {announcements.map(ch => (
                            <ChannelItem key={ch.id} ch={ch} selected={selectedChannel?.id === ch.id} onClick={() => { setSelectedChannel(ch); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        ))}
                    </div>

                    <div>
                        <div className="px-3 flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 text-blue-500/50" />
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Departments</p>
                            </div>
                        </div>
                        {departments.map(ch => (
                            <ChannelItem key={ch.id} ch={ch} selected={selectedChannel?.id === ch.id} onClick={() => { setSelectedChannel(ch); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} icon={Hash} />
                        ))}
                    </div>

                    <div>
                        <div className="px-3 flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <AtSign className="w-3.5 h-3.5 text-purple-500/50" />
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Direct Links</p>
                            </div>
                            <button onClick={() => setIsUserSearchOpen(true)} className="p-1 hover:bg-white/5 rounded-lg text-white/20 hover:text-white/60 transition-all"><UserPlus className="w-4 h-4" /></button>
                        </div>
                        {directMessages.map(dm => {
                            const otherMember = dm.members?.find(m => 
                                m.id !== currentUserId && 
                                m.email !== session?.user?.email
                            ) || dm.members?.[0];
                            return (
                                <button
                                    key={dm.id} onClick={() => { setSelectedChannel(dm); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                                    className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all group mb-0.5", selectedChannel?.id === dm.id ? "bg-blue-600/10 text-blue-400 font-bold" : "text-white/40 hover:bg-white/5")}
                                >
                                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-black overflow-hidden">
                                        {otherMember?.image ? <img src={otherMember.image} className="w-full h-full object-cover" /> : (otherMember?.name?.charAt(0) || 'U')}
                                    </div>
                                    <span className="truncate flex-1 text-left">{otherMember?.name || 'Private Chat'}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-[#050505] relative min-w-0">
                {selectedChannel ? (
                    <>
                        <header className="h-16 border-b border-white/5 px-4 lg:px-8 flex items-center justify-between bg-[#0A0A0A]/50 backdrop-blur-md z-10">
                            <div className="flex items-center gap-3 lg:gap-4 overflow-hidden">
                                {window.innerWidth < 1024 && (
                                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-white/40 hover:text-white"><MenuIcon className="w-6 h-6" /></button>
                                )}
                                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-blue-600/5 flex items-center justify-center border border-blue-600/10 shrink-0 overflow-hidden">
                                    {selectedChannel.type === 'DIRECT' ? (
                                        (() => {
                                            const other = selectedChannel.members?.find(m => 
                                                m.id !== currentUserId && 
                                                m.email !== session?.user?.email
                                            ) || selectedChannel.members?.[0];
                                            return other?.image ? <img src={other.image} className="w-full h-full object-cover" /> : <AtSign className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />;
                                        })()
                                    ) : (
                                        <Hash className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
                                    )}
                                </div>
                                <div className="truncate">
                                    <h2 className="text-sm lg:text-base font-black text-white/90 tracking-tight truncate">
                                        {selectedChannel.type === 'DIRECT' 
                                            ? (selectedChannel.members?.find(m => 
                                                m.id !== currentUserId && 
                                                m.email !== session?.user?.email
                                              )?.name || 'Private Chat')
                                            : selectedChannel.name
                                        }
                                    </h2>
                                    <p className="text-[9px] lg:text-[10px] text-white/30 font-medium truncate hidden sm:block">
                                        {selectedChannel.type === 'DIRECT' ? 'Secure Direct Link' : (selectedChannel.description || 'Public tactical group.')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 lg:gap-3 shrink-0">
                                <button 
                                    onClick={testNotification}
                                    title="Verify Tactical Alerts"
                                    className="p-2 lg:p-2.5 rounded-xl transition-all text-orange-500/40 hover:text-orange-500 hover:bg-orange-500/5"
                                >
                                    <Zap className="w-5 h-5" />
                                </button>
                                <div className="h-6 w-px bg-white/5 mx-1" />
                                <button onClick={() => setIsDetailsOpen(!isDetailsOpen)} className={cn("p-2 lg:p-2.5 rounded-xl transition-all", isDetailsOpen ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-white/20 hover:bg-white/5")}>
                                    <Info className="w-5 h-5" />
                                </button>
                                <div className="h-6 w-px bg-white/5 mx-1" />
                                <span className="text-[10px] font-black text-green-500/60 uppercase tracking-[0.2em] items-center gap-2 hidden sm:flex">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Encrypted
                                </span>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 lg:py-10 space-y-6" style={{ scrollbarWidth: 'thin' }}>
                            {isLoadingMessages ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-20"><Loader2 className="w-6 h-6 animate-spin mb-4" /><span className="text-[10px] font-black uppercase">Syncing...</span></div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = String(msg.sender.id) === String(currentUserId) || 
                                                 msg.sender.email === session?.user?.email;
                                    return (
                                        <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                            <div className={cn("flex items-end gap-2 lg:gap-3 max-w-[90%] lg:max-w-[80%]", isMe ? "flex-row-reverse" : "flex-row")}>
                                                {!isMe && (
                                                    <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {msg.sender.image ? <img src={msg.sender.image} className="w-full h-full object-cover" /> : <span className="text-[10px] lg:text-xs font-black text-white/20">{msg.sender.name.charAt(0)}</span>}
                                                    </div>
                                                )}
                                                <div className="flex flex-col gap-1">
                                                    {!isMe && selectedChannel.type !== 'DIRECT' && <span className="text-[9px] lg:text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">{msg.sender.name}</span>}
                                                    <div className={cn("px-4 py-2.5 lg:px-5 lg:py-3 rounded-2xl text-[12px] lg:text-[13px] font-medium leading-relaxed shadow-lg", isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-[#1A1A1A] text-white/80 border border-white/5 rounded-bl-none")}>
                                                        <RichText content={msg.content} isMe={isMe} />
                                                        {msg.attachments && msg.attachments.length > 0 && (
                                                            <div className="mt-3 space-y-2">
                                                                {msg.attachments.map((file, fi) => (
                                                                    <div key={fi} className="flex items-center gap-3 p-2 rounded-xl bg-black/20 border border-white/5">
                                                                        {file.type?.startsWith('image/') ? <img src={file.url} className="w-10 h-10 rounded-lg object-cover" /> : <FileText className="w-5 h-5 text-blue-400" />}
                                                                        <div className="flex-1 min-w-0"><p className="text-[10px] font-black truncate">{file.name}</p></div>
                                                                        <a 
                                                                            href={file.url.startsWith('http') ? file.url : `${window.location.origin}${file.url}`} 
                                                                            download={file.name} 
                                                                            target="_blank" 
                                                                            rel="noreferrer" 
                                                                            className="p-1.5 rounded-lg bg-black/20 text-white"
                                                                        >
                                                                            <Download className="w-3 h-3" />
                                                                        </a>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={cn("text-[8px] lg:text-[9px] font-black text-white/10 uppercase tracking-widest px-1", isMe ? "text-right" : "text-left")}>
                                                        {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 pb-32 lg:p-8">
                            <div className="bg-[#121212] border border-white/5 rounded-[1.5rem] lg:rounded-[2rem] p-2 lg:p-3 shadow-2xl relative">
                                <AnimatePresence>
                                    {mentionQuery !== null && filteredMentionUsers.length > 0 && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-4 left-0 w-full max-w-[320px] bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[60]">
                                            {filteredMentionUsers.map(user => (
                                                <button key={user.id} onClick={() => insertMention(user)} className="w-full flex items-center gap-4 p-4 hover:bg-blue-600 transition-all text-left">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black">{user.name.charAt(0)}</div>
                                                    <div className="flex-1"><p className="text-xs font-black text-white">{user.name}</p></div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <textarea 
                                    ref={inputRef}
                                    value={input} onChange={handleInputChange}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                                    placeholder="Enter command..."
                                    className="w-full bg-transparent text-white border-none outline-none py-3 px-3 resize-none text-[13px] lg:text-[14px] min-h-[48px] max-h-32"
                                />
                                
                                <div className="flex items-center justify-between p-1 lg:p-2">
                                    <div className="flex items-center gap-0.5 lg:gap-1">
                                        <button onClick={() => fileInputRef.current?.click()} className="p-2 lg:p-3 text-white/20 hover:text-white/60"><Paperclip className="w-4 h-4 lg:w-5 lg:h-5" /></button>
                                        <button className="p-2 lg:p-3 text-white/20 hover:text-white/60 hidden sm:block"><Smile className="w-4 h-4 lg:w-5 lg:h-5" /></button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                        {isUploading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin ml-2" />}
                                    </div>
                                    <button onClick={handleSendMessage} disabled={isSending || (!input.trim() && pendingAttachments.length === 0)} className="px-5 lg:px-8 py-2 lg:py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 transition-all rounded-xl lg:rounded-[1.5rem] text-white font-black text-[10px] lg:text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95">
                                        {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 lg:w-4 lg:h-4" />} <span className="hidden sm:inline">Transmit</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                        <ShieldAlert className="w-12 h-12 lg:w-16 lg:h-16 mb-4" />
                        <h2 className="text-sm lg:text-xl font-black uppercase tracking-[0.3em]">Operational Comms</h2>
                    </div>
                )}
            </div>

            {/* Right Details Panel */}
            <AnimatePresence>
                {isDetailsOpen && selectedChannel && (
                    <motion.div 
                        initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
                        className="fixed lg:relative top-0 right-0 h-full w-full sm:w-80 border-l border-white/5 bg-[#0D0D0D] flex flex-col shadow-2xl z-[70] lg:z-auto"
                    >
                        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between">
                            <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Details</h3>
                            <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-white/20"><X className="w-4 h-4" /></button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ scrollbarWidth: 'none' }}>
                            <div className="text-center">
                                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-3xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                                    {selectedChannel.type === 'DIRECT' ? (
                                        (() => {
                                            const other = selectedChannel.members?.find(m => m.id !== currentUserId);
                                            return other?.image ? <img src={other.image} className="w-full h-full object-cover" /> : <AtSign className="w-8 h-8 lg:w-10 lg:h-10 text-blue-500" />;
                                        })()
                                    ) : (
                                        <Hash className="w-8 h-8 lg:w-10 lg:h-10 text-blue-500" />
                                    )}
                                </div>
                                <h2 className="text-base lg:text-lg font-black text-white">
                                    {selectedChannel.type === 'DIRECT' 
                                        ? (selectedChannel.members?.find(m => m.id !== currentUserId)?.name || 'Private Chat')
                                        : selectedChannel.name
                                    }
                                </h2>
                                <p className="text-[10px] lg:text-[11px] text-white/40 mt-1">
                                    {selectedChannel.type === 'DIRECT' ? 'Encrypted Direct Message' : (selectedChannel.description || 'Public tactical group.')}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Personnel</span>
                                    <span className="text-[9px] font-black px-2 py-0.5 bg-white/5 rounded-full text-white/30">{selectedChannel.members?.length || 0}</span>
                                </div>
                                <div className="space-y-3">
                                    {selectedChannel.members?.map(member => (
                                        <div key={member.id} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                                                {member.image ? <img src={member.image} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black text-white/20">{member.name.charAt(0)}</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-white truncate">{member.name}</p>
                                                <p className="text-[9px] text-white/20 font-bold uppercase truncate">{member.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals & Overlays */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsCreateModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-lg bg-[#0D0D0D] border border-white/10 rounded-[2rem] p-8 lg:p-12">
                            <h3 className="text-xl lg:text-2xl font-black text-white mb-8 uppercase">Establish Group</h3>
                            <div className="space-y-6">
                                <input 
                                    type="text" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)}
                                    placeholder="Channel Name"
                                    className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl p-5 text-white outline-none focus:border-blue-500/50"
                                />
                                <button 
                                    onClick={handleCreateChannel} disabled={!newChannelName.trim() || isSending}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-black text-[10px] lg:text-[11px] uppercase tracking-widest"
                                >
                                    {isSending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Initialize Broadcast'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            
            {/* User Search Overlay (DM) */}
            <AnimatePresence>
                {isUserSearchOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsUserSearchOpen(false)} />
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-xl bg-[#0D0D0D] border border-white/10 rounded-[2rem] p-6 lg:p-12 overflow-hidden flex flex-col max-h-[80vh]">
                            <h3 className="text-xl lg:text-2xl font-black text-white mb-6 uppercase">Initialize Link</h3>
                            <input 
                                autoFocus type="text" placeholder="Search personnel..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl p-5 text-white mb-6"
                            />
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                {users.filter(u => u.name.toLowerCase().includes(userSearchQuery.toLowerCase())).map(user => (
                                    <button key={user.id} onClick={() => handleStartDM(user.id)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-blue-600/5 hover:border-blue-500/30">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black">{user.name.charAt(0)}</div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-white">{user.name}</p>
                                            <p className="text-[10px] text-white/20 uppercase">{user.role}</p>
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

function ChannelItem({ ch, selected, onClick, icon: Icon = Hash }: { ch: any, selected: boolean, onClick: () => void, icon?: any }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all group mb-0.5 border border-transparent",
                selected ? "bg-blue-600/10 text-blue-400 font-bold border-blue-500/10" : "text-white/40 hover:bg-white/5"
            )}
        >
            <Icon className={cn("w-4 h-4", selected ? "text-blue-400" : "text-white/10")} />
            <span className="truncate flex-1 text-left">{ch.name}</span>
        </button>
    );
}

function RichText({ content, isMe }: { content: string, isMe: boolean }) {
    if (!content) return null;
    const mentionRegex = /@\[([^\]]+)\]\(user:([a-zA-Z0-9-]+)\)/g;
    const parts = content.split(mentionRegex);
    const renderFormattedText = (text: string, keyPrefix: string) => {
        const formatRegex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
        const subParts = text.split(formatRegex);
        return subParts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={`${keyPrefix}-b-${i}`} className="font-black text-white">{part.slice(2, -2)}</strong>;
            if (part.startsWith('*') && part.endsWith('*')) return <em key={`${keyPrefix}-i-${i}`} className="italic opacity-90">{part.slice(1, -1)}</em>;
            if (part.startsWith('`') && part.endsWith('`')) return <code key={`${keyPrefix}-c-${i}`} className={cn("px-1.5 py-0.5 rounded-md font-mono text-[11px] border mx-0.5", isMe ? "bg-white/20" : "bg-black/40")}>{part.slice(1, -1)}</code>;
            return <span key={`${keyPrefix}-t-${i}`}>{part}</span>;
        });
    };
    const result = [];
    for (let i = 0; i < parts.length; i++) {
        if (i % 3 === 0) result.push(renderFormattedText(parts[i], `text-${i}`));
        else if (i % 3 === 1) result.push(<span key={`mention-${i}`} className={cn("font-black px-2 py-0.5 rounded-md border text-[11px] ml-0.5 mr-1.5 shadow-sm inline-flex items-center gap-1", isMe ? "bg-white/20" : "bg-blue-600/20 text-blue-400")}>@{parts[i]}</span>);
    }
    return <div className="whitespace-pre-wrap">{result}</div>;
}
