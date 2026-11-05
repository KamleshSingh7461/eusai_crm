// One place for semantic colors. Every badge, icon tile, chart and progress bar picks from here.
export type Tone = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'slate';

export const TONES: Record<Tone, { text: string; tile: string; chip: string; stroke: string; dot: string; ring: string }> = {
    blue: { text: 'text-blue-300', tile: 'from-blue-500/25 to-blue-500/5 ring-blue-400/25 text-blue-300', chip: 'bg-blue-500/12 text-blue-300 ring-blue-400/20', stroke: '#60A5FA', dot: 'bg-blue-400', ring: 'ring-blue-400/30' },
    violet: { text: 'text-violet-300', tile: 'from-violet-500/25 to-violet-500/5 ring-violet-400/25 text-violet-300', chip: 'bg-violet-500/12 text-violet-300 ring-violet-400/20', stroke: '#A78BFA', dot: 'bg-violet-400', ring: 'ring-violet-400/30' },
    emerald: { text: 'text-emerald-300', tile: 'from-emerald-500/25 to-emerald-500/5 ring-emerald-400/25 text-emerald-300', chip: 'bg-emerald-500/12 text-emerald-300 ring-emerald-400/20', stroke: '#34D399', dot: 'bg-emerald-400', ring: 'ring-emerald-400/30' },
    amber: { text: 'text-amber-300', tile: 'from-amber-500/25 to-amber-500/5 ring-amber-400/25 text-amber-300', chip: 'bg-amber-500/12 text-amber-300 ring-amber-400/20', stroke: '#FBBF24', dot: 'bg-amber-400', ring: 'ring-amber-400/30' },
    rose: { text: 'text-rose-300', tile: 'from-rose-500/25 to-rose-500/5 ring-rose-400/25 text-rose-300', chip: 'bg-rose-500/12 text-rose-300 ring-rose-400/20', stroke: '#FB7185', dot: 'bg-rose-400', ring: 'ring-rose-400/30' },
    cyan: { text: 'text-cyan-300', tile: 'from-cyan-500/25 to-cyan-500/5 ring-cyan-400/25 text-cyan-300', chip: 'bg-cyan-500/12 text-cyan-300 ring-cyan-400/20', stroke: '#22D3EE', dot: 'bg-cyan-400', ring: 'ring-cyan-400/30' },
    slate: { text: 'text-slate-300', tile: 'from-slate-400/20 to-slate-400/5 ring-white/10 text-slate-300', chip: 'bg-white/[0.06] text-slate-300 ring-white/10', stroke: '#94A3B8', dot: 'bg-slate-400', ring: 'ring-white/15' },
};

// Domain values -> tone, so the same status looks the same on every page.
const STATUS_TONES: Record<string, Tone> = {
    DONE: 'emerald', COMPLETED: 'emerald', RESOLVED: 'emerald', CLOSED: 'slate', APPROVED: 'emerald', PAID: 'emerald', PARTNER: 'emerald', ACTIVE: 'emerald', AVAILABLE: 'emerald',
    IN_PROGRESS: 'blue', EXECUTION: 'blue', RESOLVING: 'blue', ALLOCATED: 'blue', MONITORING: 'cyan',
    REVIEW: 'amber', PENDING: 'amber', PLANNING: 'violet', INITIATION: 'slate', PROSPECT: 'violet',
    TODO: 'slate', OPEN: 'rose', DELAYED: 'rose', REJECTED: 'rose', CANCELLED: 'rose', OFFLINE: 'slate', INACTIVE: 'slate',
    CRITICAL: 'rose', HIGH: 'amber', MEDIUM: 'blue', LOW: 'slate',
};

const ROLE_TONES: Record<string, Tone> = {
    DIRECTOR: 'violet', MANAGEMENT: 'cyan', MANAGER: 'blue', TEAM_LEADER: 'emerald', EMPLOYEE: 'slate', INTERN: 'amber',
};

export const statusTone = (status?: string | null): Tone => STATUS_TONES[(status || '').toUpperCase()] ?? 'slate';
export const roleTone = (role?: string | null): Tone => ROLE_TONES[(role || '').toUpperCase()] ?? 'slate';

/** IN_PROGRESS -> "In progress", TEAM_LEADER -> "Team leader" */
export const humanize = (value?: string | null) => {
    if (!value) return '';
    const text = value.replace(/_/g, ' ').toLowerCase();
    return text.charAt(0).toUpperCase() + text.slice(1);
};
