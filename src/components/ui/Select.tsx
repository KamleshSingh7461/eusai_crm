import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    containerClassName?: string;
    options: { value: string; label: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({
        className,
        containerClassName,
        label,
        error,
        helperText,
        options,
        id,
        ...props
    }, ref) => {
        const generatedId = React.useId();
        const selectId = id || generatedId;

        return (
            <div className={cn("w-full", containerClassName)}>
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-xs font-bold text-[#172B4D] mb-1.5 uppercase tracking-wide"
                    >
                        {label}
                    </label>
                )}

                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        className={cn(
                            "w-full px-3 py-2 pr-10 text-sm text-[#172B4D] bg-[#FAFBFC] border rounded transition-all duration-200 appearance-none cursor-pointer",
                            "focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 focus:border-[#0052CC] focus:bg-white",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            error
                                ? "border-[#FF5630] focus:ring-[#FF5630]/30 focus:border-[#FF5630]"
                                : "border-[#DFE1E6] hover:border-[#B3BAC5]",
                            className
                        )}
                        {...props}
                    >
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B778C] pointer-events-none">
                        <ChevronDown className="w-4 h-4" />
                    </div>
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

Select.displayName = 'Select';

export default Select;
