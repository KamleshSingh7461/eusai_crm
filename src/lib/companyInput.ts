import prisma from '@/lib/prisma';
import { CODE_RE, isValidDomain, normalizeDomain } from '@/lib/companies';

export const companySelect = {
    id: true, code: true, legalName: true, cin: true, gstin: true, registeredAddress: true, officeAddress: true,
    website: true, hrEmail: true, hrPhone: true, logoUrl: true, brandColor: true, signatoryName: true,
    signatoryTitle: true, signatureUrl: true, emailDomains: true, verifyDomain: true, nextEmployeeNumber: true, cardValidityMonths: true,
    isActive: true, createdAt: true,
    hrUsers: { select: { id: true, name: true, email: true } },
} as const;

// Validates the Company form. Returns the fields to save, or the first problem in plain words.

const CIN_RE = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9 ()-]{6,19}$/;
const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

type Result = { data: Record<string, any>; hrUserIds?: string[]; error?: undefined } | { error: string; data?: undefined; hrUserIds?: undefined };

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const optional = (v: string) => (v === '' ? null : v);

export async function readCompanyInput(body: any, existingId?: string): Promise<Result> {
    const data: Record<string, any> = {};
    const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);
    const creating = !existingId;

    if (creating || has('code')) {
        const code = text(body.code, 10).toUpperCase();
        if (!CODE_RE.test(code)) return { error: 'The short code must be 2 to 10 capital letters or digits, starting with a letter (for example FGSN).' };
        const clash = await prisma.company.findUnique({ where: { code } });
        if (clash && clash.id !== existingId) return { error: `The short code ${code} is already used by ${clash.legalName}.` };
        data.code = code;
    }
    if (creating || has('legalName')) {
        const legalName = text(body.legalName, 200);
        if (legalName.length < 3) return { error: 'Enter the full legal name as registered.' };
        data.legalName = legalName;
    }
    if (has('cin')) {
        const cin = text(body.cin, 21).toUpperCase();
        if (cin && !CIN_RE.test(cin)) return { error: 'The CIN should be 21 characters, like U74999DL2020PTC123456.' };
        data.cin = optional(cin);
    }
    if (has('gstin')) {
        const gstin = text(body.gstin, 15).toUpperCase();
        if (gstin && !GSTIN_RE.test(gstin)) return { error: 'The GSTIN should be 15 characters, like 07AABCU9603R1ZM.' };
        data.gstin = optional(gstin);
    }
    for (const k of ['registeredAddress', 'officeAddress']) if (has(k)) data[k] = optional(text(body[k], 500));
    for (const k of ['signatoryName', 'signatoryTitle']) if (has(k)) data[k] = optional(text(body[k], 120));
    if (has('website')) {
        const w = text(body.website, 200);
        if (w && !isValidDomain(normalizeDomain(w))) return { error: 'Enter the website like www.company.com.' };
        data.website = optional(w);
    }
    if (has('hrEmail')) {
        const e = text(body.hrEmail, 200).toLowerCase();
        if (e && !EMAIL_RE.test(e)) return { error: 'Enter a valid HR email address.' };
        data.hrEmail = optional(e);
    }
    if (has('hrPhone')) {
        const p = text(body.hrPhone, 20);
        if (p && !PHONE_RE.test(p)) return { error: 'Enter a valid HR phone number, like +91 98765 43210.' };
        data.hrPhone = optional(p);
    }
    if (has('brandColor')) {
        const c = text(body.brandColor, 7);
        if (c && !COLOR_RE.test(c)) return { error: 'The brand colour should look like #1D4ED8.' };
        data.brandColor = optional(c);
    }
    if (has('isActive')) data.isActive = !!body.isActive;
    if (has('cardValidityMonths')) {
        const m = Number(body.cardValidityMonths);
        if (![12, 24, 36, 60].includes(m)) return { error: 'Card validity must be 1, 2, 3 or 5 years.' };
        data.cardValidityMonths = m;
    }

    if (creating || has('emailDomains')) {
        const raw: string[] = Array.isArray(body.emailDomains) ? body.emailDomains : String(body.emailDomains || '').split(/[\s,]+/);
        const domains = Array.from(new Set(raw.map(d => normalizeDomain(String(d))).filter(Boolean)));
        const bad = domains.find(d => !isValidDomain(d));
        if (bad) return { error: `${bad} isn't a valid email domain.` };
        if (domains.length) {
            const others = await prisma.company.findMany({
                where: { emailDomains: { hasSome: domains }, ...(existingId ? { NOT: { id: existingId } } : {}) },
                select: { legalName: true, emailDomains: true },
            });
            if (others.length) {
                const d = domains.find(x => others[0].emailDomains.includes(x));
                return { error: `${d} already belongs to ${others[0].legalName}.` };
            }
        }
        data.emailDomains = domains;
    }
    if (has('verifyDomain')) {
        const v = normalizeDomain(text(body.verifyDomain, 253));
        if (v && !isValidDomain(v)) return { error: 'Enter the verification address like verify.company.com.' };
        // the server recognises verification addresses by this prefix and serves nothing else on them
        if (v && !v.startsWith('verify.')) return { error: 'The verification address must start with "verify.", like verify.company.com.' };
        if (v) {
            const clash = await prisma.company.findUnique({ where: { verifyDomain: v } });
            if (clash && clash.id !== existingId) return { error: `${v} is already used by ${clash.legalName}.` };
        }
        data.verifyDomain = optional(v);
    }

    let hrUserIds: string[] | undefined;
    if (has('hrUserIds')) {
        hrUserIds = Array.isArray(body.hrUserIds) ? Array.from(new Set(body.hrUserIds.map(String))) : [];
        if (hrUserIds.length) {
            const found = await prisma.user.count({ where: { id: { in: hrUserIds } } });
            if (found !== hrUserIds.length) return { error: 'One of the HR people no longer exists. Refresh and try again.' };
        }
    }
    return { data, hrUserIds };
}
