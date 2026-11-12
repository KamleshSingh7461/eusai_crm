import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { currentUser, EMPLOYMENT_STATUSES, staffAccess } from '@/lib/companies';
import { employeeJson, employeeSelect } from '@/lib/employeeRecord';

/**
 * GET /api/employees?companyId=&status=&missing=1&q=
 * Employment records for the companies this person manages (all of them for a Director). People not yet
 * linked to any company are included, so HR can assign them.
 */
export async function GET(req: Request) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const access = await staffAccess(user);
    if (!access.canManageAny) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const q = (searchParams.get('q') || '').trim().slice(0, 100);

    const and: Prisma.UserWhereInput[] = [];
    if (!access.allCompanies) and.push({ OR: [{ companyId: { in: access.hrCompanyIds } }, { companyId: null }] });
    if (companyId === 'none') and.push({ companyId: null });
    else if (companyId) and.push({ companyId });
    if (status && (EMPLOYMENT_STATUSES as readonly string[]).includes(status)) and.push({ employmentStatus: status });
    if (searchParams.get('missing') === '1') and.push({ employeeCode: null, employmentStatus: { not: 'EXITED' } });
    if (q) and.push({ OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { employeeCode: { contains: q, mode: 'insensitive' } },
        { designation: { contains: q, mode: 'insensitive' } },
    ] });

    const [people, companies] = await Promise.all([
        prisma.user.findMany({ where: { AND: and }, select: employeeSelect, orderBy: [{ name: 'asc' }], take: 2000 }),
        prisma.company.findMany({
            where: access.allCompanies ? {} : { id: { in: access.hrCompanyIds } },
            select: { id: true, code: true, legalName: true, isActive: true, brandColor: true },
            orderBy: { legalName: 'asc' },
        }),
    ]);
    return NextResponse.json({ employees: people.map(employeeJson), companies, canManageAll: access.allCompanies, me: user.id });
}
