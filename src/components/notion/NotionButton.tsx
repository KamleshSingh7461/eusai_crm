import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NotionButtonProps {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
    fullWidth?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    className?: string;
}

export default function NotionButton({
    children,
    variant = 'default',
    size = 'md',
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    fullWidth = false,
    disabled = false,
    onClick,
    type = 'button',
    className = ''
}: NotionButtonProps) {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        default: 'border hover:bg-[var(--notion-bg-hover)]',
        primary: 'text-white',
        ghost: 'hover:bg-[var(--notion-bg-hover)]',
        danger: 'border text-[var(--notion-accent-red)] hover:bg-[rgba(235,87,87,0.1)]'
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base'
    };

    const iconSizes = {
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    backgroundColor: 'var(--notion-accent-blue)',
                    border: 'none'
                };
            case 'default':
                return {
                    borderColor: 'var(--notion-border-default)',
                    color: 'var(--notion-text-primary)'
                };
            case 'ghost':
                return {
                    border: 'none',
                    color: 'var(--notion-text-secondary)'
                };
            case 'danger':
                return {
                    borderColor: 'var(--notion-border-default)'
                };
        }
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
            style={getVariantStyles()}
        >
            {LeftIcon && <LeftIcon className={iconSizes[size]} />}
            {children}
            {RightIcon && <RightIcon className={iconSizes[size]} />}
        </button>
    );
}
