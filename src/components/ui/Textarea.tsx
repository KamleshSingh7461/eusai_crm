import React from 'react';
import { cn } from '@/lib/utils';
import { fieldClass, fieldErrorClass, FieldHint, FieldLabel } from './Field';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    containerClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, containerClassName, label, error, helperText, id, required, rows = 4, ...props }, ref) => {
        const generatedId = React.useId();
        const textareaId = id || generatedId;

        return (
            <div className={cn("w-full", containerClassName)}>
                {label && <FieldLabel htmlFor={textareaId} required={required}>{label}</FieldLabel>}
                <textarea
                    ref={ref}
                    id={textareaId}
                    rows={rows}
                    required={required}
                    className={cn(fieldClass, "h-auto py-2.5 leading-relaxed resize-y", error && fieldErrorClass, className)}
                    {...props}
                />
                {(error || helperText) && <FieldHint error={!!error}>{error || helperText}</FieldHint>}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

export default Textarea;
