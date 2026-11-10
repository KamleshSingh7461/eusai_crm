import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getSubordinateIds } from '@/lib/hierarchy';
import { buildTeamFocus } from '@/lib/teamFocus';

/**
 * Team leader home. Team = their direct reports; projects = ones they manage or where
 * their team has open work. Team leaders don't manage departments.
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: userId, role } = session.user as any;
    if (!['TEAM_LEADER', 'MANAGER', 'DIRECTOR'].includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const teamIds = ((await getSubordinateIds(userId, 'TEAM_LEADER')) || []).filter(id => id !== userId);
        const [workProjects, managed] = await Promise.all([
            prisma.project.findMany({
                where: { OR: [{ managers: { some: { id: userId } } }, { tasks: { some: { userId: { in: teamIds }, status: { not: 'DONE' } } } }] },
                select: { id: true },
            }),
            prisma.project.findMany({ where: { managers: { some: { id: userId } } }, select: { id: true } }),
        ]);
        return NextResponse.json(await buildTeamFocus({
            userId, teamIds, spaceIds: [],
            projectIds: workProjects.map(p => p.id),
            // milestones and issues: the team's own, or on projects this leader manages
            ownedProjectIds: managed.map(p => p.id),
        }));
    } catch (error) {
        console.error('Error fetching team leader dashboard data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
