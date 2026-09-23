import prisma from '@/lib/prisma';

/**
 * Fetches all subordinate IDs for a given user.
 * For DIRECTOR, it returns null (signifying "all users").
 * For MANAGER, it returns users who:
 *   a) Are direct reporting subordinates, OR
 *   b) Are members of any Space managed by this Manager.
 * For TEAM_LEADER, it returns just their direct reports.
 */
export async function getSubordinateIds(userId: string, role: string): Promise<string[] | null> {
    if (role === 'DIRECTOR' || role === 'MANAGEMENT') {
        return null; // null = all users
    }

    if (role === 'MANAGER') {
        // Get all spaces this manager manages and the members in those spaces (excluding suspended users)
        const managedSpaces = await prisma.space.findMany({
            where: { managerId: userId },
            include: {
                members: {
                    where: { isSuspended: false },
                    select: { id: true }
                }
            }
        });

        const spaceMemberIds = managedSpaces.flatMap((s: any) => s.members.map((m: any) => m.id));

        // Also get direct reporting subordinates (excluding suspended users)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                reportingSubordinates: {
                    where: { isSuspended: false },
                    select: { id: true }
                }
            }
        });

        const directSubIds = (user as any)?.reportingSubordinates?.map((u: any) => u.id) || [];

        // Union of both sets (deduplicated), excluding the manager themselves
        const allIds = [...new Set([...spaceMemberIds, ...directSubIds])];
        return allIds;
    }

    if (role === 'TEAM_LEADER') {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                reportingSubordinates: {
                    where: { isSuspended: false },
                    select: { id: true }
                }
            }
        });
        const subIds = (user as any)?.reportingSubordinates?.map((u: any) => u.id) || [];
        return [userId, ...subIds];
    }

    return [userId]; // Individual view
}

/**
 * Fetches all projects that a user has access to based on their role and hierarchy.
 */
export async function getAccessibleProjectIds(userId: string, role: string, subordinateIds: string[] | null): Promise<string[] | null> {
    if (role === 'DIRECTOR' || role === 'MANAGEMENT') {
        return null; // All projects
    }

    // A manager can see projects they manage OR projects managed by their subordinates
    const projects = await prisma.project.findMany({
        where: {
            OR: [
                { managers: { some: { id: userId } } },
                subordinateIds ? { managers: { some: { id: { in: subordinateIds } } } } : {},
                subordinateIds ? { tasks: { some: { userId: { in: subordinateIds } } } } : {},
                subordinateIds ? { milestones: { some: { owner: { in: subordinateIds } } } } : {}
            ]
        },
        select: { id: true }
    });

    return projects.map(p => p.id);
}
