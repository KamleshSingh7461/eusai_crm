import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { clientIp, verifyCard } from '@/lib/verification';
import VerifyView from '../VerifyView';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
    title: 'Employee ID verification',
    robots: { index: false, follow: false, nocache: true },
    referrer: 'no-referrer',
};

/** /verify/<token> (shown at verify.<company>/v/<token>): the page a card's QR code opens. */
export default async function VerifyTokenPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const h = await headers();
    const result = await verifyCard({ token: token.slice(0, 64), host: h.get('host') || '', ip: clientIp(h), userAgent: h.get('user-agent') });
    return <VerifyView result={result} />;
}
