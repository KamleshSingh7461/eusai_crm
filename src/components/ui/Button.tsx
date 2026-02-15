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
            primary: "bg-[#0052CC] text-white hover:bg-[#0747A6] active:bg-[#003884] focus:ring-[#0052CC]/50 shadow-sm",
            secondary: "bg-[#FAFBFC] text-[#172B4D] border border-[#DFE1E6] hover:bg-[#EBECF0] active:bg-[#DFE1E6] focus:ring-[#0052CC]/30",
            ghost: "text-[#42526E] hover:bg-[#EBECF0] active:bg-[#DFE1E6] focus:ring-[#0052CC]/30",
            danger: "bg-[#FF5630] text-white hover:bg-[#DE350B] active:bg-[#BF2600] focus:ring-[#FF5630]/50",
            success: "bg-[#36B37E] text-white hover:bg-[#00875A] active:bg-[#006644] focus:ring-[#36B37E]/50"
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
