import { dayString } from '@/lib/companies';
import { cardBlockers, cardCompanySelect } from '@/lib/idCards';

// The employment fields every Employee IDs screen reads, and how they go out as JSON.

export const employeeSelect = {
    id: true, name: true, email: true, role: true, department: true, image: true, isSuspended: true, photoUrl: true,
    companyId: true, employeeCode: true, designation: true, dateOfJoining: true, employmentStatus: true, exitDate: true,
    company: { select: cardCompanySelect },
    idCards: { where: { status: 'ACTIVE' }, orderBy: { issuedAt: 'desc' }, take: 1, select: { cardNumber: true, issuedAt: true, validUntil: true } },
} as const;

export function employeeJson(u: any) {
    const missing: string[] = [];
    if (!u.companyId) missing.push('company');
    if (!u.designation) missing.push('designation');
    if (!u.dateOfJoining) missing.push('joining date');
    const card = u.idCards?.[0];
    return {
        id: u.id, name: u.name, email: u.email, role: u.role, department: u.department, image: u.image, photoUrl: u.photoUrl,
        company: u.company ? { id: u.company.id, code: u.company.code, legalName: u.company.legalName, brandColor: u.company.brandColor, isActive: u.company.isActive } : null,
        employeeCode: u.employeeCode, designation: u.designation,
        dateOfJoining: dayString(u.dateOfJoining), employmentStatus: u.employmentStatus, exitDate: dayString(u.exitDate),
        loginBlocked: !!u.isSuspended,
        // what HR still has to fill in before an ID can be generated
        missing: u.employeeCode ? [] : missing,
        card: card ? { cardNumber: card.cardNumber, issuedAt: card.issuedAt.toISOString().slice(0, 10), validUntil: dayString(card.validUntil) } : null,
        // what stops a card being printed right now; empty means ready
        cardBlockers: cardBlockers(u),
    };
}
