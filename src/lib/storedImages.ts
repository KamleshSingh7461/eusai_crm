import prisma from '@/lib/prisma';
import { ALL_COMPANY_ROLES, canManageCompany, staffAccess } from '@/lib/companies';

// ID photos, company logos and signatures live in the StoredImage table and are served by /api/images/:id.

export const IMAGE_KINDS = ['PHOTO', 'LOGO', 'SIGNATURE'] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

export const MAX_IMAGE_BYTES: Record<ImageKind, number> = {
    PHOTO: 1_500_000,
    LOGO: 1_000_000,
    SIGNATURE: 1_000_000,
};

export const imageUrl = (id: string) => `/api/images/${id}`;
export const imageIdFromUrl = (url: string | null | undefined) => (url?.startsWith('/api/images/') ? url.slice('/api/images/'.length) : null);

/** Works out the real type from the file's first bytes; the browser-reported type and the name are ignored. */
export function sniffImage(buf: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
    if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
    if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
    return null;
}

/**
 * Who may see a stored image:
 *  - a logo: anyone signed in (it's printed on cards and will show on the public verification page)
 *  - a photo: the person themselves, Directors, and HR of the person's company
 *  - a signature: Directors and HR of that company
 */
export async function canViewImage(viewer: { id: string; role: string }, img: { kind: string; userId: string | null; companyId: string | null }) {
    if (img.kind === 'LOGO') return true;
    if (ALL_COMPANY_ROLES.includes(viewer.role)) return true;
    if (img.kind === 'PHOTO' && img.userId === viewer.id) return true;
    const access = await staffAccess(viewer);
    if (!access.canManageAny) return false;
    if (img.kind === 'SIGNATURE') return !!img.companyId && access.hrCompanyIds.includes(img.companyId);
    if (img.kind === 'PHOTO' && img.userId) {
        const owner = await prisma.user.findUnique({ where: { id: img.userId }, select: { companyId: true } });
        return !!owner && canManageCompany(access, owner.companyId);
    }
    return false;
}
