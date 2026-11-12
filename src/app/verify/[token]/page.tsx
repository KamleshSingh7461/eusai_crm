import { headers } from 'next/headers';
import { clientIp, verifyCard } from '@/lib/verification';
import VerifyView from '../VerifyView';
import { hostBrand, verifyMetadata, verifyViewport } from '../brand';

export const dynamic = 'force-dynamic';
export const generateMetadata = verifyMetadata;
export const generateViewport = verifyViewport;

/** /verify/<token> (shown at verify.<company>/v/<token>): the page a card's QR code opens. */
export default async function VerifyTokenPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const h = await headers();
    const [result, hostCompany] = await Promise.all([
        verifyCard({ token: token.slice(0, 64), host: h.get('host') || '', ip: clientIp(h), userAgent: h.get('user-agent') }),
        hostBrand(),
    ]);
    return <VerifyView result={result} hostCompany={hostCompany} />;
}
