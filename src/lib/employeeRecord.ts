import { dayString } from '@/lib/companies';

// The employment fields every Employee IDs screen reads, and how they go out as JSON.

export const employeeSelect = {
    id: true, name: true, email: true, role: true, department: true, image: true, isSuspended: true,
    companyId: true, employeeCode: true, designation: true, dateOfJoining: true, employmentStatus: true, exitDate: true,
    company: { select: { id: true, code: true, legalName: true, brandColor: true, isActive: true } },
} as const;

export function employeeJson(u: any) {
    const missing: string[] = [];
    if (!u.companyId) missing.push('company');
    if (!u.designation) missing.push('designation');
    if (!u.dateOfJoining) missing.push('joining date');
    return {
        id: u.id, name: u.name, email: u.email, role: u.role, department: u.department, image: u.image,
        company: u.company, employeeCode: u.employeeCode, designation: u.designation,
        dateOfJoining: dayString(u.dateOfJoining), employmentStatus: u.employmentStatus, exitDate: dayString(u.exitDate),
        loginBlocked: !!u.isSuspended,
        // what HR still has to fill in before an ID can be generated
        missing: u.employeeCode ? [] : missing,
    };
}
