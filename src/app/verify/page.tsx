import { headers } from 'next/headers';
import { clientIp, verifyCard } from '@/lib/verification';
import VerifyView from './VerifyView';
import { hostBrand, verifyMetadata, verifyViewport } from './brand';

export const dynamic = 'force-dynamic';
export const generateMetadata = verifyMetadata;
export const generateViewport = verifyViewport;

/** /verify, or /verify?card=ABCD-2345 : look a card up by the number printed on its back. */
export default async function VerifyLookupPage({ searchParams }: { searchParams: Promise<{ card?: string }> }) {
    const { card } = await searchParams;
    const typed = (card || '').slice(0, 20);
    const hostCompany = await hostBrand();
    if (!typed.trim()) return <VerifyView result={null} hostCompany={hostCompany} />;

    const h = await headers();
    const result = await verifyCard({ cardNumber: typed, host: h.get('host') || '', ip: clientIp(h), userAgent: h.get('user-agent') });
    return <VerifyView result={result} hostCompany={hostCompany} lookupValue={typed.toUpperCase()} />;
}
