import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    context: any
) {
    let params: any = {};
    try {
        if (context?.params) {
            params = context.params instanceof Promise ? await context.params : context.params;
        } else {
            params = context instanceof Promise ? await context : context;
        }
    } catch (e: any) {
        console.error("[API/SPACES] Failed to resolve params:", e.message);
    }

    const id = params?.id;

    try {
        if (!id) {
            return NextResponse.json({ error: 'Missing space ID' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { role, id: userId } = session.user as any;
        let projectWhereClause: any = { spaceId: id };

        if (role === 'EMPLOYEE' || role === 'INTERN') {
            projectWhereClause = {
                ...projectWhereClause,
                OR: [
                    { tasks: { some: { userId: userId } } },
                    { milestones: { some: { owner: userId } } },
                    { dailyReports: { some: { userId: userId } } }
                ]
            };
        } else if (role === 'TEAM_LEADER') {
            const userWithTeam = await prisma.user.findUnique({
                where: { id: userId },
                include: { reportingSubordinates: true }
            }) as any;

            const teamIds = userWithTeam?.reportingSubordinates?.map((s: any) => s.id) || [];
            const allTeamIds = [userId, ...teamIds];

            projectWhereClause = {
                ...projectWhereClause,
                OR: [
                    { tasks: { some: { userId: { in: allTeamIds } } } },
                    { milestones: { some: { owner: { in: allTeamIds } } } },
                    { dailyReports: { some: { userId: { in: allTeamIds } } } }
                ]
            };
        }

        const [space, activities] = await Promise.all([
            prisma.space.findUnique({
                where: { id },
                include: {
                    projects: {
                        where: projectWhereClause,
                        include: {
                            _count: {
                                select: { tasks: true, milestones: true }
                            },

                        }
                    },
                    resources: true,
                    wikiPages: true,
                    _count: {
                        select: { projects: true, resources: true, issues: true, milestones: true }
                    }
                }
            }),
            prisma.activity.findMany({
                where: {
                    project: {
                        spaceId: id
                    }
                },
                include: {
                    user: {
                        select: { name: true, image: true }
                    },
                    project: {
                        select: { name: true }
                    }
                },
                orderBy: { timestamp: 'desc' },
                take: 10
            })
        ]);

        if (!space) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        // Return combined data
        return NextResponse.json({ ...space, recentActivities: activities });
    } catch (error: any) {
        console.error('[API/SPACES] Error:', error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
