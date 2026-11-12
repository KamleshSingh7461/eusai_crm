import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { companyForHost, type VerifyCompany } from '@/lib/verification';

// Browser tab title, icon and address-bar colour for the verification pages, in the company's branding when
// the visitor is on that company's verify.<domain> address.

export async function hostBrand(): Promise<VerifyCompany | null> {
    const h = await headers();
    return companyForHost(h.get('host') || '');
}

const shortName = (legalName: string) => legalName.replace(/\s+(Private|Pvt\.?)\s+(Limited|Ltd\.?)$/i, '');

export async function verifyMetadata(): Promise<Metadata> {
    const c = await hostBrand();
    return {
        title: c ? `Verify an employee ID · ${shortName(c.legalName)}` : 'Verify an employee ID',
        description: c ? `Official employee ID verification for ${c.legalName}.` : 'Official employee ID verification.',
        robots: { index: false, follow: false, nocache: true },
        referrer: 'no-referrer',
        ...(c?.hasLogo ? { icons: { icon: `/api/verify/image?kind=logo&company=${c.code}`, apple: `/api/verify/image?kind=logo&company=${c.code}` } } : {}),
    };
}

export async function verifyViewport(): Promise<Viewport> {
    const c = await hostBrand();
    return { themeColor: c?.brandColor || '#1E3A5F', colorScheme: 'light' };
}
