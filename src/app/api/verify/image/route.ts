import { NextResponse } from 'next/server';
import { companyLogo, verifyImage } from '@/lib/verification';

/**
 * Public images for the verification page:
 *   ?kind=photo&ref=<card token>   the holder's photo, only while their card is valid
 *   ?kind=logo&ref=<card token>    the card's company logo
 *   ?kind=logo&company=<CODE>      a company's logo (lookup page, browser tab icon)
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get('kind') === 'logo' ? 'logo' : 'photo';
    const code = searchParams.get('company');
    const img = kind === 'logo' && code ? await companyLogo(code) : await verifyImage(searchParams.get('ref') || '', kind);
    if (!img) return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return new NextResponse(new Uint8Array(img.data), {
        headers: {
            'Content-Type': img.mimeType,
            // photos: short and private, so a cancelled card stops showing its photo quickly; logos can be cached
            'Cache-Control': kind === 'logo' ? 'public, max-age=3600' : 'private, max-age=60',
            'X-Content-Type-Options': 'nosniff',
            'X-Robots-Tag': 'noindex, noimageindex',
            'Referrer-Policy': 'no-referrer',
        },
    });
}
