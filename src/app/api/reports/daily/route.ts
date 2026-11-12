import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isReportWindowOpen } from '@/lib/reportWindow';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubordinateIds } from '@/lib/hierarchy';
import { getMobileSession } from '@/lib/auth-mobile';

// Reports are stored against the server's local midnight, so a plain "yyyy-MM-dd" means that local day
// (new Date("2026-11-12") would mean UTC midnight and drop the first day on non-UTC servers).
const DAY_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const parseDay = (value: string) => {
    const m = DAY_ONLY.exec(value);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
};

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
        const type = searchParams.get('type');

        const targetDate = dateParam ? parseDay(dateParam) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const allowedIds = await getSubordinateIds(currentUserId, userRole);
        let allTeamMembers: any[] = [];

        // Handling team context for metadata (active members only)
        if (allowedIds) {
            allTeamMembers = await prisma.user.findMany({
                where: { id: { in: allowedIds }, isSuspended: false },
                select: { id: true, name: true, role: true }
            });
        } else {
            allTeamMembers = await prisma.user.findMany({
                where: { role: { in: ['MANAGER', 'TEAM_LEADER', 'EMPLOYEE', 'INTERN'] }, isSuspended: false },
                select: { id: true, name: true, role: true }
            });
        }

        let finalTargetIds: string[] | null = null;
        if (type === 'my') {
            finalTargetIds = [currentUserId];
        } else if (userIdParam) {
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
                gte: parseDay(startDate),
                // a plain end date includes that whole day
                lte: DAY_ONLY.test(endDate) ? new Date(parseDay(endDate).getTime() + 86_399_999) : parseDay(endDate)
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
            take: 500
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
            let totalUtilization = 0;
            let utilizationCount = 0;

            reports.forEach((r: any) => {
                const pName = r.project?.name || 'General Operations';
                const currentEffort = effortByProject[pName] || 0;
                effortByProject[pName] = Math.round((currentEffort + Number(r.hoursWorked)) * 10) / 10;

                if (r.utilization !== undefined && r.utilization !== null) {
                    totalUtilization += Number(r.utilization);
                    utilizationCount++;
                }

                if (r.challenges && r.challenges.trim().length > 10) {
                    risks.push({
                        id: r.id,
                        userName: r.user.name,
                        challenge: r.challenges,
                        projectId: r.projectId
                    });
                }
            });

            const avgUtilization = utilizationCount > 0
                ? Math.round(totalUtilization / utilizationCount)
                : 0;

            meta = {
                targetDate,
                submissionRate,
                avgUtilization,
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
    // The report is always filed for the signed-in person; a userId in the body is ignored.
    const session = (await getServerSession(authOptions)) || (await getMobileSession());
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized', message: 'Sign in to submit your report.' }, { status: 401 });
    }
    const userId = (session.user as any).id as string;
    const role = ((session.user as any).role || '').toUpperCase();

    try {
        const body = await request.json().catch(() => ({}));
        const { utilization, projectId } = body;
        const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
        const accomplishments = text(body.accomplishments, 5000);
        const challenges = text(body.challenges, 3000) || null;
        const tomorrowPlan = text(body.tomorrowPlan, 3000) || null;
        const tasksCompleted = Number(body.tasksCompleted ?? 0);
        const hoursWorked = Number(body.hoursWorked ?? 0);

        if (!accomplishments) {
            return NextResponse.json({ error: 'Invalid report', message: 'Describe what you got done today.' }, { status: 400 });
        }
        if (!Number.isInteger(tasksCompleted) || tasksCompleted < 0 || tasksCompleted > 200) {
            return NextResponse.json({ error: 'Invalid report', message: 'Tasks completed must be a whole number between 0 and 200.' }, { status: 400 });
        }
        if (!Number.isFinite(hoursWorked) || hoursWorked < 0 || hoursWorked > 24) {
            return NextResponse.json({ error: 'Invalid report', message: 'Hours worked must be between 0 and 24.' }, { status: 400 });
        }

        const parsedUtilization = utilization !== undefined ? parseInt(utilization, 10) : 80;
        const validUtilization = isNaN(parsedUtilization) ? 80 : Math.max(0, Math.min(100, parsedUtilization));

        // 1. Time Window Validation (5:00 PM - 11:59 PM IST)
        const isWithinWindow = isReportWindowOpen();

        // Only Directors and Managers can submit outside the window
        const isForced = body.forceSubmission === true && ['DIRECTOR', 'MANAGER'].includes(role);

        if (!isWithinWindow && !isForced) {
            return NextResponse.json({
                error: 'Submission Restricted',
                message: 'Daily reports can only be submitted between 5:00 PM and 11:59 PM IST.'
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
                    utilization: validUtilization,
                    accomplishments,
                    challenges,
                    tomorrowPlan,
                    // only touch the project link when the client sends one, so editing never clears it
                    ...(projectId !== undefined ? { projectId: projectId || null } : {}),
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
                    utilization: validUtilization,
                    accomplishments,
                    challenges,
                    tomorrowPlan,
                    projectId: projectId || null
                }
            });
        }

        return NextResponse.json(report, { status: 201 });
    } catch (error) {
        console.error('Failed to submit daily report:', error);
        return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
    }
}
