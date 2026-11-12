import React from 'react';
import { cn } from '@/lib/utils';

// Shared look for every text input, select and textarea.
export const fieldClass = cn(
    "w-full h-10 px-3 text-sm text-zinc-100 rounded-lg border border-[#2F2F35] bg-[#18181B] transition-colors duration-150",
    "placeholder:text-zinc-500 hover:border-[#3A3A41]",
    "focus:outline-none focus:border-blue-500/70 focus:ring-[3px] focus:ring-blue-500/15",
    "disabled:opacity-50 disabled:cursor-not-allowed"
);
export const fieldErrorClass = "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/15";

export function FieldLabel({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
    return (
        <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-zinc-300">
            {children}{required && <span className="ml-0.5 text-rose-400">*</span>}
        </label>
    );
}

export function FieldHint({ error, children }: { error?: boolean; children: React.ReactNode }) {
    return <p className={cn("mt-1.5 text-xs", error ? "text-rose-300" : "text-zinc-500")}>{children}</p>;
}
