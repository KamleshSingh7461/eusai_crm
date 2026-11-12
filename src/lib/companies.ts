import type { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMobileSession } from '@/lib/auth-mobile';
import prisma from '@/lib/prisma';

export { normalizeDomain, allowedSignInDomains, clearDomainCache } from '@/lib/companyDomains';

// Group companies, employee IDs and who may manage them.
// Directors manage every company; HR people manage only the companies they are assigned to.

export const ALL_COMPANY_ROLES = ['DIRECTOR', 'ADMIN'];
export const EMPLOYMENT_STATUSES = ['ACTIVE', 'ON_NOTICE', 'EXITED'] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const CODE_RE = /^[A-Z][A-Z0-9]{1,9}$/;
const DOMAIN_RE = /^(?=.{3,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isValidDomain = (d: string) => DOMAIN_RE.test(d);

/** yyyy-MM-dd → Date at UTC midnight (stored in a DATE column), or null when invalid. */
export function parseDay(s: unknown): Date | null {
    if (typeof s !== 'string' || !DAY_RE.test(s)) return null;
    const d = new Date(`${s}T00:00:00.000Z`);
    return isNaN(d.getTime()) ? null : d;
}
export const dayString = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

export async function currentUser(): Promise<{ id: string; role: string; email?: string } | null> {
    const session = (await getServerSession(authOptions)) || (await getMobileSession());
    const u = session?.user as any;
    return u?.id ? { id: u.id, role: String(u.role || 'EMPLOYEE').toUpperCase(), email: u.email } : null;
}

export interface StaffAccess {
    userId: string;
    allCompanies: boolean;
    hrCompanyIds: string[];
    canManageAny: boolean;
}

export async function staffAccess(user: { id: string; role: string }): Promise<StaffAccess> {
    const allCompanies = ALL_COMPANY_ROLES.includes(user.role);
    const hr = allCompanies ? [] : await prisma.company.findMany({
        where: { hrUsers: { some: { id: user.id } } },
        select: { id: true },
    });
    const hrCompanyIds = hr.map(c => c.id);
    return { userId: user.id, allCompanies, hrCompanyIds, canManageAny: allCompanies || hrCompanyIds.length > 0 };
}

/** Whether this person may edit the employment record of someone in `companyId` (null = not yet assigned). */
export function canManageCompany(access: StaffAccess, companyId: string | null | undefined) {
    if (access.allCompanies) return true;
    if (!companyId) return access.hrCompanyIds.length > 0;
    return access.hrCompanyIds.includes(companyId);
}

export const formatEmployeeCode = (prefix: string, year: number, n: number) => `${prefix}-${year}-${String(n).padStart(4, '0')}`;

/**
 * Takes the company's next number and returns the new employee ID. Call it inside the transaction that saves
 * the ID: the increment locks the company row until that transaction ends, so two people can never get the
 * same number, and if the save fails the number goes back unused.
 */
export async function issueEmployeeCode(tx: Prisma.TransactionClient, companyId: string, joining: Date) {
    const company = await tx.company.update({
        where: { id: companyId },
        data: { nextEmployeeNumber: { increment: 1 } },
        select: { code: true, nextEmployeeNumber: true },
    });
    return formatEmployeeCode(company.code, joining.getUTCFullYear(), company.nextEmployeeNumber - 1);
}



export const emailDomain = (email: string) => email.trim().toLowerCase().split('@')[1] || '';
