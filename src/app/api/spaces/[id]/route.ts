import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    context: any
) {
    console.log("[API/SPACES] DEBUG: Start request handling");

    let params: any = {};
    try {
        // Attempt to extract params from context (standard Next.js dynamic route behavior)
        if (context?.params) {
            params = context.params instanceof Promise ? await context.params : context.params;
        } else {
            console.warn("[API/SPACES] No params found in context, checking context itself");
            params = context instanceof Promise ? await context : context;
        }
    } catch (e: any) {
        console.error("[API/SPACES] Failed to resolve params:", e.message);
    }

    const id = params?.id;
    console.log(`[API/SPACES] Resolved ID: "${id}"`);

    try {
        if (!id) {
            console.error("[API/SPACES] ERROR: Missing ID");
            return NextResponse.json({
                error: 'Missing space ID',
                debugInfo: {
                    contextType: typeof context,
                    hasParams: !!context?.params,
                    paramsKeys: Object.keys(params || {})
                }
            }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            console.warn("[API/SPACES] Unauthorized");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { role, id: userId } = session.user as any;
        let projectWhereClause: any = { spaceId: id };

        // Sub-filters for projects based on role (similar to /api/projects)
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
                include: { subordinates: true }
            }) as any;

            const teamIds = userWithTeam?.subordinates?.map((s: any) => s.id) || [];
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

        // @ts-ignore
        const space = await prisma.space.findUnique({
            where: { id },
            include: {
                projects: {
                    where: projectWhereClause,
                    include: {
                        _count: {
                            select: { tasks: true, milestones: true }
                        }
                    }
                },
                resources: true,
                wikiPages: true,
                _count: {
                    select: { projects: true, resources: true, issues: true, milestones: true }
                }
            }
        });

        if (!space) {
            console.warn(`[API/SPACES] Not Found: ${id}`);
            return NextResponse.json({ error: 'Space not found in database', id }, { status: 404 });
        }

        return NextResponse.json(space);
    } catch (error: any) {
        console.error('[API/SPACES] Critical Catch:', error.message);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message,
            id: id
        }, { status: 500 });
    }
}
