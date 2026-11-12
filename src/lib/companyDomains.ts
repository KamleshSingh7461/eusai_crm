import prisma from '@/lib/prisma';

// Email domains allowed to sign in come from the active companies. Kept apart from companies.ts so the
// auth setup can import it without a circular import.

// sign-in domains before companies lived in the database; used only if the company table can't be read
const LEGACY_DOMAINS = ['eusaiteam.com', 'alumniindia.com', 'fgsnlive.com', 'teamfibreinc.com'];

export const normalizeDomain = (d: string) => d.trim().toLowerCase().replace(/^@/, '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');

let domainCache: { at: number; domains: string[] } | null = null;

/** Email domains allowed to sign in: every active company's domains. Cached for a minute. */
export async function allowedSignInDomains(): Promise<string[]> {
    if (domainCache && Date.now() - domainCache.at < 60_000) return domainCache.domains;
    try {
        const companies = await prisma.company.findMany({ where: { isActive: true }, select: { emailDomains: true } });
        const domains = Array.from(new Set(companies.flatMap(c => c.emailDomains.map(normalizeDomain)).filter(Boolean)));
        if (domains.length === 0) return LEGACY_DOMAINS;
        domainCache = { at: Date.now(), domains };
        return domains;
    } catch (err) {
        console.error('Could not read company domains, using the built-in list', err);
        return LEGACY_DOMAINS;
    }
}

export const clearDomainCache = () => { domainCache = null; };
