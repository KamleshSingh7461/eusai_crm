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
                    <div key={i} className="flex gap-2 items-start text-xs font-bold text-blue-400 mt-1">
                        <span className="shrink-0">▶</span>
                        <span>{line.replace(/^[-•]\s*/, '')}</span>
                    </div>
                );
            }
            return <p key={i} className={i > 0 ? "mt-2" : ""}>{line.replace(/\*\*/g, '')}</p>;
        });
    };

    return (
        <div className="relative group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111]/80 backdrop-blur-2xl p-6 md:p-8 shadow-2xl transition-all hover:border-purple-500/30">
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
            
            {/* Animated Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-600/20 transition-all duration-700" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-600/20 transition-all duration-700" />

            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-700 border border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.3)] group-hover:scale-110 transition-transform duration-500">
                        <Zap className="w-6 h-6 text-white animate-pulse" />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                            EUSAI Insight Engine
                        </h3>
                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 font-black tracking-widest uppercase">Live Pulse</span>
                        {isLoading && <Loader2 className="w-3 h-3 animate-spin text-purple-400" />}
                    </div>

                    <div className="text-sm text-white/60 font-medium leading-relaxed max-w-4xl">
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
                                    className="flex items-center gap-2 text-red-400/80 font-bold"
                                >
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </motion.div>
                            ) : summary ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[13px] text-white/80"
                                >
                                    {renderContent(summary)}
                                </motion.div>
                            ) : (
                                <p>Awaiting intelligence synchronization...</p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="shrink-0 w-full md:w-auto flex flex-col gap-2">
                    <Link href="/ai-assistant">
                        <button className="group/btn flex items-center justify-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all w-full md:w-auto">
                            Consult Intelligence
                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                    <button 
                        onClick={fetchSummary}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 text-[9px] font-black text-white/30 hover:text-white/60 uppercase tracking-widest transition-all py-1"
                    >
                        <RefreshCcw className={cn("w-3 h-3", isLoading && "animate-spin")} /> Re-Scan
                    </button>
                </div>
            </div>
        </div>
    );
}
