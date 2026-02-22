import prisma from '@/lib/prisma';

/**
 * Fetches all subordinate IDs for a given user.
 * For DIRECTOR, it returns all users except other directors (or as required).
 * For MANAGER/TEAM_LEADER, it returns themselves plus all their subordinates.
 */
export async function getSubordinateIds(userId: string, role: string): Promise<string[] | null> {
    if (role === 'DIRECTOR') {
        return null; // Null signifies "all users" for the Director
    }

    if (!['MANAGER', 'TEAM_LEADER'].includes(role)) {
        return [userId]; // Individual view
    }

    // Fetch subordinates recursively (or just direct reports depending on complexity requirements)
    // For now, let's stick to direct subordinates as per the current schema implementation
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            reportingSubordinates: {
                select: { id: true }
            }
        }
    });

    const subIds = user?.reportingSubordinates.map(u => u.id) || [];
    return [userId, ...subIds];
}

/**
 * Fetches all projects that a user has access to based on their role and hierarchy.
 */
export async function getAccessibleProjectIds(userId: string, role: string, subordinateIds: string[] | null): Promise<string[] | null> {
    if (role === 'DIRECTOR') {
        return null; // All projects
    }

    // A manager can see projects they manage OR projects managed by their subordinates
    const projects = await prisma.project.findMany({
        where: {
            OR: [
                { managers: { some: { id: userId } } },
                subordinateIds ? { managers: { some: { id: { in: subordinateIds } } } } : {}
            ]
        },
        select: { id: true }
    });

    return projects.map(p => p.id);
}
