import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { canManageCompany, currentUser, staffAccess } from '@/lib/companies';

const REASONS = ['Lost', 'Stolen', 'Damaged', 'Details changed', 'Other'];

/**
 * PATCH /api/id-cards/:id  { reason }
 * Cancels a card (lost, stolen…). It then shows as cancelled when checked. Issue a new card to replace it.
 */
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const reason = REASONS.includes(body?.reason) ? body.reason : null;
    if (!reason) return NextResponse.json({ error: 'Choose why the card is being cancelled.' }, { status: 400 });

    const card = await prisma.idCard.findUnique({ where: { id }, select: { id: true, status: true, user: { select: { companyId: true } } } });
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    if (!canManageCompany(await staffAccess(user), card.user.companyId)) {
        return NextResponse.json({ error: "You don't manage this person's company." }, { status: 403 });
    }
    if (card.status !== 'ACTIVE') return NextResponse.json({ error: 'This card is already not in use.' }, { status: 400 });

    await prisma.idCard.update({ where: { id }, data: { status: 'REVOKED', revokedAt: new Date(), revokedReason: reason } });
    return NextResponse.json({ ok: true });
}
