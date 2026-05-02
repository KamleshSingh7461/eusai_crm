"use client";

import { cn } from '@/lib/utils';

interface RichTextProps {
    content: string;
    isMe: boolean;
}

export default function RichText({ content, isMe }: RichTextProps) {
    if (!content) return null;
    const mentionRegex = /@\[([^\]]+)\]\(user:([^\)]+)\)/g;
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
        if (i % 3 === 0) {
            result.push(renderFormattedText(parts[i], `text-${i}`));
        } else if (i % 3 === 1) {
            result.push(
                <span 
                    key={`mention-${i}`} 
                    className={cn(
                        "font-black px-2 py-0.5 rounded-md border text-[11px] mx-0.5 shadow-sm inline-flex items-center gap-1", 
                        isMe ? "bg-white/20" : "bg-blue-600/20 text-blue-400"
                    )}
                >
                    @{parts[i]}
                </span>
            );
        }
    }
    return <div className="whitespace-pre-wrap">{result}</div>;
}
