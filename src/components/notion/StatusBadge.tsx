import React from 'react';

export type StatusType = 'done' | 'in-progress' | 'not-started' | 'under-review' | 'planned' | 'backlog';

interface StatusBadgeProps {
    status: StatusType;
    size?: 'sm' | 'md';
    className?: string;
}

const statusConfig: Record<StatusType, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
    'done': {
        label: 'Done',
        bgColor: 'var(--status-done-bg)',
        textColor: 'var(--status-done-text)',
        borderColor: 'var(--status-done-border)'
    },
    'in-progress': {
        label: 'In progress',
        bgColor: 'var(--status-progress-bg)',
        textColor: 'var(--status-progress-text)',
        borderColor: 'var(--status-progress-border)'
    },
    'not-started': {
        label: 'Not started',
        bgColor: 'var(--status-not-started-bg)',
        textColor: 'var(--status-not-started-text)',
        borderColor: 'var(--status-not-started-border)'
    },
    'under-review': {
        label: 'Under Review',
        bgColor: 'var(--status-review-bg)',
        textColor: 'var(--status-review-text)',
        borderColor: 'var(--status-review-border)'
    },
    'planned': {
        label: 'Planned',
        bgColor: 'var(--status-planned-bg)',
        textColor: 'var(--status-planned-text)',
        borderColor: 'var(--status-planned-border)'
    },
    'backlog': {
        label: 'Backlog',
        bgColor: 'var(--status-not-started-bg)',
        textColor: 'var(--status-not-started-text)',
        borderColor: 'var(--status-not-started-border)'
    }
};

export default function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
    const config = statusConfig[status];
    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[13px]';

    return (
        <span
            className={`inline-flex items-center rounded-sm font-medium transition-all ${sizeClasses} ${className}`}
            style={{
                backgroundColor: config.bgColor,
                color: config.textColor,
                border: `1px solid ${config.borderColor}`
            }}
        >
            {config.label}
        </span>
    );
}
