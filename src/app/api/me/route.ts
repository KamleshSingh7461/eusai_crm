import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/companies';

/** GET /api/me : the signed-in person's own profile, for the Profile page. */
export async function GET() {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const me = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            id: true, name: true, email: true, role: true, image: true, department: true, createdAt: true, lastLogin: true,
            password: true,
            company: { select: { legalName: true, code: true, brandColor: true } },
            memberSpaces: { select: { id: true, name: true, color: true }, orderBy: { name: 'asc' } },
            reportingManagers: { select: { id: true, name: true, email: true, role: true, image: true, company: { select: { code: true, legalName: true, brandColor: true } } } },
            reportingSubordinates: { where: { isSuspended: false }, select: { id: true } },
            hrCompanies: { select: { code: true, legalName: true } },
            accounts: { select: { provider: true } },
        },
    });
    if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { password, accounts, reportingSubordinates, ...rest } = me;
    return NextResponse.json({
        ...rest,
        createdAt: me.createdAt.toISOString(),
        lastLogin: me.lastLogin?.toISOString() || null,
        hasPassword: !!password,
        googleLinked: accounts.some(a => a.provider === 'google'),
        teamSize: reportingSubordinates.length,
    });
}

// Names are official records (printed on ID cards): only HR and Directors change them, from the
// employment popup or Team → Edit member. There is deliberately no way to rename yourself here.
