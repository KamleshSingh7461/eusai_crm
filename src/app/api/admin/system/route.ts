import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { APP_ENV } from '@/lib/env';

export const dynamic = 'force-dynamic';

// GET /api/admin/system?view=health|logs : director-only platform health and recent activity log.
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (role !== 'DIRECTOR') return NextResponse.json({ error: 'Directors only' }, { status: 403 });

    const view = new URL(request.url).searchParams.get('view') || 'health';

    if (view === 'logs') {
        const activities = await prisma.activity.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100,
            include: { user: { select: { name: true, email: true } }, project: { select: { id: true, name: true } } },
        });
        return NextResponse.json({ activities });
    }

    const started = Date.now();
    let database: { ok: boolean; latencyMs: number | null; error?: string } = { ok: false, latencyMs: null };
    try {
        await prisma.$queryRaw`SELECT 1`;
        database = { ok: true, latencyMs: Date.now() - started };
    } catch (e: any) {
        database = { ok: false, latencyMs: null, error: 'Database unreachable' };
    }

    const counts = database.ok
        ? Object.fromEntries(await Promise.all(([
            ['users', prisma.user.count()],
            ['projects', prisma.project.count()],
            ['tasks', prisma.task.count()],
            ['milestones', prisma.milestone.count()],
            ['dailyReports', prisma.dailyReport.count()],
            ['openIssues', prisma.issue.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } })],
        ] as const).map(async ([k, p]) => [k, await p])))
        : {};

    const configured = {
        googleSignIn: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        email: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
        cronSecret: !!process.env.CRON_SECRET,
        ai: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    };

    return NextResponse.json({
        environment: APP_ENV,
        node: process.version,
        uptimeSeconds: Math.round(process.uptime()),
        memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        database,
        counts,
        configured,
        checkedAt: new Date().toISOString(),
    });
}
