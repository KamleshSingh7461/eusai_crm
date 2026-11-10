"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    icon?: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    children: React.ReactNode;
    className?: string;
}

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

/** Centered dialog (bottom sheet on phones). Closes on Esc and backdrop click. */
export default function Modal({ open, onClose, title, description, icon, footer, size = 'md', children, className }: ModalProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
        };
    }, [open, onClose]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-6">
                    <motion.div
                        className="absolute inset-0 bg-black/70"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                            'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[#2F2F35] bg-[#111113] shadow-2xl shadow-black/60 sm:rounded-xl',
                            SIZES[size],
                            className
                        )}
                    >
                        {(title || description) && (
                            <div className="relative flex items-start gap-4 border-b border-[#232327] px-6 py-5">
                                {icon && <div className="shrink-0">{icon}</div>}
                                <div className="min-w-0 flex-1">
                                    {title && <h2 className="font-display text-lg font-semibold text-white">{title}</h2>}
                                    {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
                                </div>
                                <button onClick={onClose} className="-mr-2 -mt-1 rounded-lg p-2 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white" aria-label="Close">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                        <div className="relative flex-1 overflow-y-auto px-6 py-5">{children}</div>
                        {footer && <div className="relative flex flex-wrap items-center justify-end gap-2 border-t border-[#232327] px-6 py-4">{footer}</div>}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
