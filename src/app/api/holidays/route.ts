import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMobileSession } from '@/lib/auth-mobile';
import prisma from '@/lib/prisma';
import { todayStatus } from '@/lib/workdays';

// Company holidays. Everyone signed in can read them; only a Director can add, rename or remove one.
const EDITORS = ['DIRECTOR', 'ADMIN'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;

async function currentUser() {
    const session = (await getServerSession(authOptions)) || (await getMobileSession());
    return session?.user ? (session.user as any) : null;
}

const toJson = (h: { id: string; date: Date; name: string }) => ({ id: h.id, date: h.date.toISOString().slice(0, 10), name: h.name });

/** GET /api/holidays?year=2026  (or ?from=yyyy-MM-dd&to=yyyy-MM-dd). Also returns whether today is a day off. */
export async function GET(req: Request) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || '') || new Date().getFullYear();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const range = from && to && DAY.test(from) && DAY.test(to)
        ? { gte: new Date(from), lte: new Date(to) }
        : { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) };

    const [holidays, today] = await Promise.all([
        prisma.holiday.findMany({ where: { date: range }, orderBy: { date: 'asc' } }),
        todayStatus(),
    ]);
    return NextResponse.json({ holidays: holidays.map(toJson), today, canEdit: EDITORS.includes((user.role || '').toUpperCase()) });
}

/** POST { date: "yyyy-MM-dd", name } : adds a holiday, or renames the one already on that date. */
export async function POST(req: Request) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EDITORS.includes((user.role || '').toUpperCase())) return NextResponse.json({ error: 'Only a Director can manage holidays' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const date = typeof body.date === 'string' ? body.date.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
    if (!DAY.test(date) || isNaN(new Date(date).getTime())) return NextResponse.json({ error: 'Pick a valid date' }, { status: 400 });
    if (!name) return NextResponse.json({ error: 'Give the holiday a name' }, { status: 400 });

    const holiday = await prisma.holiday.upsert({
        where: { date: new Date(date) },
        create: { date: new Date(date), name, createdById: user.id },
        update: { name },
    });
    return NextResponse.json(toJson(holiday), { status: 201 });
}

/** DELETE /api/holidays?id=<id> */
export async function DELETE(req: Request) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EDITORS.includes((user.role || '').toUpperCase())) return NextResponse.json({ error: 'Only a Director can manage holidays' }, { status: 403 });

    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Holiday id required' }, { status: 400 });
    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.holiday.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
