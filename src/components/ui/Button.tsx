import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const buttonVariants = {
    base: "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B] disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px whitespace-nowrap",
    variant: {
        primary: "text-white bg-blue-600 hover:bg-blue-500",
        secondary: "text-zinc-100 bg-[#18181B] border border-[#2F2F35] hover:bg-[#1F1F23] hover:border-[#3A3A41]",
        outline: "text-zinc-100 bg-transparent border border-[#2F2F35] hover:bg-[#18181B]",
        ghost: "text-zinc-400 hover:text-zinc-100 hover:bg-[#18181B]",
        danger: "text-white bg-red-600 hover:bg-red-500",
        success: "text-white bg-emerald-600 hover:bg-emerald-500",
    },
    size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-3.5 text-sm",
        lg: "h-11 px-5 text-[15px]",
        icon: "h-9 w-9 p-0",
    },
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => (
        <button
            ref={ref}
            className={cn(buttonVariants.base, buttonVariants.variant[variant], buttonVariants.size[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
            {children}
            {!isLoading && rightIcon}
        </button>
    )
);

Button.displayName = 'Button';

export default Button;
