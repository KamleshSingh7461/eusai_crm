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
            reportingManagers: { select: { id: true, name: true, email: true, role: true, image: true } },
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

/** PATCH /api/me { name } : people can change how their name appears; email and role are managed by admins. */
export async function PATCH(req: Request) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
    if (name.length < 2 || name.length > 80) return NextResponse.json({ error: 'Enter your name, between 2 and 80 characters.' }, { status: 400 });
    if (/[<>{}]/.test(name)) return NextResponse.json({ error: 'Use letters, spaces and simple punctuation in your name.' }, { status: 400 });
    const saved = await prisma.user.update({ where: { id: user.id }, data: { name }, select: { name: true } });
    return NextResponse.json({ name: saved.name });
}
