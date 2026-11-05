import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getAccessibleProjectIds, getSubordinateIds } from '@/lib/hierarchy';

export const dynamic = 'force-dynamic';

const LIMIT = 6;

// GET /api/search?q=... : role-scoped search across projects, tasks, milestones, people and universities.
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    if (q.length < 2) {
        return NextResponse.json({ projects: [], tasks: [], milestones: [], people: [], universities: [] });
    }

    const { id: userId, role } = session.user as any;
    // MANAGEMENT is a read-only director: same visibility.
    const scopeRole = role === 'MANAGEMENT' ? 'DIRECTOR' : role;
    const subordinateIds = await getSubordinateIds(userId, scopeRole);
    const projectIds = await getAccessibleProjectIds(userId, scopeRole, subordinateIds);
    const visibleUserIds = subordinateIds === null ? null : Array.from(new Set([userId, ...subordinateIds]));

    const contains = { contains: q, mode: 'insensitive' as const };
    const projectScope = projectIds === null ? {} : { id: { in: projectIds } };
    const ownerScope = visibleUserIds === null ? {} : { userId: { in: visibleUserIds } };
    const milestoneScope = visibleUserIds === null ? {} : { owner: { in: visibleUserIds } };
    const peopleScope = visibleUserIds === null ? {} : { id: { in: visibleUserIds } };

    try {
        const [projects, tasks, milestones, people, universities] = await Promise.all([
            prisma.project.findMany({
                where: { ...projectScope, OR: [{ name: contains }, { description: contains }] },
                select: { id: true, name: true, status: true },
                take: LIMIT,
            }),
            prisma.task.findMany({
                where: { ...ownerScope, OR: [{ title: contains }, { description: contains }] },
                select: { id: true, title: true, status: true, assignedTo: { select: { name: true } } },
                orderBy: { updatedAt: 'desc' },
                take: LIMIT,
            }),
            prisma.milestone.findMany({
                where: { ...milestoneScope, OR: [{ title: contains }, { description: contains }] },
                select: { id: true, title: true, status: true, category: true },
                take: LIMIT,
            }),
            prisma.user.findMany({
                where: { ...peopleScope, OR: [{ name: contains }, { email: contains }] },
                select: { id: true, name: true, email: true, role: true, image: true },
                take: LIMIT,
            }),
            prisma.university.findMany({
                where: { OR: [{ name: contains }, { location: contains }] },
                select: { id: true, name: true, location: true, status: true },
                take: LIMIT,
            }),
        ]);

        return NextResponse.json({ projects, tasks, milestones, people, universities });
    } catch (error) {
        console.error('Search failed:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
