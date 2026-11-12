import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser, dayString } from '@/lib/companies';
import { loadCardForView } from '@/lib/cardView';

/**
 * GET /api/id-cards/mine : the signed-in person's own current ID card (to view, not print), plus their
 * employment details, so they can see what's on file even before a card is issued.
 */
export async function GET() {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [me, view] = await Promise.all([
        prisma.user.findUnique({
            where: { id: user.id },
            select: {
                employeeCode: true, designation: true, dateOfJoining: true, employmentStatus: true, photoUrl: true,
                company: { select: { legalName: true, code: true, hrEmail: true } },
            },
        }),
        loadCardForView({ userId: user.id, status: 'ACTIVE' }),
    ]);
    if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
        employee: {
            employeeCode: me.employeeCode, designation: me.designation, dateOfJoining: dayString(me.dateOfJoining),
            employmentStatus: me.employmentStatus, hasPhoto: !!me.photoUrl, company: me.company,
        },
        state: view?.state ?? null,
        card: view?.card ?? null,
    });
}
