import { addDays, endOfWeek, startOfWeek, subDays } from 'date-fns';
import prisma from '@/lib/prisma';

// Roles that submit a daily report
const REPORTING_ROLES = ['EMPLOYEE', 'INTERN', 'TEAM_LEADER', 'MANAGER'];
const OPEN_ISSUE = ['OPEN', 'RESOLVING'];

interface Scope {
    /** the signed-in leader */
    userId: string;
    /** people they lead (excluding themselves) */
    teamIds: string[];
    /** projects shown in the project table */
    projectIds: string[];
    /** projects whose milestones, issues and revenue count as theirs (defaults to projectIds) */
    ownedProjectIds?: string[];
    /** departments they manage */
    spaceIds: string[];
}

/**
 * "What needs me today" for a team leader or manager: report compliance, overdue work,
 * milestones at risk, project health, business numbers and expense approvals, all scoped to one team.
 */
export async function buildTeamFocus({ userId, teamIds, projectIds, ownedProjectIds = projectIds, spaceIds }: Scope) {
    const now = new Date();
    // daily reports are stored against local midnight (see /api/reports/daily)
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const in14Days = addDays(now, 14);

    const people = [userId, ...teamIds];
    const milestoneScope = { OR: [{ owner: { in: people } }, { projectId: { in: ownedProjectIds } }, { spaceId: { in: spaceIds } }] };

    const [team, reportsToday, teamTasks, milestones, issues, projects, paidOrders, pendingExpenses] = await Promise.all([
        prisma.user.findMany({ where: { id: { in: teamIds }, isSuspended: false }, select: { id: true, name: true, role: true, image: true } }),
        prisma.dailyReport.findMany({ where: { userId: { in: teamIds }, date: today }, select: { userId: true } }),
        prisma.task.findMany({
            where: { userId: { in: teamIds } },
            select: { id: true, title: true, status: true, priority: true, deadline: true, updatedAt: true, userId: true, project: { select: { name: true } } },
        }),
        prisma.milestone.findMany({
            where: milestoneScope,
            select: {
                id: true, title: true, category: true, status: true, progress: true, targetDate: true, isFlagged: true, updatedAt: true, completedDate: true,
                ownerUser: { select: { name: true, image: true } }, university: { select: { name: true } },
            },
        }),
        prisma.issue.findMany({
            where: { status: { in: OPEN_ISSUE }, OR: [{ projectId: { in: ownedProjectIds } }, { spaceId: { in: spaceIds } }, { assignedToId: { in: people } }, { reporterId: { in: teamIds } }] },
            select: { id: true, severity: true },
        }),
        prisma.project.findMany({
            where: { id: { in: projectIds }, status: { not: 'CLOSED' } },
            select: { id: true, name: true, status: true, endDate: true, tasks: { select: { status: true, deadline: true } } },
        }),
        prisma.businessOrder.findMany({ where: { status: 'PAID', milestone: milestoneScope }, select: { amount: true } }),
        prisma.expense.findMany({
            where: { userId: { in: teamIds }, status: 'PENDING' },
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 6,
        }),
    ]);

    const activeTeamIds = new Set(team.map(m => m.id));
    const byId = new Map(team.map(m => [m.id, m]));
    const reporters = team.filter(m => REPORTING_ROLES.includes((m.role || '').toUpperCase()));
    const submitted = new Set(reportsToday.map(r => r.userId).filter(id => activeTeamIds.has(id)));
    const missingReports = reporters.filter(m => !submitted.has(m.id));

    const tasks = teamTasks.filter(t => t.userId && activeTeamIds.has(t.userId));
    const open = tasks.filter(t => t.status !== 'DONE');
    const overdue = open.filter(t => t.deadline < now).sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
    const dueThisWeek = open.filter(t => t.deadline >= now && t.deadline <= weekEnd);
    const doneThisWeek = tasks.filter(t => t.status === 'DONE' && t.updatedAt >= weekStart);

    const openMilestones = milestones.filter(m => m.status !== 'COMPLETED');
    const isAtRisk = (m: typeof milestones[number]) => m.status === 'DELAYED' || m.isFlagged || m.targetDate < now;
    const atRisk = openMilestones.filter(isAtRisk);
    const upcoming = openMilestones
        .filter(m => m.targetDate <= in14Days)
        .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime())
        .slice(0, 6);
    const recentlyCompleted = milestones
        .filter(m => m.status === 'COMPLETED' && (m.completedDate || m.updatedAt) >= subDays(now, 30))
        .sort((a, b) => (b.completedDate || b.updatedAt).getTime() - (a.completedDate || a.updatedAt).getTime())
        .slice(0, 5);

    return {
        stats: {
            totalTeamSize: team.length,
            reportsSubmitted: submitted.size,
            reportsExpected: reporters.length,
            overdueTasks: overdue.length,
            dueThisWeek: dueThisWeek.length,
            completedThisWeek: doneThisWeek.length,
            openTasks: open.length,
            openIssues: issues.length,
            criticalIssues: issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length,
            atRiskMilestones: atRisk.length,
            activeMOUs: openMilestones.filter(m => m.category === 'MOU').length,
            revenue: paidOrders.reduce((sum, o) => sum + Number(o.amount), 0),
            activeProjects: projects.length,
        },
        missingReports: missingReports.map(m => ({ id: m.id, name: m.name, role: m.role, image: m.image })),
        overdueTasks: overdue.slice(0, 6).map(t => ({
            id: t.id, title: t.title, priority: t.priority, deadline: t.deadline, project: t.project?.name || null,
            assignee: t.userId ? byId.get(t.userId)?.name || null : null, assigneeImage: t.userId ? byId.get(t.userId)?.image || null : null,
        })),
        upcomingMilestones: upcoming.map(m => ({
            id: m.id, title: m.title, category: m.category, status: m.status, progress: m.progress, targetDate: m.targetDate,
            atRisk: isAtRisk(m), ownerName: m.ownerUser?.name, university: m.university?.name || null,
        })),
        projects: projects.map(p => {
            const total = p.tasks.length;
            const done = p.tasks.filter(t => t.status === 'DONE').length;
            return {
                id: p.id, name: p.name, status: p.status, endDate: p.endDate,
                progress: total ? Math.round((done / total) * 100) : 0, openTasks: total - done,
                overdue: p.tasks.filter(t => t.status !== 'DONE' && t.deadline < now).length,
            };
        }).sort((a, b) => b.overdue - a.overdue || a.progress - b.progress).slice(0, 6),
        recentMilestones: recentlyCompleted.map(m => ({
            id: m.id, title: m.title, category: m.category, ownerName: m.ownerUser?.name, ownerImage: m.ownerUser?.image, completedAt: m.completedDate || m.updatedAt,
        })),
        pendingApprovals: pendingExpenses.map(e => ({
            id: e.id, title: e.description || `Expense: ${e.category}`, submittedBy: e.user.name,
            amount: `₹${Number(e.amount).toLocaleString('en-IN')}`, type: 'EXPENSE',
        })),
    };
}
