// Marks local/staging so nobody mistakes them for production. Renders nothing in production.
const STYLES: Record<string, { label: string; color: string }> = {
    local: { label: 'LOCAL', color: '#34D399' },
    staging: { label: 'STAGING', color: '#FBBF24' },
};

export default function EnvBadge() {
    const env = STYLES[process.env.NEXT_PUBLIC_APP_ENV ?? ''];
    if (!env) return null;

    return (
        <>
            {/* a thin strip on every screen; the label only on wide screens, where the header has room */}
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px]" style={{ backgroundColor: env.color }} />
            <div
                className="pointer-events-none fixed left-1/2 top-2 z-[100] hidden -translate-x-1/2 select-none rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-black shadow-lg xl:block"
                style={{ backgroundColor: env.color }}
            >
                {env.label}
            </div>
        </>
    );
}
