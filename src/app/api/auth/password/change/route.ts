import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/companies';
import { allow } from '@/lib/rateLimit';

/**
 * POST /api/auth/password/change { currentPassword, newPassword }
 * Changes the email sign-in password of someone who already has one. Needs the current password, and wrong
 * guesses are limited, so a session left open on a shared computer can't be used to take over the account.
 */
export async function POST(req: Request) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
    if (!allow(`pwchange:${user.id}`, 5, 15 * 60_000)) {
        return NextResponse.json({ error: 'Too many attempts. Wait 15 minutes and try again.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const current = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
    const next = typeof body?.newPassword === 'string' ? body.newPassword : '';
    if (next.length < 8 || next.length > 128) return NextResponse.json({ error: 'Use at least 8 characters for the new password.' }, { status: 400 });

    const me = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } });
    if (!me?.password) return NextResponse.json({ error: "You don't have a password yet. Set one instead." }, { status: 400 });
    if (!(await bcrypt.compare(current, me.password))) return NextResponse.json({ error: 'Your current password is incorrect.' }, { status: 400 });
    if (await bcrypt.compare(next, me.password)) return NextResponse.json({ error: 'Choose a password different from your current one.' }, { status: 400 });

    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(next, 10) } });
    return NextResponse.json({ message: 'Password changed.' });
}
