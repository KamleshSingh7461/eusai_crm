import prisma from '@/lib/prisma';

// Who may change a milestone, task or issue. One place, so every route that updates them applies the
// same rules as the detail screens. Management is read-only everywhere.

export const LEADER_ROLES = ['DIRECTOR', 'ADMIN', 'MANAGER', 'TEAM_LEADER'];

async function managesPerson(viewerId: string, personId: string | null | undefined) {
    if (!personId) return false;
    return (await prisma.user.count({ where: { id: personId, reportingManagers: { some: { id: viewerId } } } })) > 0;
}

/**
 * Milestones: the owner, Directors, the project's managers, the department's manager and the owner's own
 * team leader or manager may update status and progress; only the leaders may add remarks or flag it.
 */
export async function milestoneAccess(user: { id: string; role: string }, milestoneId: string) {
    const m = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        select: { owner: true, project: { select: { managers: { select: { id: true } } } }, space: { select: { managerId: true } } },
    });
    if (!m) return null;
    if (user.role === 'MANAGEMENT') return { canUpdateStatus: false, canUpdateGovernance: false };
    const isDirector = user.role === 'DIRECTOR' || user.role === 'ADMIN';
    const isProjectManager = !!m.project?.managers.some(x => x.id === user.id);
    const isSpaceManager = m.space?.managerId === user.id;
    const isDirectManager = ['MANAGER', 'TEAM_LEADER'].includes(user.role) && (await managesPerson(user.id, m.owner));
    const leader = isDirector || isProjectManager || isSpaceManager || isDirectManager;
    return { canUpdateStatus: leader || m.owner === user.id, canUpdateGovernance: leader };
}

/** Issues: the reporter and the assignee may update their issue; Directors, Managers and Team leaders any. */
export async function issueAccess(user: { id: string; role: string }, issueId: string) {
    const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { reporterId: true, assignedToId: true } });
    if (!issue) return null;
    if (user.role === 'MANAGEMENT') return { canEdit: false, canReassign: false };
    const leader = LEADER_ROLES.includes(user.role);
    return {
        canEdit: leader || issue.reporterId === user.id || issue.assignedToId === user.id,
        // choosing who works on it is a leadership call
        canReassign: leader,
    };
}
