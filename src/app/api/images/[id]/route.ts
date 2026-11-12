import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/companies';
import { canViewImage } from '@/lib/storedImages';

/** GET /api/images/:id : an ID photo, logo or signature, for people allowed to see it. */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
    const user = await currentUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });
    const { id } = await context.params;

    const meta = await prisma.storedImage.findUnique({ where: { id }, select: { kind: true, userId: true, companyId: true } });
    if (!meta || !(await canViewImage(user, meta))) return new NextResponse('Not found', { status: 404 });

    const img = await prisma.storedImage.findUnique({ where: { id }, select: { data: true, mimeType: true } });
    if (!img) return new NextResponse('Not found', { status: 404 });
    return new NextResponse(new Uint8Array(img.data), {
        headers: {
            'Content-Type': img.mimeType,
            'Content-Length': String(img.data.length),
            // a replaced image gets a new id, so a cached copy never goes stale
            'Cache-Control': 'private, max-age=86400, immutable',
            'X-Content-Type-Options': 'nosniff',
            'Content-Disposition': 'inline',
        },
    });
}
