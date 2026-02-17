import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        className,
        variant = 'primary',
        size = 'md',
        isLoading = false,
        leftIcon,
        rightIcon,
        children,
        disabled,
        ...props
    }, ref) => {
        const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

        const variants = {
            primary: "bg-[var(--notion-bg-blue)] text-white hover:bg-[var(--notion-bg-blue-hover)] active:opacity-90 focus:ring-[var(--notion-bg-blue)]/50 shadow-sm",
            secondary: "bg-[var(--notion-bg-secondary)] text-[var(--notion-text-primary)] border border-[var(--notion-border-default)] hover:bg-[var(--notion-bg-tertiary)] active:bg-[var(--notion-bg-secondary)] focus:ring-[var(--notion-border-focus)]/30",
            ghost: "text-[var(--notion-text-secondary)] hover:bg-[var(--notion-bg-hover)] active:bg-[var(--notion-bg-tertiary)] focus:ring-[var(--notion-border-focus)]/30",
            danger: "bg-[var(--notion-red)] text-white hover:opacity-90 active:opacity-80 focus:ring-[var(--notion-red)]/50",
            success: "bg-[var(--notion-green)] text-white hover:opacity-90 active:opacity-80 focus:ring-[var(--notion-green)]/50"
        };

        const sizes = {
            sm: "px-3 py-1.5 text-xs",
            md: "px-4 py-2 text-sm",
            lg: "px-6 py-3 text-base"
        };

        return (
            <button
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : leftIcon}
                {children}
                {!isLoading && rightIcon}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
