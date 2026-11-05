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
    base: "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] whitespace-nowrap",
    variant: {
        primary: "text-white bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 shadow-[0_8px_24px_-8px_rgba(59,130,246,0.8),inset_0_1px_0_rgba(255,255,255,0.25)]",
        secondary: "text-slate-200 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14]",
        outline: "text-slate-200 bg-transparent border border-white/[0.12] hover:bg-white/[0.05]",
        ghost: "text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]",
        danger: "text-white bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 shadow-[0_8px_24px_-10px_rgba(244,63,94,0.8),inset_0_1px_0_rgba(255,255,255,0.2)]",
        success: "text-white bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-[0_8px_24px_-10px_rgba(16,185,129,0.8),inset_0_1px_0_rgba(255,255,255,0.2)]",
    },
    size: {
        sm: "h-8 px-3 text-xs rounded-lg",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 p-0",
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
