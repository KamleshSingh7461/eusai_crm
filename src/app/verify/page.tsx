import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { clientIp, verifyCard } from '@/lib/verification';
import VerifyView from './VerifyView';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
    title: 'Employee ID verification',
    robots: { index: false, follow: false, nocache: true },
    referrer: 'no-referrer',
};

/** /verify, or /verify?card=ABCD-2345 : look a card up by the number printed on its back. */
export default async function VerifyLookupPage({ searchParams }: { searchParams: Promise<{ card?: string }> }) {
    const { card } = await searchParams;
    const typed = (card || '').slice(0, 20);
    if (!typed.trim()) return <VerifyView result={null} />;

    const h = await headers();
    const result = await verifyCard({ cardNumber: typed, host: h.get('host') || '', ip: clientIp(h), userAgent: h.get('user-agent') });
    return <VerifyView result={result} lookupValue={typed.toUpperCase()} />;
}
