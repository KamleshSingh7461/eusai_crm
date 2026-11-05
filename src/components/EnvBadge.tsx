// Small corner label so nobody mistakes local/staging for production. Renders nothing in production.
const STYLES: Record<string, { label: string; color: string }> = {
    local: { label: 'LOCAL', color: '#34D399' },
    staging: { label: 'STAGING', color: '#FBBF24' },
};

export default function EnvBadge() {
    const env = STYLES[process.env.NEXT_PUBLIC_APP_ENV ?? ''];
    if (!env) return null;

    return (
        <div
            className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] pointer-events-none select-none px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider text-black shadow-lg"
            style={{ backgroundColor: env.color }}
        >
            {env.label}
        </div>
    );
}
