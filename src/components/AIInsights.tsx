'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, TrendingUp, ShieldCheck, Send } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useSpace } from '@/context/SpaceContext';
import { cn } from '@/lib/utils';

interface AIInsightsProps {
    projectId?: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ projectId }) => {
    const { showToast } = useToast();
    const { activeSpace } = useSpace();
    const [insight, setInsight] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMock, setIsMock] = useState(false);
    const [query, setQuery] = useState('');

    const generateInsight = async (customQuery?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/ai/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: projectId || (activeSpace ? activeSpace.id : 'GLOBAL'),
                    query: customQuery,
                    spaceId: activeSpace?.id
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setInsight(data.insight);
                setIsMock(data.isMock);
                showToast('Gemini has analyzed the project stream.', 'success');
            } else {
                setError(data.error || 'Failed to generate insights');
                showToast('Failed to reach Gemini AI services.', 'error');
            }
        } catch (err) {
            setError('Connection failed. Is the server running?');
            showToast('Network error during AI analysis.', 'error');
        } finally {
            setIsLoading(false);
            setQuery('');
        }
    };

    return (
        <div className="card-eusai flex flex-col gap-4 bg-white">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-[#EAE6FF] rounded text-[#403294]">
                    <Sparkles className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-[#172B4D]">Gemini Intelligence</h3>
                    <p className="text-[10px] text-[#6B778C] font-bold uppercase tracking-widest">Enterprise AI Analysis</p>
                </div>
            </div>

            <div className="space-y-4">
                {isLoading && (
                    <div className="py-6 flex flex-col items-center justify-center gap-2 text-[#6B778C]">
                        <Loader2 className="w-6 h-6 animate-spin text-[#0052CC]" />
                        <p className="text-xs italic">Gemini is processing project stream...</p>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-[#FFEBE6] border border-[#FF5630]/20 rounded-sm flex items-start gap-3 text-[#BF2600]">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p className="text-xs">{error}</p>
                    </div>
                )}

                {insight && !isLoading && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                        <div className="text-sm text-[#172B4D] leading-relaxed whitespace-pre-wrap border-l-2 border-[#0052CC] pl-4 py-1">
                            {insight}
                        </div>
                        {isMock && (
                            <div className="flex items-center gap-2 p-1.5 bg-[#FFF0B3] rounded-sm">
                                <ShieldCheck className="w-3 h-3 text-[#172B4D]" />
                                <p className="text-[9px] text-[#172B4D] font-bold uppercase tracking-wider">Simulation Mode</p>
                            </div>
                        )}
                        <button
                            onClick={() => setInsight(null)}
                            className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest hover:text-[#0052CC] transition-colors"
                        >
                            Dismiss Analysis
                        </button>
                    </div>
                )}

                {!isLoading && !insight && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-2">Suggested Questions</p>
                        <div className="flex flex-wrap gap-2">
                            {['Project health?', 'Resource bottlenecks?', 'Next milestones?'].map(q => (
                                <button
                                    key={q}
                                    onClick={() => generateInsight(q)}
                                    className="px-2 py-1 bg-[#F4F5F7] hover:bg-[#DEEBFF] text-[#42526E] hover:text-[#0052CC] text-[10px] font-bold rounded-sm border border-[#DFE1E6] hover:border-[#4C9AFF]/30 transition-all"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {!isLoading && (
                    <div className="flex items-center gap-2 pt-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Ask Gemini..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && query && generateInsight(query)}
                                className="w-full bg-white border border-[#DFE1E6] rounded-sm px-3 py-1.5 text-sm text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/50 focus:border-[#4C9AFF] transition-all placeholder:text-[#6B778C]"
                            />
                        </div>
                        <button
                            onClick={() => query ? generateInsight(query) : generateInsight()}
                            className="btn-eusai-create flex items-center justify-center min-w-[60px]"
                        >
                            {query ? <Send className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIInsights;
