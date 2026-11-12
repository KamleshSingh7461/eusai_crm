import { createHash } from 'crypto';
import prisma from '@/lib/prisma';
import { allow } from '@/lib/rateLimit';

// Public ID card verification. Looks a card up by its QR token or its printed card number, decides what an
// outsider (landlord, bank, security desk) may be told, and logs the check.
//
// Only a VALID card shows who the holder is. Every other answer says why the card isn't valid and how to
// contact the company, without any personal details.

export type VerifyState = 'VALID' | 'EXPIRED' | 'REPLACED' | 'REVOKED' | 'EXITED' | 'NOT_FOUND' | 'LIMITED';

const CARD_NUMBER_RE = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-?[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{20,40}$/;

/** Verification addresses all start with "verify." (checked when a company's address is saved). */
export const isVerifyHost = (host: string) => host.toLowerCase().split(':')[0].startsWith('verify.');

/** "abcd efgh", "ABCD-EFGH" → "ABCD-EFGH"; anything else → null */
export function normalizeCardNumber(raw: string) {
    // card numbers never use 0/O, 1/I/L, so there's nothing ambiguous to map
    const s = raw.toUpperCase().replace(/[\s.]/g, '');
    if (!CARD_NUMBER_RE.test(s)) return null;
    const x = s.replace('-', '');
    return `${x.slice(0, 4)}-${x.slice(4)}`;
}

export interface VerifyRequest {
    token?: string;
    cardNumber?: string;
    host: string;
    ip: string | null;
    userAgent: string | null;
}

export interface VerifyCompany {
    legalName: string; code: string; brandColor: string | null; cin: string | null;
    hrEmail: string | null; hrPhone: string | null; website: string | null; hasLogo: boolean;
}
export interface VerifyResult {
    state: VerifyState;
    method: 'QR' | 'NUMBER';
    checkedAt: string;
    company?: VerifyCompany;
    /** only for VALID */
    holder?: { name: string; employeeCode: string; designation: string; dateOfJoining: string | null; hasPhoto: boolean };
    card?: { cardNumber: string; issuedAt: string; validUntil: string };
    /** for EXPIRED */
    expiredOn?: string;
    /** opaque reference used to load the photo and logo for this result */
    ref?: string;
}

const hashIp = (ip: string | null) =>
    ip ? createHash('sha256').update(`${process.env.NEXTAUTH_SECRET || 'eusai'}:${ip}`).digest('hex').slice(0, 24) : null;

const day = (d: Date) => d.toISOString().slice(0, 10);

/** Today as a calendar date in India, compared with DATE columns stored at UTC midnight. */
function todayIst() {
    const now = new Date(Date.now() + 5.5 * 3600_000);
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

const allowedHere = (host: string, verifyDomain: string | null) => {
    const h = host.toLowerCase().split(':')[0];
    if (!isVerifyHost(h)) return true; // the CRM's own address answers for every company
    if (verifyDomain && h === verifyDomain.toLowerCase()) return true;
    // local development: verify.localhost stands in for every company's address
    return process.env.APP_ENV !== 'production' && process.env.NODE_ENV !== 'production' && h.endsWith('.localhost');
};

type CardForState = { status: string; companyId: string; employeeCode: string; validUntil: Date };
type HolderForState = { companyId: string | null; employeeCode: string | null; employmentStatus: string; exitDate: Date | null };

/** What a card is right now. The order matters: a replaced card says "replaced" even if its holder later left. */
export function cardState(card: CardForState, u: HolderForState): Exclude<VerifyState, 'NOT_FOUND' | 'LIMITED'> {
    const today = todayIst();
    if (card.status === 'REPLACED') return 'REPLACED';
    if (card.status === 'REVOKED') return 'REVOKED';
    const left = u.employmentStatus === 'EXITED' || (!!u.exitDate && u.exitDate < today)
        // moved to another company in the group, or given a new employee ID: this card no longer describes them
        || u.companyId !== card.companyId || u.employeeCode !== card.employeeCode;
    if (left) return 'EXITED';
    if (card.validUntil < today) return 'EXPIRED';
    return 'VALID';
}

/** Photo or logo for a verification result; the photo only while the card is valid. Not rate limited or logged. */
export async function verifyImage(ref: string, kind: 'photo' | 'logo') {
    if (!TOKEN_RE.test(ref)) return null;
    const card = await prisma.idCard.findUnique({
        where: { token: ref },
        include: {
            company: { select: { logoUrl: true } },
            user: { select: { companyId: true, employeeCode: true, employmentStatus: true, exitDate: true, photoUrl: true } },
        },
    });
    if (!card) return null;
    const url = kind === 'logo' ? card.company.logoUrl : cardState(card, card.user) === 'VALID' ? card.user.photoUrl : null;
    const id = url?.startsWith('/api/images/') ? url.slice('/api/images/'.length) : null;
    return id ? prisma.storedImage.findUnique({ where: { id }, select: { data: true, mimeType: true } }) : null;
}

export async function verifyCard(req: VerifyRequest): Promise<VerifyResult> {
    const method: 'QR' | 'NUMBER' = req.token ? 'QR' : 'NUMBER';
    const checkedAt = new Date().toISOString();
    const ipHash = hashIp(req.ip);
    const userAgent = req.userAgent?.slice(0, 200) || null;
    const host = req.host.toLowerCase().split(':')[0].slice(0, 253);

    const log = (result: VerifyState, cardId: string | null) =>
        prisma.verificationLog.create({ data: { cardId, method, result, host, ipHash, userAgent } }).catch(err => console.error('Verification log failed', err));

    // typed-in numbers are the guessable route, so they get a much tighter limit than scanned QR links
    const limited = method === 'NUMBER'
        ? !allow(`num:${ipHash}`, 10, 10 * 60_000)
        : !allow(`qr:${ipHash}`, 60, 60_000);
    if (limited) {
        await log('LIMITED', null);
        return { state: 'LIMITED', method, checkedAt };
    }

    const token = req.token && TOKEN_RE.test(req.token) ? req.token : null;
    const number = req.cardNumber ? normalizeCardNumber(req.cardNumber) : null;
    const card = token || number
        ? await prisma.idCard.findUnique({
            where: token ? { token } : { cardNumber: number! },
            include: {
                company: { select: { legalName: true, code: true, brandColor: true, cin: true, hrEmail: true, hrPhone: true, website: true, logoUrl: true, verifyDomain: true } },
                user: { select: { companyId: true, employeeCode: true, employmentStatus: true, exitDate: true, dateOfJoining: true, photoUrl: true } },
            },
        })
        : null;

    if (!card || !allowedHere(host, card.company.verifyDomain)) {
        await log('NOT_FOUND', null);
        return { state: 'NOT_FOUND', method, checkedAt };
    }

    const c = card.company;
    const company: VerifyCompany = {
        legalName: c.legalName, code: c.code, brandColor: c.brandColor, cin: c.cin,
        hrEmail: c.hrEmail, hrPhone: c.hrPhone, website: c.website, hasLogo: !!c.logoUrl,
    };
    const u = card.user;
    const state = cardState(card, u);

    await log(state, card.id);
    const base: VerifyResult = { state, method, checkedAt, company, ref: card.token };
    if (state === 'EXPIRED') return { ...base, expiredOn: day(card.validUntil) };
    if (state !== 'VALID') return base;
    return {
        ...base,
        holder: {
            name: card.name, employeeCode: card.employeeCode, designation: card.designation,
            dateOfJoining: u.dateOfJoining ? day(u.dateOfJoining) : null, hasPhoto: !!u.photoUrl,
        },
        card: { cardNumber: card.cardNumber, issuedAt: day(card.issuedAt), validUntil: day(card.validUntil) },
    };
}

/** The client's IP as seen through the proxy in front of the app (first hop in X-Forwarded-For). */
export function clientIp(h: Headers) {
    return (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || null;
}
