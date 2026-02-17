import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import StatusBadge, { StatusType } from './StatusBadge';

interface TemplateCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    iconBgColor?: string;
    href?: string;
    badges?: StatusType[];
    preview?: {
        type: 'table' | 'list';
        items: string[];
    };
    onClick?: () => void;
}

export default function TemplateCard({
    title,
    description,
    icon: Icon,
    iconBgColor = 'var(--notion-accent-blue)',
    href,
    badges = [],
    preview,
    onClick
}: TemplateCardProps) {
    const cardContent = (
        <>
            {/* Header */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--notion-border-default)' }}>
                <div className="flex items-start gap-3">
                    <div
                        className="p-2 rounded-md flex-shrink-0"
                        style={{ backgroundColor: iconBgColor }}
                    >
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3
                            className="font-semibold text-sm mb-1 group-hover:text-[var(--notion-accent-blue)] transition-colors truncate"
                            style={{ color: 'var(--notion-text-primary)' }}
                        >
                            {title}
                        </h3>
                        <p
                            className="text-xs leading-relaxed"
                            style={{ color: 'var(--notion-text-tertiary)' }}
                        >
                            {description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Badges */}
            {badges.length > 0 && (
                <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b" style={{ borderColor: 'var(--notion-border-default)' }}>
                    {badges.map((badge, index) => (
                        <StatusBadge key={index} status={badge} size="sm" />
                    ))}
                </div>
            )}

            {/* Preview Content */}
            {preview && (
                <div className="p-4">
                    {preview.type === 'table' && (
                        <div className="space-y-1.5">
                            {preview.items.slice(0, 3).map((item, index) => (
                                <div
                                    key={index}
                                    className="h-6 rounded-sm"
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                                >
                                    <div className="h-full flex items-center px-2">
                                        <div
                                            className="h-2 rounded-full"
                                            style={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                width: `${60 + Math.random() * 30}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {preview.type === 'list' && (
                        <div className="space-y-1.5">
                            {preview.items.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-sm border flex-shrink-0"
                                        style={{ borderColor: 'var(--notion-border-default)' }}
                                    />
                                    <span className="text-xs truncate" style={{ color: 'var(--notion-text-secondary)' }}>
                                        {item}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Hover Effect */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                    background: 'linear-gradient(to bottom, rgba(35, 131, 226, 0.05), transparent)',
                }}
            />
        </>
    );

    const baseClasses = "group relative overflow-hidden rounded-md border transition-all cursor-pointer";
    const baseStyles = {
        backgroundColor: 'var(--notion-bg-secondary)',
        borderColor: 'var(--notion-border-default)'
    };

    if (href) {
        return (
            <Link href={href} className={baseClasses} style={baseStyles}>
                {cardContent}
            </Link>
        );
    }

    return (
        <div onClick={onClick} className={baseClasses} style={baseStyles}>
            {cardContent}
        </div>
    );
}
