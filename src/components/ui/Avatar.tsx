'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { TONES, type Tone } from './tones';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    fallback: string;
    className?: string;
    tone?: Tone;
}

const TONE_ORDER: Tone[] = ['blue', 'violet', 'emerald', 'amber', 'cyan', 'rose'];

/** Stable tone per name so the same person always gets the same color. */
export const toneFor = (seed: string): Tone => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    return TONE_ORDER[Math.abs(hash) % TONE_ORDER.length];
};

export const initialsOf = (name?: string | null) =>
    (name || '?').trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();

export default function Avatar({ src, alt = "User", fallback, className = "", tone }: AvatarProps) {
    const [imgError, setImgError] = useState(false);

    if (!src || imgError) {
        const t = tone ?? toneFor(alt + fallback);
        return (
            <div
                className={cn('flex shrink-0 items-center justify-center rounded-full  font-semibold  ring-1 ring-inset', TONES[t].tile, className)}
                title={alt}
            >
                {fallback}
            </div>
        );
    }

    // Native img: avatars come from arbitrary domains (Google etc.) that next/image would need whitelisted.
    return <img src={src} alt={alt} onError={() => setImgError(true)} className={cn('shrink-0 rounded-full object-cover ring-1 ring-white/10', className)} />;
}
