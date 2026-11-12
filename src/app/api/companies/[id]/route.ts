import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ALL_COMPANY_ROLES, clearDomainCache, currentUser } from '@/lib/companies';
import { companySelect, readCompanyInput } from '@/lib/companyInput';

/**
 * PATCH /api/companies/:id : a Director edits a company, sets who its HR people are, or deactivates it.
 * Companies are never deleted, so ID cards issued under them keep verifying truthfully.
 */
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ALL_COMPANY_ROLES.includes(user.role)) return NextResponse.json({ error: 'Only a Director can edit companies.' }, { status: 403 });

    const { id } = await context.params;
    const existing = await prisma.company.findUnique({ where: { id }, select: { id: true, code: true, nextEmployeeNumber: true } });
    if (!existing) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    const input = await readCompanyInput(body, id);
    if (input.error !== undefined || !input.data) return NextResponse.json({ error: input.error }, { status: 400 });

    // the short code is part of every employee ID already issued, so it's fixed from the first one
    if (input.data.code && input.data.code !== existing.code && existing.nextEmployeeNumber > 1) {
        return NextResponse.json({ error: `The short code can't change: employee IDs starting with ${existing.code} have already been issued.` }, { status: 400 });
    }

    const company = await prisma.company.update({
        where: { id },
        data: {
            ...(input.data as any),
            ...(input.hrUserIds ? { hrUsers: { set: input.hrUserIds.map(uid => ({ id: uid })) } } : {}),
        },
        select: companySelect,
    });
    clearDomainCache();
    return NextResponse.json({ company });
}
