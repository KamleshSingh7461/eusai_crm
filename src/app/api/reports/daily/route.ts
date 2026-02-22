import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubordinateIds } from '@/lib/hierarchy';

// GET /api/reports/daily - Fetch daily reports
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const currentUserId = (session.user as any).id;

    try {
        const { searchParams } = new URL(request.url);
        const userIdParam = searchParams.get('userId');
        const dateParam = searchParams.get('date');
        const projectId = searchParams.get('projectId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const targetDate = dateParam ? new Date(dateParam) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const allowedIds = await getSubordinateIds(currentUserId, userRole);
        let allTeamMembers: any[] = [];

        // Handling team context for metadata
        if (allowedIds) {
            allTeamMembers = await prisma.user.findMany({
                where: { id: { in: allowedIds } },
                select: { id: true, name: true, role: true }
            });
        } else {
            allTeamMembers = await prisma.user.findMany({
                where: { role: { in: ['MANAGER', 'TEAM_LEADER', 'EMPLOYEE', 'INTERN'] } },
                select: { id: true, name: true, role: true }
            });
        }

        let finalTargetIds: string[] | null = null;
        if (userIdParam) {
            if (allowedIds && !allowedIds.includes(userIdParam)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            finalTargetIds = [userIdParam];
        } else {
            finalTargetIds = allowedIds;
        }

        const where: any = {};
        if (finalTargetIds) {
            where.userId = { in: finalTargetIds };
        }

        if (dateParam) {
            where.date = targetDate;
        } else if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        if (projectId) where.projectId = projectId;

        const reports = await (prisma as any).dailyReport.findMany({
            where,
            include: {
                project: { select: { id: true, name: true } },
                user: {
                    select: { id: true, name: true, role: true, image: true }
                }
            },
            orderBy: { date: 'desc' },
            take: 100
        });

        // Analytical Metadata for Executives
        let meta = null;
        if (['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole) && !userIdParam) {
            const submittedUserIds = new Set(reports.filter((r: any) =>
                new Date(r.date).getTime() === targetDate.getTime()
            ).map((r: any) => r.userId));

            const missingMembers = allTeamMembers.filter(m => !submittedUserIds.has(m.id));
            const submissionRate = allTeamMembers.length > 0
                ? Math.round((submittedUserIds.size / allTeamMembers.length) * 100)
                : 100;

            const effortByProject: Record<string, number> = {};
            const risks: any[] = [];

            reports.forEach((r: any) => {
                const pName = r.project?.name || 'Unassigned';
                effortByProject[pName] = (effortByProject[pName] || 0) + Number(r.hoursWorked);

                if (r.challenges && r.challenges.trim().length > 10) {
                    risks.push({
                        id: r.id,
                        userName: r.user.name,
                        challenge: r.challenges,
                        projectId: r.projectId
                    });
                }
            });

            meta = {
                targetDate,
                submissionRate,
                totalExpected: allTeamMembers.length,
                totalSubmitted: submittedUserIds.size,
                missingMembers: missingMembers.map(m => ({ id: m.id, name: m.name, role: m.role })),
                effortByProject,
                risks: risks.slice(0, 5) // Top 5 urgent risks
            };
        }

        return NextResponse.json({ reports, meta });
    } catch (error) {
        console.error('Failed to fetch daily reports:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST /api/reports/daily - Submit daily report
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            userId,
            tasksCompleted,
            hoursWorked,
            accomplishments,
            challenges,
            tomorrowPlan,
            projectId
        } = body;

        // 1. Time Window Validation (6-8 PM check)
        const now = new Date();
        const hour = now.getHours();

        // Check if between 18:00 (inclusive) and 20:00 (exclusive)
        const isWithinWindow = hour >= 18 && hour < 20;

        // For debugging/emergency, we could check for a "force" flag from directors
        const isForced = body.forceSubmission === true;

        if (!isWithinWindow && !isForced) {
            return NextResponse.json({
                error: 'Submission Restricted',
                message: 'Daily reports can only be submitted between 6:00 PM and 8:00 PM.'
            }, { status: 403 });
        }

        // 2. Check if report already exists for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await (prisma as any).dailyReport.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: today
                }
            }
        });

        let report;
        if (existing) {
            // Update existing report
            report = await (prisma as any).dailyReport.update({
                where: { id: existing.id },
                data: {
                    tasksCompleted,
                    hoursWorked,
                    accomplishments,
                    challenges,
                    tomorrowPlan,
                    projectId,
                    submittedAt: new Date()
                }
            });
        } else {
            // Create new report
            report = await (prisma as any).dailyReport.create({
                data: {
                    userId,
                    date: today,
                    tasksCompleted,
                    hoursWorked,
                    accomplishments,
                    challenges,
                    tomorrowPlan,
                    projectId
                }
            });
        }

        return NextResponse.json(report, { status: 201 });
    } catch (error) {
        console.error('Failed to submit daily report:', error);
        return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
    }
}
