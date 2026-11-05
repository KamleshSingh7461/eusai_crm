import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: React.ElementType;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

/** Friendly placeholder for empty lists: glowing icon, one-line explanation, optional action. */
export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
            <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/25 to-violet-500/10 ring-1 ring-inset ring-white/10">
                    <Icon className="h-6 w-6 text-blue-200" />
                </div>
            </div>
            <p className="mt-5 font-display text-base font-bold text-white">{title}</p>
            {description && <p className="mt-1.5 max-w-sm text-sm text-slate-400">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
