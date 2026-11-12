import { randomBytes, randomInt } from 'crypto';
import { dayString } from '@/lib/companies';

// ID card numbers, QR tokens, print readiness and what the card printer needs.

// no 0/O, 1/I/L: easy to read aloud and type from a card
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const newCardNumber = () => {
    const pick = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
    return `${pick()}-${pick()}`;
};
/** 144 random bits, URL-safe; this is what the QR code carries */
export const newCardToken = () => randomBytes(18).toString('base64url');

export const cardCompanySelect = {
    id: true, code: true, legalName: true, isActive: true, brandColor: true, logoUrl: true, signatureUrl: true,
    signatoryName: true, signatoryTitle: true, registeredAddress: true, cin: true, gstin: true,
    hrEmail: true, hrPhone: true, website: true, verifyDomain: true, cardValidityMonths: true,
} as const;

/** What's missing on the company side before its cards can be printed (shown to HR in plain words). */
export function companyCardGaps(c: { isActive: boolean; cin: string | null; registeredAddress: string | null; hrEmail: string | null; hrPhone: string | null; signatoryName: string | null; verifyDomain: string | null }) {
    const gaps: string[] = [];
    if (!c.isActive) gaps.push('company is inactive');
    if (!c.cin) gaps.push('company CIN');
    if (!c.registeredAddress) gaps.push('registered address');
    if (!c.hrEmail && !c.hrPhone) gaps.push('HR email or phone');
    if (!c.signatoryName) gaps.push('signatory');
    if (!c.verifyDomain) gaps.push('verification address');
    return gaps;
}

/** Everything stopping this person's card from being printed; empty means ready. */
export function cardBlockers(p: { employeeCode: string | null; designation: string | null; photoUrl: string | null; employmentStatus: string; company: Parameters<typeof companyCardGaps>[0] | null }) {
    const b: string[] = [];
    if (p.employmentStatus === 'EXITED') b.push('has exited');
    if (!p.employeeCode) b.push('employee ID');
    if (!p.photoUrl) b.push('photo');
    if (!p.company) b.push('company');
    else b.push(...companyCardGaps(p.company));
    return b;
}

export function addMonths(d: Date, months: number) {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    x.setUTCMonth(x.getUTCMonth() + months);
    x.setUTCDate(x.getUTCDate() - 1); // valid up to the day before the anniversary
    return x;
}

/** The data the card PDF is drawn from. */
export function cardPayload(card: any, person: { photoUrl: string | null; dateOfJoining: Date | null }, company: any) {
    return {
        id: card.id,
        cardNumber: card.cardNumber,
        verifyHost: company.verifyDomain,
        verifyUrl: `https://${company.verifyDomain}/v/${card.token}`,
        employeeCode: card.employeeCode,
        name: card.name,
        designation: card.designation,
        dateOfJoining: dayString(person.dateOfJoining),
        issuedAt: card.issuedAt.toISOString().slice(0, 10),
        validUntil: dayString(card.validUntil),
        photoUrl: person.photoUrl,
        company: {
            code: company.code, legalName: company.legalName, brandColor: company.brandColor, logoUrl: company.logoUrl,
            signatureUrl: company.signatureUrl, signatoryName: company.signatoryName, signatoryTitle: company.signatoryTitle,
            registeredAddress: company.registeredAddress, cin: company.cin, gstin: company.gstin,
            hrEmail: company.hrEmail, hrPhone: company.hrPhone, website: company.website,
        },
    };
}
export type CardPayload = ReturnType<typeof cardPayload>;
