import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: React.ElementType;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

/** Friendly placeholder for empty lists: icon, one-line explanation, optional action. */
export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
            <div className="relative">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 ring-1 ring-inset ring-zinc-700/70">
                    <Icon className="h-5 w-5 text-zinc-300" />
                </div>
            </div>
            <p className="mt-5 font-display text-base font-semibold text-white">{title}</p>
            {description && <p className="mt-1.5 max-w-sm text-sm text-zinc-400">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
