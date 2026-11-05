"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** lift and brighten the border on hover */
    interactive?: boolean;
    /** fade-up entrance delay in seconds; omit for no animation */
    delay?: number;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };

export function Card({ className, interactive, delay, padding = 'md', children, ...props }: CardProps) {
    const classes = cn('glass', PADDING[padding], interactive && 'glass-hover cursor-pointer', className);
    if (delay === undefined) {
        return <div className={classes} {...props}>{children}</div>;
    }
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
            className={classes}
            {...(props as any)}
        >
            {children}
        </motion.div>
    );
}

export function CardHeader({ title, description, action, icon, className }: {
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
            <div className="flex min-w-0 items-start gap-3">
                {icon}
                <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold text-white">{title}</h3>
                    {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
                </div>
            </div>
            {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
    );
}

export default Card;
