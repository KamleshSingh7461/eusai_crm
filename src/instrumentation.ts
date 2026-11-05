// Runs once when the Next.js server boots: fail fast on a misconfigured environment.
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { validateEnv } = await import('@/lib/env');
        validateEnv();
    }
}
