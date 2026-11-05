import React from 'react';
import { cn } from '@/lib/utils';
import { humanize, statusTone, TONES, type Tone } from './tones';

interface BadgeProps {
    tone?: Tone;
    dot?: boolean;
    icon?: React.ReactNode;
    size?: 'sm' | 'md';
    className?: string;
    children: React.ReactNode;
}

export function Badge({ tone = 'slate', dot, icon, size = 'sm', className, children }: BadgeProps) {
    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset whitespace-nowrap',
            size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
            TONES[tone].chip,
            className
        )}>
            {dot && <span className={cn('h-1.5 w-1.5 rounded-full', TONES[tone].dot)} />}
            {icon && <span className="[&_svg]:h-3 [&_svg]:w-3">{icon}</span>}
            {children}
        </span>
    );
}

/** Badge for any status/priority string: picks the tone and humanizes the label. */
export function StatusPill({ status, className }: { status?: string | null; className?: string }) {
    if (!status) return null;
    return <Badge tone={statusTone(status)} dot className={className}>{humanize(status)}</Badge>;
}

export default Badge;
