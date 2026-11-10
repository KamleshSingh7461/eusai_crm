import React from 'react';
import { cn } from '@/lib/utils';
import { fieldClass, fieldErrorClass, FieldHint, FieldLabel } from './Field';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, containerClassName, label, error, helperText, leftIcon, rightIcon, id, required, ...props }, ref) => {
        const generatedId = React.useId();
        const inputId = id || generatedId;

        return (
            <div className={cn("w-full", containerClassName)}>
                {label && <FieldLabel htmlFor={inputId} required={required}>{label}</FieldLabel>}
                <div className="relative">
                    {leftIcon && <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 [&_svg]:h-4 [&_svg]:w-4">{leftIcon}</div>}
                    <input
                        ref={ref}
                        id={inputId}
                        required={required}
                        aria-invalid={!!error}
                        className={cn(fieldClass, error && fieldErrorClass, leftIcon && "pl-10", rightIcon && "pr-10", className)}
                        {...props}
                    />
                    {rightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 [&_svg]:h-4 [&_svg]:w-4">{rightIcon}</div>}
                </div>
                {(error || helperText) && <FieldHint error={!!error}>{error || helperText}</FieldHint>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
