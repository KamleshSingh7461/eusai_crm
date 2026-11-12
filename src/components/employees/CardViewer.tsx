"use client";

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { CardPayload } from '@/lib/idCards';
import { type CardImages, loadCardImages } from '@/lib/cardRender';
import { CardFaces } from '@/components/employees/PrintCardsModal';
import Badge from '@/components/ui/Badge';

export type CardState = 'VALID' | 'EXPIRED' | 'REPLACED' | 'REVOKED' | 'EXITED';

export const CARD_STATE: Record<CardState, { label: string; tone: 'emerald' | 'amber' | 'rose' }> = {
    VALID: { label: 'Valid', tone: 'emerald' },
    EXPIRED: { label: 'Expired', tone: 'amber' },
    REPLACED: { label: 'Replaced by a newer card', tone: 'amber' },
    REVOKED: { label: 'Cancelled', tone: 'rose' },
    EXITED: { label: 'No longer valid', tone: 'rose' },
};

export const CardStateBadge = ({ state }: { state: CardState }) => <Badge tone={CARD_STATE[state].tone} dot>{CARD_STATE[state].label}</Badge>;

/** Front and back of an issued card, drawn by the same code as the print file; view only. */
export default function CardViewer({ card }: { card: CardPayload }) {
    const [images, setImages] = useState<CardImages | null>(null);
    useEffect(() => {
        let alive = true;
        setImages(null);
        loadCardImages(card).then(i => { if (alive) setImages(i); });
        return () => { alive = false; };
    }, [card]);

    if (!images) {
        return <div className="flex h-[360px] items-center justify-center text-sm text-zinc-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Drawing the card…</div>;
    }
    return <CardFaces card={{ data: card, images }} />;
}
