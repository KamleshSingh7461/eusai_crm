"use client";

import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableSectionProps {
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    storageKey?: string;
    className?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
}

export default function ExpandableSection({
    title,
    children,
    defaultExpanded = true,
    storageKey,
    className,
    icon,
    actions
}: ExpandableSectionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // Load expanded state from localStorage on mount
    useEffect(() => {
        if (storageKey && typeof window !== 'undefined') {
            const saved = localStorage.getItem(storageKey);
            if (saved !== null) {
                setIsExpanded(saved === 'true');
            }
        }
    }, [storageKey]);

    // Save expanded state to localStorage
    const toggleExpanded = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        if (storageKey && typeof window !== 'undefined') {
            localStorage.setItem(storageKey, String(newState));
        }
    };

    return (
        <div className={cn("select-none", className)}>
            <div
                onClick={toggleExpanded}
                className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-[#2c2c2c] rounded-sm transition-colors group"
            >
                <div className="flex items-center gap-2 flex-1">
                    <ChevronRight
                        className={cn(
                            "w-3.5 h-3.5 text-[rgba(255,255,255,0.4)] transition-transform flex-shrink-0",
                            isExpanded && "rotate-90"
                        )}
                    />
                    {icon && <span className="text-[rgba(255,255,255,0.4)]">{icon}</span>}
                    <span className="text-xs font-semibold text-[rgba(255,255,255,0.6)] group-hover:text-[rgba(255,255,255,0.9)] transition-colors">
                        {title}
                    </span>
                </div>
                {actions && <div onClick={(e) => e.stopPropagation()}>{actions}</div>}
            </div>

            <div
                className={cn(
                    "overflow-hidden transition-all duration-200 ease-in-out",
                    isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="pl-2 py-1">
                    {children}
                </div>
            </div>
        </div>
    );
}
