import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ALL_COMPANY_ROLES, canManageCompany, currentUser, staffAccess } from '@/lib/companies';
import { IMAGE_KINDS, type ImageKind, MAX_IMAGE_BYTES, imageIdFromUrl, imageUrl, sniffImage } from '@/lib/storedImages';

type Target = { field: 'photoUrl' | 'logoUrl' | 'signatureUrl'; current: string | null; userId?: string; companyId?: string };

/** Checks permission and finds where the image goes: a person's photo (HR/Directors) or a company's logo/signature (Directors). */
async function resolveTarget(user: { id: string; role: string }, kind: ImageKind, targetId: string): Promise<Target | { error: string; status: number }> {
    if (kind === 'PHOTO') {
        const person = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, companyId: true, photoUrl: true } });
        if (!person) return { error: 'Person not found', status: 404 };
        const access = await staffAccess(user);
        if (!canManageCompany(access, person.companyId)) return { error: "You don't manage this person's company.", status: 403 };
        return { field: 'photoUrl', current: person.photoUrl, userId: person.id };
    }
    if (!ALL_COMPANY_ROLES.includes(user.role)) return { error: 'Only a Director can change company logos and signatures.', status: 403 };
    const company = await prisma.company.findUnique({ where: { id: targetId }, select: { id: true, logoUrl: true, signatureUrl: true } });
    if (!company) return { error: 'Company not found', status: 404 };
    return kind === 'LOGO'
        ? { field: 'logoUrl', current: company.logoUrl, companyId: company.id }
        : { field: 'signatureUrl', current: company.signatureUrl, companyId: company.id };
}

async function setTarget(t: Target, url: string | null) {
    if (t.userId) await prisma.user.update({ where: { id: t.userId }, data: { photoUrl: url } });
    else await prisma.company.update({ where: { id: t.companyId! }, data: { [t.field]: url } });
    const old = imageIdFromUrl(t.current);
    if (old) await prisma.storedImage.delete({ where: { id: old } }).catch(() => {});
}

/** POST /api/images  multipart { file, kind: PHOTO|LOGO|SIGNATURE, targetId } */
export async function POST(req: Request) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const form = await req.formData().catch(() => null);
    const file = form?.get('file');
    const kind = String(form?.get('kind') || '') as ImageKind;
    const targetId = String(form?.get('targetId') || '');
    if (!IMAGE_KINDS.includes(kind) || !targetId) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    if (!(file instanceof Blob) || file.size === 0) return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 });
    if (file.size > MAX_IMAGE_BYTES[kind]) {
        return NextResponse.json({ error: `The image is too large. Keep it under ${Math.round(MAX_IMAGE_BYTES[kind] / 1_000_000 * 10) / 10} MB.` }, { status: 400 });
    }

    const target = await resolveTarget(user, kind, targetId);
    if ('error' in target) return NextResponse.json({ error: target.error }, { status: target.status });

    const data = Buffer.from(await file.arrayBuffer());
    const mimeType = sniffImage(data);
    if (!mimeType) return NextResponse.json({ error: 'Use a JPG, PNG or WebP image.' }, { status: 400 });

    const img = await prisma.storedImage.create({
        data: { kind, mimeType, size: data.length, data, userId: target.userId ?? null, companyId: target.companyId ?? null, uploadedById: user.id },
        select: { id: true },
    });
    const url = imageUrl(img.id);
    await setTarget(target, url);
    return NextResponse.json({ url }, { status: 201 });
}

/** DELETE /api/images?kind=PHOTO&targetId=... : removes a photo, logo or signature. */
export async function DELETE(req: Request) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const kind = String(searchParams.get('kind') || '') as ImageKind;
    const targetId = String(searchParams.get('targetId') || '');
    if (!IMAGE_KINDS.includes(kind) || !targetId) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const target = await resolveTarget(user, kind, targetId);
    if ('error' in target) return NextResponse.json({ error: target.error }, { status: target.status });
    await setTarget(target, null);
    return NextResponse.json({ ok: true });
}
