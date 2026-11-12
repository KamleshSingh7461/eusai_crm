"use client";

import { Printer } from 'lucide-react';

/** Lets the person checking keep a printed or PDF copy of the result. */
export default function PrintButton() {
    return (
        <button type="button" onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 print:hidden">
            <Printer className="h-4 w-4" aria-hidden="true" />Print or save as PDF
        </button>
    );
}
