"use client";

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Bot, Loader2, RefreshCcw, ChevronRight, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardAISummaryProps {
    role: string;
    contextData: any;
}

export default function DashboardAISummary({ role, contextData }: DashboardAISummaryProps) {
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/gemini/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: "SYSTEM_SUMMARY_REQUEST: Provide a brief, 3-sentence high-level executive summary of the current organizational state based on the live data provided in your context. Focus on critical risks or standout achievements. Use bullet points for specific numbers.",
                    history: [] 
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.reply || "Intelligence Uplink Failed");
            }
            
            const data = await res.json();
            setSummary(data.reply);
        } catch (err: any) {
            console.error("AI Summary Error:", err);
            setError(err.message || "Unable to synchronize intelligence.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (contextData) {
            fetchSummary();
        }
    }, [contextData, fetchSummary]);

    // Simple markdown renderer for the summary
    const renderContent = (text: string) => {
        return text.split('\n').map((line, i) => {
            if (line.startsWith('-') || line.startsWith('•')) {
                return (
                    <div key={i} className="flex gap-2 items-start text-xs font-semibold text-blue-400 mt-1">
                        <span className="shrink-0">▶</span>
                        <span>{line.replace(/^[-•]\s*/, '')}</span>
                    </div>
                );
            }
            return <p key={i} className={i > 0 ? "mt-2" : ""}>{line.replace(/\*\*/g, '')}</p>;
        });
    };

    return (
        <div className="glass p-5">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-5">
                <div className="shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-inset ring-violet-500/20">
                        <Zap className="h-[18px] w-[18px] text-violet-400" />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-white">AI summary</h3>
                        <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">Live</span>
                        {isLoading && <Loader2 className="w-3 h-3 animate-spin text-purple-400" />}
                    </div>

                    <div className="max-w-4xl text-sm leading-relaxed text-zinc-400">
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-3 py-2"
                                >
                                    <div className="h-4 w-48 bg-white/5 rounded animate-pulse" />
                                </motion.div>
                            ) : error ? (
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2 text-zinc-400"
                                >
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </motion.div>
                            ) : summary ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-sm text-zinc-300"
                                >
                                    {renderContent(summary)}
                                </motion.div>
                            ) : (
                                <p>No summary yet.</p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <Link href="/ai-assistant">
                        <button className="flex h-9 items-center gap-1.5 rounded-lg border border-[#2F2F35] bg-[#18181B] px-3.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-[#1F1F23]">
                            Open EUSAI AI
                            <ChevronRight className="h-4 w-4 text-zinc-500" />
                        </button>
                    </Link>
                    <button 
                        onClick={fetchSummary}
                        disabled={isLoading}
                        aria-label="Refresh summary" title="Refresh summary"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-[#18181B] hover:text-zinc-200"
                    >
                        <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>
        </div>
    );
}
