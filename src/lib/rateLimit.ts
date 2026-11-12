// Small in-memory sliding-window limiter. The app runs as one process per environment, so memory is enough
// to stop someone guessing card numbers; it resets on restart, which is acceptable for this purpose.

const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

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
        lastSweep = now;
        for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] > 60 * 60_000) buckets.delete(k);
    }
    return true;
}
