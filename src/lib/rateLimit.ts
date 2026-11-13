// Small in-memory sliding-window limiter. The app runs as one process per environment, so memory is enough
// to stop someone guessing codes, passwords or card numbers; it resets on restart, which is acceptable.
// The state lives on globalThis (like the Prisma client) so reloading a module doesn't wipe the counts.

const store = globalThis as unknown as { __rateBuckets?: Map<string, number[]>; __rateLastSweep?: number };
const buckets = (store.__rateBuckets ??= new Map<string, number[]>());
let lastSweep = (store.__rateLastSweep ??= Date.now());

/** The caller's IP behind the proxy (first hop of X-Forwarded-For), or "unknown". */
export function ipOf(headers: Headers | Record<string, any> | undefined | null) {
    const get = (k: string) => (headers && typeof (headers as Headers).get === 'function' ? (headers as Headers).get(k) : (headers as any)?.[k]) as string | null | undefined;
    return (get('x-forwarded-for') || '').split(',')[0].trim() || get('x-real-ip') || 'unknown';
}

/**
 * Limits for sign-in style endpoints, by email and by IP together, so neither one address nor one
 * connection can be used to guess codes or passwords. Returns true when the attempt may go ahead.
 */
export function allowAuthAttempt(kind: string, email: string, ip: string, perEmail: number, perIp: number, windowMs = 15 * 60_000) {
    const e = allow(`${kind}:email:${email.toLowerCase()}`, perEmail, windowMs);
    // without a real client IP (no proxy header), every visitor would share one counter and a few bad
    // attempts could lock everyone out, so only the per-address limit applies then
    const i = ip === 'unknown' ? true : allow(`${kind}:ip:${ip}`, perIp, windowMs);
    return e && i;
}

/** Records one hit for `key` and says whether it is still within `limit` hits per `windowMs`. */
export function allow(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const recent = (buckets.get(key) || []).filter(t => now - t < windowMs);
    if (recent.length >= limit) {
        buckets.set(key, recent);
        return false;
    }
    recent.push(now);
    buckets.set(key, recent);

    // drop idle keys now and then so the map can't grow forever
    if (now - lastSweep > 10 * 60_000) {
        lastSweep = store.__rateLastSweep = now;
        for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] > 60 * 60_000) buckets.delete(k);
    }
    return true;
}
