import React from 'react';
import { LucideIcon } from 'lucide-react';
import NotionButton from './NotionButton';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <Icon
                className="w-12 h-12 mb-4"
                style={{ color: 'var(--notion-text-disabled)' }}
            />
            <h3
                className="text-base font-medium mb-1"
                style={{ color: 'var(--notion-text-primary)' }}
            >
                {title}
            </h3>
            {description && (
                <p
                    className="text-sm text-center max-w-sm mb-6"
                    style={{ color: 'var(--notion-text-tertiary)' }}
                >
                    {description}
                </p>
            )}
            {action && (
                <NotionButton
                    variant="primary"
                    size="md"
                    leftIcon={action.icon}
                    onClick={action.onClick}
                >
                    {action.label}
                </NotionButton>
            )}
        </div>
    );
}
