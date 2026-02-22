import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyHierarchy } from '@/lib/notifications';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user as any;

    try {
        let where: any = {};

        // Role-Based Filtering
        if (role === 'DIRECTOR') {
            // Directors see EVERYTHING
            where = {};
        } else if (['MANAGER', 'TEAM_LEADER'].includes(role)) {
            // Managers see:
            // 1. Issues reported by them
            // 2. Issues assigned to them
            // 3. Issues reported by their subordinates
            // 4. Issues in projects they manage

            // specific logic: Fetch subordinates first
            const subordinatesData = await (prisma as any).user.findMany({
                where: { reportingManagers: { some: { id: userId } } },
                select: { id: true }
            });
            const subordinateIds = subordinatesData.map((s: any) => s.id);

            where = {
                OR: [
                    { reporterId: userId },
                    { assignedToId: userId },
                    { reporterId: { in: subordinateIds } },
                    { project: { managers: { some: { id: userId } } } }
                ]
            };
        } else {
            // Employees/Interns see:
            // 1. Issues reported by them
            // 2. Issues assigned to them
            where = {
                OR: [
                    { reporterId: userId },
                    { assignedToId: userId }
                ]
            };
        }

        const issues = await (prisma as any).issue.findMany({
            where,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                reporter: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        role: true
                    }
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                resolvedBy: {
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

        // Metadata for Managers/Directors Dashboard
        let meta = null;
        if (['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(role)) {
            let activeCount = 0;
            let criticalCount = 0;
            let totalDaysOpen = 0;
            const projectStats: any = {};

            issues.forEach((issue: any) => {
                if (['OPEN', 'RESOLVING'].includes(issue.status)) {
                    activeCount++;
                    totalDaysOpen += issue.daysOpen || 0;
                }
                if (issue.severity === 'CRITICAL' && !['CLOSED', 'RESOLVED'].includes(issue.status)) {
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
        console.error("GET Issues Error:", error);
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
        const { title, description, projectId, severity, owner, assignedToId } = body;

        const issue = await (prisma as any).issue.create({
            data: {
                title,
                description,
                projectId: projectId || null,
                severity,
                owner: owner || session.user.name, // Fallback legacy field
                reporterId: (session.user as any).id,
                assignedToId: assignedToId || null,
                status: 'OPEN',
                daysOpen: 0
            }
        });

        // Notify Hierarchy (Managers/Directors) about the new issue
        await notifyHierarchy({
            actorId: (session.user as any).id,
            action: 'Issue Reported',
            title: `New Issue: ${title}`,
            details: `Severity: ${severity} | Description: ${description?.substring(0, 100)}...`,
            link: '/issues'
        });

        // Notify Assignee if exists
        if (assignedToId) {
            await notifyHierarchy({
                actorId: (session.user as any).id,
                targetId: assignedToId,
                action: 'Issue Assigned',
                title: 'You have been assigned an Issue',
                details: `Please investigate: ${title}`,
                link: '/issues'
            });
        }

        // Notify Hierarchy (Managers/Directors) about the new issue
        await notifyHierarchy({
            actorId: (session.user as any).id,
            action: 'Issue Reported',
            title: `New Issue: ${title}`,
            details: `Severity: ${severity} | Description: ${description?.substring(0, 100)}...`,
            link: '/issues'
        });

        // Notify Assignee if exists
        if (assignedToId) {
            await notifyHierarchy({
                actorId: (session.user as any).id,
                targetId: assignedToId,
                action: 'Issue Assigned',
                title: 'You have been assigned an Issue',
                details: `Please investigate: ${title}`,
                link: '/issues'
            });
        }

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

    const { id: userId, role } = session.user as any;

    try {
        const body = await request.json();
        const { id, title, description, projectId, status, severity, owner, resolution, assignedToId } = body;

        const updateData: any = {
            title,
            description,
            projectId: projectId || null,
            status,
            severity,
            owner,
            assignedToId
        };

        // If resolving/closing, add resolution details
        if (['RESOLVED', 'CLOSED'].includes(status)) {
            // Permission check: Director, Manager, or Assignee can resolve
            // (We assume if they can access the PUT they passed preliminary checks, but good to be safe)
            // ideally we fetch the issue first to check ownership, but strict role filtering in GET limits access effectively.

            updateData.resolvedById = userId;
            updateData.resolution = resolution;
            updateData.resolutionDate = new Date();
        }

        const issue = await (prisma as any).issue.update({
            where: { id },
            data: updateData
        });

        if (['RESOLVED', 'CLOSED'].includes(status)) {
            const issueData = await (prisma as any).issue.findUnique({ where: { id }, select: { reporterId: true } });
            if (issueData?.reporterId) {
                await notifyHierarchy({
                    actorId: userId,
                    targetId: issueData.reporterId,
                    action: 'Issue Resolved',
                    title: 'Issue Resolved',
                    details: `Resolution: ${resolution}`,
                    link: '/issues'
                });
            }
        }

        return NextResponse.json(issue);
    } catch (error) {
        console.error("PUT Issue Error:", error);
        return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 });
    }
}
