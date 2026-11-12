import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ALL_COMPANY_ROLES, clearDomainCache, currentUser, staffAccess } from '@/lib/companies';
import { companySelect, readCompanyInput } from '@/lib/companyInput';

/** GET /api/companies: Directors see every company, HR people see the ones they manage. */
export async function GET() {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const access = await staffAccess(user);
    if (!access.canManageAny) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const where = access.allCompanies ? {} : { id: { in: access.hrCompanyIds } };
    const [companies, counts] = await Promise.all([
        prisma.company.findMany({ where, select: companySelect, orderBy: { legalName: 'asc' } }),
        prisma.user.groupBy({
            by: ['companyId', 'employmentStatus'],
            where: { companyId: { not: null } },
            _count: { _all: true },
        }),
    ]);
    const missing = await prisma.user.groupBy({
        by: ['companyId'],
        where: { companyId: { not: null }, employeeCode: null, employmentStatus: { not: 'EXITED' } },
        _count: { _all: true },
    });

    return NextResponse.json({
        canEdit: access.allCompanies,
        companies: companies.map(c => {
            const mine = counts.filter(x => x.companyId === c.id);
            const n = (s: string) => mine.find(x => x.employmentStatus === s)?._count._all || 0;
            return {
                ...c,
                idsIssued: c.nextEmployeeNumber - 1,
                staff: { active: n('ACTIVE') + n('ON_NOTICE'), exited: n('EXITED'), missingId: missing.find(x => x.companyId === c.id)?._count._all || 0 },
            };
        }),
    });
}

/** POST /api/companies: a Director adds a company. */
export async function POST(req: Request) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ALL_COMPANY_ROLES.includes(user.role)) return NextResponse.json({ error: 'Only a Director can add companies.' }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    const input = await readCompanyInput(body);
    if (input.error) return NextResponse.json({ error: input.error }, { status: 400 });

    const company = await prisma.company.create({
        data: {
            ...(input.data as any),
            ...(input.hrUserIds ? { hrUsers: { connect: input.hrUserIds.map(id => ({ id })) } } : {}),
        },
        select: companySelect,
    });
    clearDomainCache();
    return NextResponse.json({ company }, { status: 201 });
}
