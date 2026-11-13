import React from 'react';
import { cn } from '@/lib/utils';

export interface CompanyTagData { code: string; legalName: string; brandColor?: string | null }

/**
 * Which group company employs someone: a small chip with the company's colour and short code, full legal
 * name on hover. Reporting lines and departments cross companies, so this shows up next to names.
 */
export default function CompanyTag({ company, className, size = 'sm' }: { company?: CompanyTagData | null; className?: string; size?: 'xs' | 'sm' }) {
    if (!company) return null;
    const color = company.brandColor && /^#[0-9a-f]{6}$/i.test(company.brandColor) ? company.brandColor : '#71717A';
    return (
        <span
            title={company.legalName}
            aria-label={`Employed by ${company.legalName}`}
            className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-md border font-mono font-semibold tracking-wide',
                size === 'xs' ? 'px-1 py-px text-[10px]' : 'px-1.5 py-0.5 text-[11px]',
                className,
            )}
            style={{ color: `color-mix(in srgb, ${color} 55%, white)`, borderColor: `${color}66`, background: `${color}1F` }}
        >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
            {company.code}
        </span>
    );
}
