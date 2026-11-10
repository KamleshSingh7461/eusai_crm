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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: Math.min(delay, 0.2) }}
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
                    <h3 className="font-display text-[15px] font-semibold text-white">{title}</h3>
                    {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
                </div>
            </div>
            {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
    );
}

export default Card;
