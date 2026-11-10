import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getSubordinateIds } from '@/lib/hierarchy';
import { buildTeamFocus } from '@/lib/teamFocus';

/**
 * Manager home. Team = direct reports + members of departments they manage (same rule as /api/team);
 * projects = ones they manage or that sit in their departments.
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: userId, role } = session.user as any;
    if (role !== 'MANAGER' && role !== 'DIRECTOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const teamIds = ((await getSubordinateIds(userId, 'MANAGER')) || []).filter(id => id !== userId);
        const [spaces, projects] = await Promise.all([
            prisma.space.findMany({ where: { managerId: userId }, select: { id: true } }),
            prisma.project.findMany({
                where: { OR: [{ managers: { some: { id: userId } } }, { space: { managerId: userId } }] },
                select: { id: true },
            }),
        ]);
        return NextResponse.json(await buildTeamFocus({
            userId, teamIds, projectIds: projects.map(p => p.id), spaceIds: spaces.map(s => s.id),
        }));
    } catch (error) {
        console.error('Error fetching manager dashboard data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
