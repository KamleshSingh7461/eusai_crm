// One place for semantic colors. Every badge, icon tile, chart and progress bar picks from here.
export type Tone = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'slate';

export const TONES: Record<Tone, { text: string; tile: string; chip: string; stroke: string; dot: string; ring: string }> = {
    blue: { text: 'text-blue-400', tile: 'bg-blue-500/10 ring-blue-500/20 text-blue-400', chip: 'bg-blue-500/10 text-blue-400 ring-blue-500/20', stroke: '#3B82F6', dot: 'bg-blue-500', ring: 'ring-blue-500/30' },
    violet: { text: 'text-violet-400', tile: 'bg-violet-500/10 ring-violet-500/20 text-violet-400', chip: 'bg-violet-500/10 text-violet-400 ring-violet-500/20', stroke: '#8B5CF6', dot: 'bg-violet-500', ring: 'ring-violet-500/30' },
    emerald: { text: 'text-emerald-400', tile: 'bg-emerald-500/10 ring-emerald-500/20 text-emerald-400', chip: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20', stroke: '#10B981', dot: 'bg-emerald-500', ring: 'ring-emerald-500/30' },
    amber: { text: 'text-amber-400', tile: 'bg-amber-500/10 ring-amber-500/20 text-amber-400', chip: 'bg-amber-500/10 text-amber-400 ring-amber-500/20', stroke: '#F59E0B', dot: 'bg-amber-500', ring: 'ring-amber-500/30' },
    rose: { text: 'text-rose-400', tile: 'bg-rose-500/10 ring-rose-500/20 text-rose-400', chip: 'bg-rose-500/10 text-rose-400 ring-rose-500/20', stroke: '#F43F5E', dot: 'bg-rose-500', ring: 'ring-rose-500/30' },
    cyan: { text: 'text-cyan-400', tile: 'bg-cyan-500/10 ring-cyan-500/20 text-cyan-400', chip: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20', stroke: '#06B6D4', dot: 'bg-cyan-500', ring: 'ring-cyan-500/30' },
    slate: { text: 'text-zinc-300', tile: 'bg-zinc-800 ring-zinc-700/70 text-zinc-300', chip: 'bg-zinc-800 text-zinc-300 ring-zinc-700/70', stroke: '#71717A', dot: 'bg-zinc-400', ring: 'ring-zinc-600' },
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
