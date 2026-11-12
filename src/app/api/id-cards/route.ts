import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { canManageCompany, currentUser, staffAccess } from '@/lib/companies';
import { addMonths, cardBlockers, cardCompanySelect, cardPayload, newCardNumber, newCardToken } from '@/lib/idCards';

const MAX_PER_BATCH = 200;

/**
 * GET /api/id-cards?userId=…  every card issued to this person, newest first, with how often each was checked
 * on the verification page, plus the latest checks. For HR and Directors of the person's company.
 */
export async function GET(req: Request) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = new URL(req.url).searchParams.get('userId') || '';
    const person = await prisma.user.findUnique({ where: { id: userId }, select: { companyId: true } });
    if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!canManageCompany(await staffAccess(user), person.companyId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const cards = await prisma.idCard.findMany({
        where: { userId },
        orderBy: { issuedAt: 'desc' },
        take: 20,
        select: {
            id: true, cardNumber: true, token: true, status: true, issuedAt: true, validUntil: true, revokedAt: true, revokedReason: true,
            company: { select: { code: true, verifyDomain: true } },
            _count: { select: { checks: true } },
        },
    });
    const recent = await prisma.verificationLog.findMany({
        where: { cardId: { in: cards.map(c => c.id) } },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { createdAt: true, method: true, result: true, card: { select: { cardNumber: true } } },
    });
    return NextResponse.json({
        cards: cards.map(c => ({
            id: c.id, cardNumber: c.cardNumber, status: c.status, companyCode: c.company.code,
            issuedAt: c.issuedAt.toISOString(), validUntil: c.validUntil.toISOString().slice(0, 10),
            revokedAt: c.revokedAt?.toISOString() || null, revokedReason: c.revokedReason, checks: c._count.checks,
            // HR can open exactly what an outsider sees when scanning this card
            verifyPath: `/verify/${c.token}`,
        })),
        recentChecks: recent.map(r => ({ at: r.createdAt.toISOString(), method: r.method, result: r.result, cardNumber: r.card?.cardNumber })),
    });
}

/**
 * POST /api/id-cards  { userIds: string[], mode: "issue" | "reprint" }
 *  - issue: creates a new card for each person; their previous card is marked REPLACED and stops verifying
 *  - reprint: returns each person's current card unchanged (same number and QR), e.g. after a printer jam
 * Returns the data the printable PDF is drawn from.
 */
export async function POST(req: Request) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const access = await staffAccess(user);
    if (!access.canManageAny) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => null);
    const ids: string[] = Array.isArray(body?.userIds) ? Array.from(new Set(body.userIds.map(String))) : [];
    const mode = body?.mode === 'reprint' ? 'reprint' : 'issue';
    if (ids.length === 0) return NextResponse.json({ error: 'Choose at least one person.' }, { status: 400 });
    if (ids.length > MAX_PER_BATCH) return NextResponse.json({ error: `Print at most ${MAX_PER_BATCH} cards at a time.` }, { status: 400 });

    const people = await prisma.user.findMany({
        where: { id: { in: ids } },
        select: {
            id: true, name: true, email: true, employeeCode: true, designation: true, photoUrl: true, dateOfJoining: true,
            employmentStatus: true, companyId: true, company: { select: cardCompanySelect },
            idCards: { where: { status: 'ACTIVE' }, orderBy: { issuedAt: 'desc' }, take: 1 },
        },
    });
    if (people.length !== ids.length) return NextResponse.json({ error: 'Some of these people no longer exist. Refresh and try again.' }, { status: 400 });

    const problems = people.flatMap(p => {
        if (!canManageCompany(access, p.companyId)) return [{ id: p.id, name: p.name || p.email, missing: ["you don't manage their company"] }];
        const missing = cardBlockers(p);
        if (mode === 'reprint' && !p.idCards[0]) missing.push('a card to reprint');
        return missing.length ? [{ id: p.id, name: p.name || p.email, missing }] : [];
    });
    if (problems.length) {
        return NextResponse.json({ error: `${problems.length} ${problems.length === 1 ? 'person isn\'t' : 'people aren\'t'} ready for a card.`, problems }, { status: 400 });
    }

    const order = new Map(ids.map((id, i) => [id, i]));
    people.sort((a, b) => order.get(a.id)! - order.get(b.id)!);

    if (mode === 'reprint') {
        return NextResponse.json({ cards: people.map(p => cardPayload(p.idCards[0], p, p.company)) });
    }

    const today = new Date();
    const cards = [];
    for (const p of people) {
        const company = p.company!;
        // a random card number can, very rarely, already exist: try again with a fresh one
        for (let attempt = 0; ; attempt++) {
            try {
                const card = await prisma.$transaction(async tx => {
                    await tx.idCard.updateMany({ where: { userId: p.id, status: 'ACTIVE' }, data: { status: 'REPLACED', revokedAt: new Date(), revokedReason: 'Replaced by a new card' } });
                    return tx.idCard.create({
                        data: {
                            cardNumber: newCardNumber(), token: newCardToken(), userId: p.id, companyId: company.id,
                            employeeCode: p.employeeCode!, name: p.name || p.email, designation: p.designation!,
                            validUntil: addMonths(today, company.cardValidityMonths), issuedById: user.id,
                        },
                    });
                });
                cards.push(cardPayload(card, p, company));
                break;
            } catch (err) {
                if (attempt < 3 && err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') continue;
                throw err;
            }
        }
    }
    return NextResponse.json({ cards }, { status: 201 });
}
