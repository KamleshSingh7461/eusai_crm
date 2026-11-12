import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { canManageCompany, currentUser, EMPLOYMENT_STATUSES, issueEmployeeCode, parseDay, staffAccess } from '@/lib/companies';
import { employeeJson, employeeSelect } from '@/lib/employeeRecord';

const select = { ...employeeSelect, isSuspended: true } as const;

/**
 * Who may read someone's employment record: the person, Directors and HR of their company, Management
 * (read-only across the organisation), and the managers or team leaders they report to (the same people
 * the Team pages show them to).
 */
async function canView(viewer: { id: string; role: string }, personId: string, canManage: boolean) {
    if (viewer.id === personId || canManage || viewer.role === 'MANAGEMENT') return true;
    if (viewer.role === 'TEAM_LEADER') {
        return (await prisma.user.count({ where: { id: personId, reportingManagers: { some: { id: viewer.id } } } })) > 0;
    }
    if (viewer.role === 'MANAGER') {
        return (await prisma.user.count({
            where: {
                id: personId,
                OR: [{ reportingManagers: { some: { id: viewer.id } } }, { memberSpaces: { some: { managerId: viewer.id } } }],
            },
        })) > 0;
    }
    return false;
}

/** GET /api/employees/:id : employment summary for a profile page, and whether the viewer may edit it. */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await context.params;
    const person = await prisma.user.findUnique({ where: { id }, select });
    if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const canEdit = canManageCompany(await staffAccess(user), person.companyId);
    if (!(await canView(user, id, canEdit))) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ employee: employeeJson(person), canEdit });
}

/**
 * PATCH /api/employees/:id  { companyId?, designation?, dateOfJoining?, employmentStatus?, exitDate? }
 * HR (for their companies) or a Director updates an employment record. Once company, designation and joining
 * date are all filled in, the employee ID is generated. Marking someone as exited also blocks their sign-in.
 */
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await context.params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const [person, access] = await Promise.all([prisma.user.findUnique({ where: { id }, select }), staffAccess(user)]);
    if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!canManageCompany(access, person.companyId)) {
        return NextResponse.json({ error: "You don't manage this person's company." }, { status: 403 });
    }
    const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);
    const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

    // ---- read and check the new values, falling back to what's saved ----
    let companyId = person.companyId;
    if (has('companyId')) {
        companyId = body.companyId ? String(body.companyId) : null;
        if (companyId !== person.companyId) {
            if (!companyId) return bad('Choose the company that employs this person.');
            if (!canManageCompany(access, companyId)) return bad("You can't move people into a company you don't manage.");
            const target = await prisma.company.findUnique({ where: { id: companyId }, select: { isActive: true } });
            if (!target) return bad('That company no longer exists.');
            if (!target.isActive) return bad("That company is inactive, so it can't take on employees.");
        }
    }

    let designation = person.designation;
    if (has('designation')) {
        designation = typeof body.designation === 'string' ? body.designation.trim().replace(/\s+/g, ' ') : '';
        if (designation && (designation.length < 2 || designation.length > 80)) return bad('The designation should be 2 to 80 characters.');
        designation = designation || null;
    }

    let joining = person.dateOfJoining;
    if (has('dateOfJoining')) {
        joining = body.dateOfJoining ? parseDay(body.dateOfJoining) : null;
        if (body.dateOfJoining && !joining) return bad('Enter the joining date as a date.');
        if (joining) {
            const latest = new Date(Date.now() + 90 * 86_400_000);
            if (joining.getUTCFullYear() < 1980 || joining > latest) return bad('The joining date looks wrong. Check the year.');
        }
    }

    let status = person.employmentStatus;
    if (has('employmentStatus')) {
        status = String(body.employmentStatus || '');
        if (!(EMPLOYMENT_STATUSES as readonly string[]).includes(status)) return bad('Unknown employment status.');
    }

    let exitDate = person.exitDate;
    if (has('exitDate')) {
        exitDate = body.exitDate ? parseDay(body.exitDate) : null;
        if (body.exitDate && !exitDate) return bad('Enter the last working day as a date.');
    }
    if (status === 'ACTIVE') exitDate = null;
    if (status === 'EXITED') {
        if (person.id === user.id) return bad("You can't mark yourself as exited.");
        if (!exitDate) return bad('Enter the last working day.');
    }
    if (exitDate && joining && exitDate < joining) return bad("The last working day can't be before the joining date.");

    const wasExited = person.employmentStatus === 'EXITED';
    const companyChanged = companyId !== person.companyId;
    const needsCode = !!(companyId && designation && joining) && (!person.employeeCode || companyChanged);

    // ---- save; the ID is generated in the same transaction so the number and the person go together ----
    const saved = await prisma.$transaction(async tx => {
        const employeeCode = needsCode ? await issueEmployeeCode(tx, companyId!, joining!) : companyChanged ? null : person.employeeCode;
        // a card names the employing company, so moving company cancels it (verification says "no longer employed")
        if (companyChanged) {
            await tx.idCard.updateMany({ where: { userId: id, status: 'ACTIVE' }, data: { status: 'REVOKED', revokedAt: new Date(), revokedReason: 'Moved to another company' } });
        }
        return tx.user.update({
            where: { id },
            data: {
                companyId, designation, dateOfJoining: joining, employmentStatus: status, exitDate, employeeCode,
                // leaving blocks sign-in; coming back (from exited) lifts it again
                ...(status === 'EXITED' ? { isSuspended: true, isOnline: false } : wasExited ? { isSuspended: false } : {}),
            },
            select,
        });
    });

    if (status === 'EXITED' && !wasExited) {
        // same clean-up as suspending someone: end sessions and stop phone and browser notifications.
        // Their tasks, departments and reporting lines are left as they are, so marking them active again undoes this.
        await prisma.$transaction([
            prisma.session.deleteMany({ where: { userId: id } }),
            prisma.pushSubscription.deleteMany({ where: { userId: id } }),
            prisma.fcmToken.deleteMany({ where: { userId: id } }),
        ]).catch(err => console.error('Exit clean-up failed', err));
    }

    return NextResponse.json({
        employee: employeeJson(saved),
        issued: needsCode ? saved.employeeCode : null,
        replaced: needsCode && person.employeeCode ? person.employeeCode : null,
    });
}
