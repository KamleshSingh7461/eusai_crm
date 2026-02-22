import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { role, id: userId } = session.user as any;
        const limit = 20;

        // Define RBAC Filters
        let projectWhere: any = {};
        let spaceWhere: any = {};
        let taskWhere: any = {};

        if (role === 'DIRECTOR') {
            // Directors see all
            projectWhere = {};
            spaceWhere = {};
            taskWhere = {}; // Maybe too broad? Let's limit tasks to involved projects if needed, or all.
            // For "Recents", typically it's *their* recent interactions.
            // But since we track "updatedAt", showing global recent updates is good for Directors.
        } else if (role === 'MANAGER') {
            const userWithTeam = await prisma.user.findUnique({
                where: { id: userId },
                include: { reportingSubordinates: true }
            }) as any;
            const teamIds = userWithTeam?.reportingSubordinates?.map((s: any) => s.id) || [];
            const allTeamIds = [userId, ...teamIds];

            // Projects: Managed by me or my team involved
            projectWhere = {
                OR: [
                    { managers: { some: { id: userId } } },
                    { tasks: { some: { userId: { in: allTeamIds } } } },
                    { milestones: { some: { owner: { in: allTeamIds } } } }
                ]
            };

            // Spaces: Created by me or relevant to projects
            spaceWhere = {
                OR: [
                    { managerId: userId },
                    { projects: { some: projectWhere } }
                ]
            };

            // Tasks: Assigned to team or self
            taskWhere = {
                userId: { in: allTeamIds }
            };

        } else {
            // Employees: Only assigned items
            projectWhere = {
                OR: [
                    { tasks: { some: { userId: userId } } },
                    { milestones: { some: { owner: userId } } }
                ]
            };

            spaceWhere = {
                projects: { some: projectWhere }
            };

            taskWhere = {
                userId: userId
            };
        }

        // Parallel Fetch
        const [projects, spaces, tasks] = await Promise.all([
            prisma.project.findMany({
                where: projectWhere,
                orderBy: { updatedAt: 'desc' },
                take: 10,
                select: { id: true, name: true, updatedAt: true, status: true, space: { select: { name: true, color: true } } }
            }),
            prisma.space.findMany({
                where: spaceWhere,
                orderBy: { updatedAt: 'desc' },
                take: 5,
                select: { id: true, name: true, updatedAt: true, color: true, type: true }
            }),
            prisma.task.findMany({
                where: taskWhere,
                orderBy: { updatedAt: 'desc' },
                take: 20,
                select: { id: true, title: true, updatedAt: true, status: true, priority: true, project: { select: { name: true } } }
            })
        ]);

        // Normalize and Combine
        const recentItems = [
            ...projects.map(p => ({
                id: p.id,
                type: 'project',
                title: p.name,
                space: p.space?.name || 'Unassigned',
                spaceColor: p.space?.color,
                updatedAt: p.updatedAt,
                status: p.status,
                link: `/projects/${p.id}`
            })),
            ...spaces.map(s => ({
                id: s.id,
                type: 'space',
                title: s.name,
                space: 'Workspace',
                updatedAt: s.updatedAt,
                color: s.color,
                status: s.type, // Map type to status for display
                link: `/spaces/${s.id}`
            })),
            ...tasks.map(t => ({
                id: t.id,
                type: 'task',
                title: t.title,
                space: t.project?.name || 'No Project',
                updatedAt: t.updatedAt,
                status: t.status,
                priority: t.priority,
                link: `/tasks`
            }))
        ];

        // Sort combined list by updatedAt desc
        recentItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return NextResponse.json(recentItems);

    } catch (error) {
        console.error('Error fetching recent items:', error);
        return NextResponse.json({ error: 'Failed to fetch recent items' }, { status: 500 });
    }
}
