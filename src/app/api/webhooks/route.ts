import { NextResponse } from 'next/server';
import { isIP } from 'node:net';
import prisma from '@/lib/prisma';
import { ALL_COMPANY_ROLES, currentUser } from '@/lib/companies';

// Outgoing webhooks: the server posts event data (e.g. a new project) to each registered address.
// Directors only, since a webhook receives CRM data. Addresses must be public HTTPS URLs so the server
// can't be pointed at itself or the internal network.

const EVENTS = ['PROJECT_CREATED', 'PROJECT_UPDATED', 'TASK_COMPLETED'];

async function director() {
    const user = await currentUser();
    if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    if (!ALL_COMPANY_ROLES.includes(user.role)) return { error: NextResponse.json({ error: 'Only a Director can manage webhooks.' }, { status: 403 }) };
    return { user };
}

function publicHttpsUrl(raw: unknown): string | null {
    if (typeof raw !== 'string' || raw.length > 2000) return null;
    let u: URL;
    try { u = new URL(raw); } catch { return null; }
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || !host.includes('.')) return null;
    const ipVersion = isIP(host);
    if (ipVersion === 4) {
        const [a, b] = host.split('.').map(Number);
        if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)) return null;
    }
    if (ipVersion === 6 && (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80'))) return null;
    return u.toString();
}

export async function GET() {
    const auth = await director();
    if (auth.error) return auth.error;
    try {
        return NextResponse.json(await prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } }));
    } catch {
        return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const auth = await director();
    if (auth.error) return auth.error;
    try {
        const { url, event } = await request.json();
        const safeUrl = publicHttpsUrl(url);
        if (!safeUrl) return NextResponse.json({ error: 'Use a public https:// address.' }, { status: 400 });
        if (!EVENTS.includes(event)) return NextResponse.json({ error: `Event must be one of: ${EVENTS.join(', ')}` }, { status: 400 });
        return NextResponse.json(await prisma.webhook.create({ data: { url: safeUrl, event } }), { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const auth = await director();
    if (auth.error) return auth.error;
    try {
        const { id } = await request.json();
        await prisma.webhook.delete({ where: { id: String(id || '') } });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
    }
}
