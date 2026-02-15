import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = session.user as any;

    try {
        const issues = await (prisma as any).issue.findMany({
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        let meta = null;
        if (['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(role)) {
            let activeCount = 0;
            let criticalCount = 0;
            let totalDaysOpen = 0;
            const projectStats: any = {};

            issues.forEach((issue: any) => {
                if (issue.status !== 'CLOSED') {
                    activeCount++;
                    totalDaysOpen += issue.daysOpen || 0;
                }
                if (issue.severity === 'CRITICAL' && issue.status !== 'CLOSED') {
                    criticalCount++;
                }

                const projName = issue.project?.name || 'Unassigned';
                if (!projectStats[projName]) projectStats[projName] = 0;
                projectStats[projName]++;
            });

            meta = {
                activeCount,
                criticalCount,
                avgDaysOpen: activeCount > 0 ? Math.round(totalDaysOpen / activeCount) : 0,
                projectDistribution: Object.entries(projectStats).map(([name, count]) => ({ name, count }))
            };
        }

        return NextResponse.json({ issues, meta });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, projectId, severity, owner } = body;

        const issue = await (prisma as any).issue.create({
            data: {
                title,
                projectId: projectId || null,
                severity,
                owner,
                status: 'OPEN',
                daysOpen: 0
            }
        });

        return NextResponse.json(issue);
    } catch (error) {
        console.error("POST Issue Error:", error);
        return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, title, projectId, status, severity, owner } = body;

        const issue = await (prisma as any).issue.update({
            where: { id },
            data: {
                title,
                projectId: projectId || null,
                status,
                severity,
                owner
            }
        });

        return NextResponse.json(issue);
    } catch (error) {
        console.error("PUT Issue Error:", error);
        return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 });
    }
}
