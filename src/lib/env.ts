import { z } from 'zod';

export type AppEnv = 'local' | 'staging' | 'production';

/**
 * Current deployment environment. Set by scripts/env.mjs; a plain `next start`
 * without it is treated as production so nothing debug-only leaks there.
 */
export const APP_ENV: AppEnv = (() => {
    const value = process.env.APP_ENV;
    if (value === 'local' || value === 'staging' || value === 'production') return value;
    return process.env.NODE_ENV === 'production' ? 'production' : 'local';
})();

export const isLocal = APP_ENV === 'local';
export const isStaging = APP_ENV === 'staging';
export const isProduction = APP_ENV === 'production';

/**
 * Passwordless "sign in as any user" for local testing. Needs BOTH APP_ENV=local
 * and a database on this machine, so a misconfigured server can never expose it.
 */
export const isDevLoginEnabled = (() => {
    if (!isLocal) return false;
    try {
        return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(new URL(process.env.DATABASE_URL ?? '').hostname);
    } catch {
        return false;
    }
})();

// Blank values (scripts/env.mjs blanks unset keys) count as "not set".
const optional = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional());
const required = z.string().min(1, 'is required');

const schema = z.object({
    DATABASE_URL: required.url('must be a postgresql:// URL'),
    NEXTAUTH_URL: required.url('must be a full URL, e.g. https://crm.example.com'),
    NEXTAUTH_SECRET: required,
    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,
    SMTP_HOST: optional,
    SMTP_PORT: optional,
    SMTP_USER: optional,
    SMTP_PASS: optional,
    CRON_SECRET: optional,
    GEMINI_API_KEY: optional,
    GOOGLE_API_KEY: optional,
    MONGODB_URI: optional,
});

// Settings that are optional locally but must be real on deployed environments.
const deployedRules: [boolean, string][] = [
    [!!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET, 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are required (login is Google-only)'],
    [(process.env.NEXTAUTH_SECRET ?? '').length >= 32, 'NEXTAUTH_SECRET must be at least 32 characters (openssl rand -base64 32)'],
    [!!process.env.CRON_SECRET, 'CRON_SECRET is required'],
    [!/localhost|127\.0\.0\.1/.test(process.env.NEXTAUTH_URL ?? ''), 'NEXTAUTH_URL must be the public URL, not localhost'],
];

/** Validates server env vars at boot; throws with every problem listed when APP_ENV is set. */
export function validateEnv() {
    const problems: string[] = [];

    const result = schema.safeParse(process.env);
    if (!result.success) {
        for (const issue of result.error.issues) problems.push(`${issue.path.join('.')} ${issue.message}`);
    }
    if (!isLocal) {
        for (const [ok, message] of deployedRules) if (!ok) problems.push(message);
    }

    // Only enforced when started through scripts/env.mjs. A legacy `npm start`
    // without APP_ENV must keep booting exactly as before, so it only gets warnings.
    if (problems.length && process.env.APP_ENV) {
        throw new Error(`Invalid environment for APP_ENV=${APP_ENV}:\n  - ${problems.join('\n  - ')}`);
    }
    for (const message of problems) console.warn(`[env] WARNING: ${message}`);

    let dbHost = 'unknown';
    try {
        dbHost = new URL(process.env.DATABASE_URL ?? '').hostname;
    } catch { }
    console.log(`[env] APP_ENV=${APP_ENV} url=${process.env.NEXTAUTH_URL} db=${dbHost}`);
}
