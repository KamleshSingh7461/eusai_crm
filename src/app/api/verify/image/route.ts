import { NextResponse } from 'next/server';
import { verifyImage } from '@/lib/verification';

/**
 * GET /api/verify/image?ref=<card token>&kind=photo|logo
 * Public: the holder's photo while their card is valid, and the company logo, for the verification page.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get('ref') || '';
    const kind = searchParams.get('kind') === 'logo' ? 'logo' : 'photo';
    const img = await verifyImage(ref, kind);
    if (!img) return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return new NextResponse(new Uint8Array(img.data), {
        headers: {
            'Content-Type': img.mimeType,
            // short and private: a cancelled card should stop showing its photo quickly
            'Cache-Control': 'private, max-age=60',
            'X-Content-Type-Options': 'nosniff',
            'X-Robots-Tag': 'noindex, noimageindex',
            'Referrer-Policy': 'no-referrer',
        },
    });
}
