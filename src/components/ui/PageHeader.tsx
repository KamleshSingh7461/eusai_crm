"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    /** small line above the title, e.g. "Director overview · Monday, 2 November" */
    eyebrow?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
    /** Hide the title block on phones (the mobile top bar already shows a greeting). */
    hideTitleOnPhone?: boolean;
}

export default function PageHeader({ title, description, eyebrow, actions, className, hideTitleOnPhone }: PageHeaderProps) {
    return (
        <motion.header
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-4', className)}
        >
            <div className={cn('min-w-0', hideTitleOnPhone && 'hidden md:block')}>
                {eyebrow && (
                    <p className="text-[13px] font-medium text-zinc-500">{eyebrow}</p>
                )}
                <h1 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em] text-white sm:text-[28px]">{title}</h1>
                {description && <p className="mt-1.5 max-w-2xl text-sm text-zinc-400">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </motion.header>
    );
}
