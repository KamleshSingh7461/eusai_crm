"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Sparkles, User, RefreshCw, Zap, ChevronRight, Bot, Shield, Terminal, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}

const QUICK_PROMPTS: Record<string, string[]> = {
    DIRECTOR: [
        "Who hasn't submitted their report today?",
        "Give me a team performance summary",
        "Which projects are currently at risk?",
        "Who are the top performers this week?",
        "Show me today's attendance & missing reports",
    ],
    MANAGEMENT: [
        "Who hasn't submitted their report today?",
        "Give me a full team status overview",
        "Which projects are showing high risk?",
        "Show me overdue task summary by department",
    ],
    MANAGER: [
        "Who on my team hasn't reported today?",
        "What are the highest priority pending tasks?",
        "Give me a summary of my team's progress",
        "Which tasks are overdue in my managed spaces?",
    ],
    TEAM_LEADER: [
        "What tasks are pending for me today?",
        "Did all my subordinates submit their reports?",
        "Show my overdue tasks with deadlines",
        "What are the focus areas for my team today?",
    ],
    EMPLOYEE: [
        "What are my pending tasks for today?",
        "Verify if I submitted today's daily report",
        "What is my current overdue count?",
        "How many milestones are pending for me?",
        "Summary of my contributions this week",
    ],
    INTERN: [
        "List my pending tasks for today",
        "Check my report submission status",
        "What should I focus on to complete my goals?",
    ],
};

function MarkdownText({ text }: { text: string }) {
    // Robust regex-based formatter for a "terminal/tactical" look
    const formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="text-purple-300">$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono text-purple-200 border border-white/10">$1</code>')
        .replace(/^#{3}\s(.+)$/gm, '<h3 class="text-sm font-black text-white mt-4 mb-1 border-l-2 border-purple-500 pl-2">$1</h3>')
        .replace(/^#{2}\s(.+)$/gm, '<h2 class="text-base font-black text-white mt-5 mb-2 border-l-4 border-purple-600 pl-3 uppercase tracking-wider">$1</h2>')
        .replace(/^#{1}\s(.+)$/gm, '<h1 class="text-lg font-black text-white mt-6 mb-3 border-b border-white/10 pb-1">$1</h1>')
        .replace(/^[-•]\s(.+)$/gm, '<div class="flex gap-3 my-1 items-start group"><span class="text-purple-500 shrink-0 mt-1">▶</span><span class="group-hover:text-white transition-colors">$1</span></div>')
        .replace(/\n\n/g, '<div class="h-3"></div>')
        .replace(/\n/g, '<br/>');

    return <div className="text-[13px] leading-[1.6] text-white/80 font-medium" dangerouslySetInnerHTML={{ __html: formatted }} />;
}

function TypingIndicator() {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-3"
        >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600/80 to-blue-600/80 flex items-center justify-center shrink-0 border border-white/20 shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                <Bot className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 shadow-xl">
                <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </motion.div>
    );
}

export default function AIAssistantPage() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showQuickPrompts, setShowQuickPrompts] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const userRole = (session?.user as any)?.role || 'EMPLOYEE';
    const userName = session?.user?.name?.split(' ')[0] || 'there';
    const quickPrompts = QUICK_PROMPTS[userRole] || QUICK_PROMPTS.EMPLOYEE;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

    useEffect(() => {
        if (session?.user) {
            const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: `${greeting}, **${userName}**! 👋\n\nI am **EUSAI AI**, your specialized tactical intelligence layer. I have integrated access to the EUSAI Core — monitoring tasks, daily reports, and project performance parameters in real-time.\n\nAsk me for situational updates, performance audits, or operational focus points.`,
                timestamp: new Date()
            }]);
        }
    }, [session]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setShowQuickPrompts(false);

        try {
            const history = messages.filter(m => m.id !== 'welcome').map(m => ({
                role: m.role,
                content: m.content
            }));

            const res = await fetch('/api/gemini/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content.trim(), history })
            });

            const data = await res.json();

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply || 'Protocol Error: Could not establish response uplink.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '⚠️ Connectivity disrupted. Re-establishing link...',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-dvh bg-[#050505] relative overflow-hidden font-sans">
            
            {/* Ambient Background Grid */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
                 style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            
            {/* Dynamic Light Orbs */}
            <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full w-full">
                {/* Header Area */}
                <div className="flex-shrink-0 pt-8 px-6 pb-6 border-b border-white/5 bg-[#080808]/50 backdrop-blur-md">
                    <div className="w-full px-4">
                        <div className="flex items-center justify-between mb-2">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Bot className="text-white w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                        EUSAI AI <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-widest">Tactical Core</span>
                                    </h1>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Neural Link Active</span>
                                    </div>
                                </div>
                            </motion.div>

                            <div className="hidden md:flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-white/30 uppercase font-black tracking-[0.2em]">Session Identity</span>
                                    <span className="text-xs text-white/70 font-mono tracking-wider">{session?.user?.name || 'Authorized Personnel'}</span>
                                </div>
                                <div className="h-8 w-px bg-white/5" />
                                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 overflow-hidden">
                                    <img src={(session?.user as any)?.image || '/EUSAI-LOGO.png'} className="w-full h-full object-cover" alt="" />
                                </div>
                                <button
                                    onClick={() => setMessages([{ id: '1', role: 'assistant', content: "Systems reset. How can I assist your objectives?", timestamp: new Date() }])}
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white transition-all group"
                                    title="Reset Intelligence"
                                >
                                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden relative flex flex-col">
                    <div className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth" id="chat-container">
                        <div className="w-full space-y-8">
                            <AnimatePresence initial={false}>
                                {messages.map((msg, index) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className={cn(
                                            "flex items-start gap-4 group",
                                            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500",
                                            msg.role === 'assistant' 
                                                ? "bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-white/10 group-hover:border-purple-500/50 shadow-lg"
                                                : "bg-white/5 border-white/5 group-hover:border-white/20"
                                        )}>
                                            {msg.role === 'assistant' ? (
                                                <Bot className="w-4.5 h-4.5 text-purple-400 group-hover:text-purple-300" />
                                            ) : (
                                                <User className="w-4.5 h-4.5 text-white/40 group-hover:text-white/70" />
                                            )}
                                        </div>

                                        <div className={cn(
                                            "relative max-w-[85%] md:max-w-[75%] px-5 py-4 rounded-[24px] shadow-2xl transition-all duration-300",
                                            msg.role === 'assistant'
                                                ? "bg-[#111111]/80 backdrop-blur-md border border-white/[0.08] rounded-tl-sm"
                                                : "bg-gradient-to-br from-purple-700 to-blue-800 text-white rounded-tr-sm border border-white/10"
                                        )}>
                                            {msg.role === 'assistant' && (
                                                <div className="absolute -top-3 -left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Sparkles className="w-4 h-4 text-purple-400 blur-[0.5px]" />
                                                </div>
                                            )}
                                            
                                            <MarkdownText text={msg.content} />
                                            
                                            <div className={cn(
                                                "flex items-center gap-2 mt-4 text-[9px] font-black uppercase tracking-widest",
                                                msg.role === 'assistant' ? "text-white/20" : "text-white/40"
                                            )}>
                                                <span>{msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                {msg.role === 'assistant' && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-white/10" />
                                                        <span className="flex items-center gap-1"><BarChart3 className="w-2 h-2" /> Data Verified</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {isLoading && (
                                <div className="flex items-center gap-4 animate-pulse">
                                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                                        <Bot className="w-4.5 h-4.5 text-white/20" />
                                    </div>
                                    <div className="h-10 w-32 bg-white/5 rounded-2xl" />
                                </div>
                            )}

                            {messages.length <= 1 && !isLoading && (
                                <div className="w-full pt-4">
                                    <div className="flex items-center gap-3 mb-6 px-4">
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-3 h-3 text-purple-400" />
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Operational Directives</span>
                                        </div>
                                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4">
                                        {quickPrompts.map((prompt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => sendMessage(prompt)}
                                                className="group flex items-center justify-between gap-4 px-5 py-4 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-purple-500/30 rounded-2xl text-left transition-all duration-300 hover:shadow-[0_0_20px_rgba(147,51,234,0.1)]"
                                            >
                                                <span className="text-[12px] font-bold text-white/50 group-hover:text-white transition-colors">{prompt}</span>
                                                <ChevronRight className="w-4 h-4 shrink-0 text-white/10 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    </div>

                    <div className="flex-shrink-0 p-6 bg-gradient-to-t from-[#080808] to-transparent border-t border-white/5">
                        <div className="w-full px-4 relative group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                                placeholder="Execute tactical query..."
                                className="w-full bg-[#121212] text-white border border-white/10 rounded-2xl py-4 px-6 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-2xl placeholder:text-white/20 font-medium text-lg"
                                disabled={isLoading}
                            />
                            <button 
                                onClick={() => sendMessage(input)}
                                disabled={isLoading || !input.trim()}
                                className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 active:scale-95"
                            >
                                <Zap className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-purple-500" />
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Neural Engine: 1.5 Flash</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-blue-500" />
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Security: RBAC Layer 4</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
