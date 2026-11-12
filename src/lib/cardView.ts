import prisma from '@/lib/prisma';
import { cardCompanySelect, cardPayload } from '@/lib/idCards';
import { cardState } from '@/lib/verification';

// Loads one ID card for viewing in the CRM (no printing, nothing changes): the same data the printer draws
// from, plus what the card is right now (valid, replaced, cancelled…) so the viewer isn't misled.

const holderSelect = {
    id: true, photoUrl: true, dateOfJoining: true, companyId: true, employeeCode: true, employmentStatus: true, exitDate: true,
} as const;

export async function loadCardForView(where: { id: string } | { userId: string; status: 'ACTIVE' }) {
    const card = 'id' in where
        ? await prisma.idCard.findUnique({ where: { id: where.id }, include: { company: { select: cardCompanySelect }, user: { select: holderSelect } } })
        : await prisma.idCard.findFirst({ where, orderBy: { issuedAt: 'desc' }, include: { company: { select: cardCompanySelect }, user: { select: holderSelect } } });
    if (!card) return null;
    return {
        holderId: card.userId,
        holderCompanyId: card.user.companyId,
        state: cardState(card, card.user),
        card: cardPayload(card, card.user, card.company),
    };
}
