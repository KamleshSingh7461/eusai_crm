import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({
        className,
        containerClassName,
        label,
        error,
        helperText,
        leftIcon,
        rightIcon,
        id,
        ...props
    }, ref) => {
        const generatedId = React.useId();
        const inputId = id || generatedId;

        return (
            <div className={cn("w-full", containerClassName)}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-xs font-bold text-[#172B4D] mb-1.5 uppercase tracking-wide"
                    >
                        {label}
                    </label>
                )}

                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]">
                            {leftIcon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            "w-full px-3 py-2 text-sm text-[#172B4D] bg-[#FAFBFC] border rounded transition-all duration-200",
                            "placeholder:text-[#6B778C] placeholder:text-xs",
                            "focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 focus:border-[#0052CC] focus:bg-white",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            error
                                ? "border-[#FF5630] focus:ring-[#FF5630]/30 focus:border-[#FF5630]"
                                : "border-[#DFE1E6] hover:border-[#B3BAC5]",
                            leftIcon && "pl-10",
                            rightIcon && "pr-10",
                            className
                        )}
                        {...props}
                    />

                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B778C]">
                            {rightIcon}
                        </div>
                    )}
                </div>

                {(error || helperText) && (
                    <p className={cn(
                        "mt-1.5 text-xs",
                        error ? "text-[#FF5630]" : "text-[#6B778C]"
                    )}>
                        {error || helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
