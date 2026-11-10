import React from 'react';
import { cn } from '@/lib/utils';

// Shared look for every text input, select and textarea.
export const fieldClass = cn(
    "w-full h-10 px-3 text-sm text-zinc-100 rounded-xl border border-white/[0.08] bg-white/[0.03] transition-all duration-200",
    "placeholder:text-zinc-500 hover:border-white/[0.14]",
    "focus:outline-none focus:border-blue-400/60 focus:bg-white/[0.05] focus:ring-4 focus:ring-blue-500/15",
    "disabled:opacity-50 disabled:cursor-not-allowed"
);
export const fieldErrorClass = "border-rose-400/60 focus:border-rose-400 focus:ring-rose-500/15";

export function FieldLabel({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
    return (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-zinc-300">
            {children}{required && <span className="ml-0.5 text-rose-400">*</span>}
        </label>
    );
}

export function FieldHint({ error, children }: { error?: boolean; children: React.ReactNode }) {
    return <p className={cn("mt-1.5 text-xs", error ? "text-rose-300" : "text-zinc-500")}>{children}</p>;
}
