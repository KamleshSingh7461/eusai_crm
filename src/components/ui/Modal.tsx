"use client";

import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    /** small element left of the title: an icon tile or an avatar */
    icon?: React.ReactNode;
    /** extra controls in the header, left of the close button */
    headerActions?: React.ReactNode;
    footer?: React.ReactNode;
    /** sm 448px · md 560px · lg 720px · xl 960px · full 1200px */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
    /** render the dialog as a <form>; submit buttons in the footer then submit it */
    onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
    /** set false for dialogs where a stray click outside would lose work */
    closeOnBackdrop?: boolean;
}

const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-[560px]', lg: 'sm:max-w-[720px]', xl: 'sm:max-w-[960px]', full: 'sm:max-w-[1200px]' };
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Icon tile for the left of a modal header. */
export function ModalIcon({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate' }) {
    const tones = {
        blue: 'bg-blue-500/10 text-blue-400 ring-blue-500/20', violet: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20', amber: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
        rose: 'bg-rose-500/10 text-rose-400 ring-rose-500/20', slate: 'bg-zinc-800 text-zinc-300 ring-zinc-700/70',
    };
    return <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset [&_svg]:h-[18px] [&_svg]:w-[18px]', tones[tone])}>{children}</span>;
}

/**
 * The one dialog used across the app: a centred panel on larger screens and a bottom sheet on phones.
 * Header and footer stay put while the body scrolls; Esc and the backdrop close it; focus is trapped
 * inside and returned to where it came from.
 */
export default function Modal({
    open, onClose, title, description, icon, headerActions, footer, size = 'md', children, className, bodyClassName, onSubmit, closeOnBackdrop = true,
}: ModalProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const descId = useId();
    const closeRef = useRef(onClose);
    closeRef.current = onClose;

    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); return; }
            if (e.key !== 'Tab' || !panelRef.current) return;
            const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null);
            if (!items.length) return;
            const first = items[0], last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        // focus the first field (or the panel) once the enter animation has started
        const t = setTimeout(() => {
            const panel = panelRef.current;
            if (!panel || panel.contains(document.activeElement)) return;
            const field = panel.querySelector<HTMLElement>('[data-autofocus], input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])');
            (window.matchMedia('(pointer: fine)').matches && field ? field : panel).focus({ preventScroll: true });
        }, 60);
        return () => {
            clearTimeout(t);
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
            previous?.focus?.({ preventScroll: true });
        };
    }, [open]);

    if (typeof document === 'undefined') return null;

    const Panel: any = onSubmit ? 'form' : 'div';

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-6">
                    <motion.div
                        className="absolute inset-0 bg-black/70"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={closeOnBackdrop ? onClose : undefined}
                    />
                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? titleId : undefined}
                        aria-describedby={description ? descId : undefined}
                        tabIndex={-1}
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                            'relative flex max-h-[92dvh] w-full flex-col overflow-hidden border border-[#2F2F35] bg-[#111113] shadow-2xl shadow-black/60 outline-none',
                            'rounded-t-2xl sm:max-h-[min(88dvh,900px)] sm:rounded-xl',
                            SIZES[size],
                            className
                        )}
                    >
                        <Panel onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate={onSubmit ? false : undefined}>
                            {/* grab handle on phones */}
                            <div className="flex justify-center pt-2 sm:hidden" aria-hidden="true"><span className="h-1 w-9 rounded-full bg-zinc-700" /></div>

                            {(title || description) && (
                                <header className="flex shrink-0 items-start gap-3 border-b border-[#232327] px-5 pb-4 pt-3 sm:px-6 sm:pt-5">
                                    {icon && <div className="shrink-0 pt-0.5">{icon}</div>}
                                    <div className="min-w-0 flex-1">
                                        {title && <h2 id={titleId} className="font-display text-base font-semibold leading-snug text-white sm:text-lg">{title}</h2>}
                                        {description && <div id={descId} className="mt-0.5 text-[13px] leading-relaxed text-zinc-400">{description}</div>}
                                    </div>
                                    <div className="-mr-2 -mt-1 flex shrink-0 items-center gap-1">
                                        {headerActions}
                                        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-[#1F1F23] hover:text-white">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </header>
                            )}

                            <div className={cn('modal-body min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6', bodyClassName)}>{children}</div>

                            {footer && (
                                <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#232327] bg-[#111113] px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-4 sm:pb-4 [&>*]:max-sm:flex-1">
                                    {footer}
                                </footer>
                            )}
                        </Panel>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
