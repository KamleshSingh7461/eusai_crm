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
    registeredAddress: string | null; verifyDomain: string | null;
}

const brandSelect = {
    legalName: true, code: true, brandColor: true, cin: true, hrEmail: true, hrPhone: true, website: true,
    logoUrl: true, registeredAddress: true, verifyDomain: true,
} as const;
const toBrand = (c: { legalName: string; code: string; brandColor: string | null; cin: string | null; hrEmail: string | null; hrPhone: string | null; website: string | null; logoUrl: string | null; registeredAddress: string | null; verifyDomain: string | null }): VerifyCompany => ({
    legalName: c.legalName, code: c.code, brandColor: c.brandColor, cin: c.cin, hrEmail: c.hrEmail, hrPhone: c.hrPhone,
    website: c.website, hasLogo: !!c.logoUrl, registeredAddress: c.registeredAddress, verifyDomain: c.verifyDomain,
});

const isLocalDev = () => process.env.APP_ENV !== 'production' && process.env.NODE_ENV !== 'production';

/**
 * The company whose verification address this is, so the lookup page and "not found" answers carry its
 * branding. In local development, verify.<code>.localhost (e.g. verify.fgsn.localhost) stands for that company.
 */
export async function companyForHost(host: string): Promise<VerifyCompany | null> {
    const h = host.toLowerCase().split(':')[0];
    if (!isVerifyHost(h)) return null;
    let c = await prisma.company.findUnique({ where: { verifyDomain: h }, select: brandSelect });
    if (!c && isLocalDev()) {
        const m = /^verify\.([a-z0-9]{2,10})\.localhost$/.exec(h);
        if (m) c = await prisma.company.findFirst({ where: { code: m[1].toUpperCase() }, select: brandSelect });
    }
    return c ? toBrand(c) : null;
}

/** A company's logo by its short code: logos are printed on every card, so they're public. */
export async function companyLogo(code: string) {
    if (!/^[A-Z][A-Z0-9]{1,9}$/.test(code)) return null;
    const c = await prisma.company.findUnique({ where: { code }, select: { logoUrl: true } });
    const id = c?.logoUrl?.startsWith('/api/images/') ? c.logoUrl.slice('/api/images/'.length) : null;
    return id ? prisma.storedImage.findUnique({ where: { id }, select: { data: true, mimeType: true } }) : null;
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
    /** short id of this check in the log, shown to the visitor so HR can find it */
    reference?: string;
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
    return isLocalDev() && h.endsWith('.localhost');
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
        prisma.verificationLog.create({ data: { cardId, method, result, host, ipHash, userAgent }, select: { id: true } })
            .then(r => r.id.replace(/-/g, '').slice(0, 8).toUpperCase())
            .catch(err => { console.error('Verification log failed', err); return undefined; });

    // typed-in numbers are the guessable route, so they get a much tighter limit than scanned QR links
    const limited = method === 'NUMBER'
        ? !allow(`num:${ipHash}`, 10, 10 * 60_000)
        : !allow(`qr:${ipHash}`, 60, 60_000);
    if (limited) {
        const reference = await log('LIMITED', null);
        return { state: 'LIMITED', method, checkedAt, reference };
    }

    const token = req.token && TOKEN_RE.test(req.token) ? req.token : null;
    const number = req.cardNumber ? normalizeCardNumber(req.cardNumber) : null;
    const card = token || number
        ? await prisma.idCard.findUnique({
            where: token ? { token } : { cardNumber: number! },
            include: {
                company: { select: brandSelect },
                user: { select: { companyId: true, employeeCode: true, employmentStatus: true, exitDate: true, dateOfJoining: true, photoUrl: true } },
            },
        })
        : null;

    if (!card || !allowedHere(host, card.company.verifyDomain)) {
        const reference = await log('NOT_FOUND', null);
        return { state: 'NOT_FOUND', method, checkedAt, reference };
    }

    const company = toBrand(card.company);
    const u = card.user;
    const state = cardState(card, u);

    const reference = await log(state, card.id);
    const base: VerifyResult = { state, method, checkedAt, company, ref: card.token, reference };
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
