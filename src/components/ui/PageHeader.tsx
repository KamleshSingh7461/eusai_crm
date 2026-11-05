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
}

export default function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
    return (
        <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-4', className)}
        >
            <div className="min-w-0">
                {eyebrow && (
                    <p className="flex items-center gap-2 text-sm font-medium text-blue-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,1)]" />
                        {eyebrow}
                    </p>
                )}
                <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h1>
                {description && <p className="mt-2 max-w-2xl text-base text-slate-400">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </motion.header>
    );
}
