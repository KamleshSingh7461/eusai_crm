'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    fallback: string;
    className?: string;
}

export default function Avatar({ src, alt = "User", fallback, className = "" }: AvatarProps) {
    const [imgError, setImgError] = useState(false);

    // Default styling for the fallback initials block
    const fallbackClass = `flex items-center justify-center bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] font-bold uppercase ${className}`;

    if (!src || imgError) {
        return (
            <div className={fallbackClass} title={alt}>
                {fallback}
            </div>
        );
    }

    // Attempt to render the image. If it fails (e.g., broken URL, 404), switch to fallback.
    // Using native img tag here instead of next/image since user avatars come from diverse unpredictable domains
    // and next/image requires strict hostname configurations in next.config.js which might block valid external Google URLs.
    return (
        <img
            src={src}
            alt={alt}
            onError={() => setImgError(true)}
            className={`object-cover ${className}`}
        />
    );
}
