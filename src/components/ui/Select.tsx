import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { fieldClass, fieldErrorClass, FieldHint, FieldLabel } from './Field';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    containerClassName?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, containerClassName, label, error, helperText, options, placeholder, id, required, ...props }, ref) => {
        const generatedId = React.useId();
        const selectId = id || generatedId;

        return (
            <div className={cn("w-full", containerClassName)}>
                {label && <FieldLabel htmlFor={selectId} required={required}>{label}</FieldLabel>}
                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        required={required}
                        className={cn(fieldClass, "appearance-none cursor-pointer pr-10", error && fieldErrorClass, className)}
                        {...props}
                    >
                        {placeholder && <option value="">{placeholder}</option>}
                        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                </div>
                {(error || helperText) && <FieldHint error={!!error}>{error || helperText}</FieldHint>}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;
