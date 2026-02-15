"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Loader2, Sparkles, Bot } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export default function GeminiAssistant({ onClose }: { onClose: () => void }) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: `Hello ${session?.user?.name || 'there'}! I'm your EUSAI AI assistant. How can I help you with the platform today?`,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/gemini/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg.content, context: "user_help" })
            });

            if (!res.ok) throw new Error("Failed to get response");

            const data = await res.json();
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.reply,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-[50] animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Gemini Assistant</h3>
                        <p className="text-[10px] text-white/80">Powered by Google AI</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex max-w-[85%] rounded-2xl p-3 text-sm shadow-sm",
                            msg.role === "user"
                                ? "ml-auto bg-blue-600 text-white rounded-br-none"
                                : "mr-auto bg-white border border-gray-100 text-gray-800 rounded-bl-none"
                        )}
                    >
                        {msg.role === "assistant" && (
                            <Bot className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0 inline-block" />
                        )}
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                    </div>
                ))}
                {isLoading && (
                    <div className="mr-auto bg-white border border-gray-100 text-gray-500 rounded-2xl rounded-bl-none p-3 text-sm shadow-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Thinking...
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask for help..."
                    className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-800"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
