"use client";

import { Sparkles, Send, Lightbulb, User, Bot, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AIAssistantPage() {
    const { data: session } = useSession();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hello! I'm EUSAI AI, your intelligent assistant. I can help you manage tasks, analyze project health, or answer questions about your team's work. How can I help you today?",
            timestamp: new Date()
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const suggestions = [
        "Show me my pending tasks",
        "What projects are behind schedule?",
        "Summarize this week's activity",
        "Create a new project plan"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    const handleSend = async (content: string) => {
        if (!content.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: content,
            timestamp: new Date()
        };

        // Add user message immediately
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Create placeholder for AI response
            const aiMessagePlaceholder: Message = {
                role: 'assistant',
                content: '',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessagePlaceholder]);

            const res = await fetch('/api/ai/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: content,
                    projectId: 'GLOBAL'
                })
            });

            if (!res.ok || !res.body) throw new Error('Failed to get response');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let aiText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                aiText += chunk;

                // Update the last message (AI response) with new chunk
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    lastMsg.content = aiText;
                    return newMessages;
                });
            }

        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                lastMsg.content = "I'm sorry, I encountered an error. Please try again.";
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Adjusted height to account for AppShell Navbar (approx 64px) + Padding (32px) + Safety
        <div className="flex flex-col h-[calc(100dvh-6rem)] md:h-[calc(100vh-6rem)] w-full bg-[var(--notion-bg-primary)] relative">
            {/* Minimal Header */}
            <div className="flex-shrink-0 px-1 py-2 border-b border-[var(--notion-border-default)] flex items-center justify-between bg-[var(--notion-bg-primary)] z-10">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <h1 className="text-sm font-semibold text-heading">EUSAI Assistant</h1>
                </div>
                <div className="text-[10px] md:text-xs text-subheading px-2 py-0.5 rounded bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)]">
                    Gemini Flash
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 md:space-y-6 scrollbar-thin scrollbar-thumb-[var(--notion-border-default)] scrollbar-track-transparent pb-32 md:pb-4">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex gap-3 max-w-3xl",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                    >
                        <div className={cn(
                            "w-6 h-6 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5",
                            msg.role === 'assistant'
                                ? "bg-purple-500/10 text-purple-500"
                                : "bg-[var(--notion-text-primary)] text-[var(--notion-bg-primary)]"
                        )}>
                            {msg.role === 'assistant'
                                ? <Bot className="w-4 h-4" />
                                : <User className="w-4 h-4" />
                            }
                        </div>

                        <div className={cn(
                            "text-sm leading-relaxed max-w-[85%] md:max-w-[75%]",
                            msg.role === 'assistant'
                                ? "text-heading"
                                : "text-heading bg-[var(--notion-bg-secondary)] px-3 py-2 rounded-lg border border-[var(--notion-border-default)]"
                        )}>
                            <div className="whitespace-pre-wrap break-words">{msg.content || (isLoading && idx === messages.length - 1 ? "..." : "")}</div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed on Mobile, Sticky/Static on Desktop */}
            <div className={cn(
                "p-3 bg-[var(--notion-bg-primary)] z-30",
                "fixed bottom-0 left-0 right-0 border-t border-[var(--notion-border-default)] md:border-none",
                "md:static md:bg-transparent md:p-0 md:pb-16"
            )}>
                <div className="max-w-3xl mx-auto flex flex-col gap-2 md:gap-3">
                    {/* Suggestions */}
                    {messages.length < 3 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {suggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(suggestion)}
                                    disabled={isLoading}
                                    className="whitespace-nowrap flex-shrink-0 text-xs text-subheading bg-[var(--notion-bg-secondary)] hover:bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border-default)] rounded px-3 py-1.5 transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-end gap-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-lg p-2 shadow-sm focus-within:ring-1 focus-within:ring-[var(--notion-border-active)] transition-all">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything..."
                            disabled={isLoading}
                            rows={1}
                            className="flex-1 bg-transparent border-none text-base md:text-sm text-heading placeholder:text-subheading focus:ring-0 resize-none py-2 max-h-32 min-h-[40px]"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(input);
                                }
                            }}
                            style={{ minHeight: '20px' }}
                        />
                        <button
                            onClick={() => handleSend(input)}
                            disabled={!input.trim() || isLoading}
                            className={cn(
                                "p-2 rounded transition-colors flex-shrink-0",
                                input.trim() && !isLoading
                                    ? "bg-[var(--notion-text-primary)] text-[var(--notion-bg-primary)] hover:opacity-90"
                                    : "text-subheading cursor-not-allowed"
                            )}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="text-[10px] text-center text-subheading opacity-50">
                        AI can make mistakes. Consider checking important information.
                    </div>
                </div>
            </div>
        </div>
    );
}

