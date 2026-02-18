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
    if (role !== 'DIRECTOR') {
        return NextResponse.json({ error: 'Forbidden: Director access only' }, { status: 403 });
    }

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 1. Fetch Comprehensive Data
        const [
            users,
            projects,
            partnerCount,
            totalUniversities,
            spaces,
            recentMilestones,
            issueStats,
            globalActivity,
            allTasks,
            taskDistribution,
            projectDistribution,
            completedTasksLastWeek
        ] = await Promise.all([
            // All Users with their task summaries + COMPLETED counts for Top Performer calc
            (prisma as any).user.findMany({
                where: {
                    role: { not: 'DIRECTOR' }
                },
                select: {
                    id: true,
                    name: true,
                    role: true,
                    image: true,
                    _count: {
                        select: {
                            tasks: { where: { status: { not: 'DONE' } } },
                            milestones: { where: { status: { not: 'COMPLETED' } } },
                        }
                    }
                }
            }),
            // All Projects
            (prisma as any).project.findMany({
                include: {
                    _count: { select: { tasks: true, milestones: true } },
                    milestones: { select: { status: true } },
                    manager: { select: { name: true } }
                }
            }),
            (prisma as any).university.count({ where: { status: 'PARTNER' } }),
            (prisma as any).university.count(),
            (prisma as any).space.findMany({
                include: { _count: { select: { projects: { where: { status: { not: 'CLOSED' } } } } } }
            }),
            (prisma as any).milestone.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { ownerUser: { select: { name: true, image: true } }, project: { select: { name: true } } }
            }),
            (prisma as any).issue.groupBy({
                by: ['severity'],
                where: { status: { not: 'CLOSED' } },
                _count: true
            }),
            (prisma as any).task.findMany({
                orderBy: { updatedAt: 'desc' },
                take: 15,
                include: { assignedTo: { select: { name: true, image: true } }, project: { select: { name: true } } }
            }),
            // Fetch all tasks for stats
            (prisma as any).task.findMany({ select: { status: true, userId: true, updatedAt: true } }),
            // Task Distribution for Pie Chart
            (prisma as any).task.groupBy({ by: ['status'], _count: true }),
            // Project Distribution for Pie Chart
            (prisma as any).project.groupBy({ by: ['status'], _count: true }),
            // Completed tasks last 7 days for Productivity Chart
            (prisma as any).task.findMany({
                where: { status: 'DONE', updatedAt: { gte: sevenDaysAgo } },
                select: { updatedAt: true }
            })
        ]);

        // 2. Top Performers Calculation (Last 30 Days)
        const userPerformance = users.map((u: any) => {
            const completedCount = allTasks.filter((t: any) =>
                t.userId === u.id &&
                t.status === 'DONE' &&
                new Date(t.updatedAt) >= thirtyDaysAgo
            ).length;
            return { ...u, completedCount };
        });

        const topPerformers = userPerformance
            .sort((a: any, b: any) => b.completedCount - a.completedCount)
            .slice(0, 5)
            .map((u: any) => ({
                id: u.id,
                name: u.name,
                image: u.image,
                role: u.role,
                score: u.completedCount
            }));

        // 3. Weekly Productivity (Last 7 Days)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const productivityData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayName = days[d.getDay()];
            const dateStr = d.toISOString().split('T')[0];

            const count = completedTasksLastWeek.filter((t: any) =>
                t.updatedAt.toISOString().startsWith(dateStr)
            ).length;

            productivityData.push({ day: dayName, tasks: count });
        }

        // 3.5. Monthly Productivity (Last 6 Months)
        const monthlyProductivity = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthName = d.toLocaleString('default', { month: 'short' });
            const year = d.getFullYear(); // Not used in label but useful for filtering if needed
            const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
            const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);

            const count = await (prisma as any).task.count({
                where: {
                    status: 'DONE',
                    updatedAt: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                }
            });

            monthlyProductivity.push({ name: monthName, tasks: count });
        }

        // 4. Marketing Coverage
        const marketCoverage = totalUniversities > 0
            ? Math.round((partnerCount / totalUniversities) * 100)
            : 0;

        // 5. Space Distribution
        const spaceDistribution = spaces.map((space: any) => ({
            id: space.id,
            name: space.name,
            color: space.color,
            projectCount: space._count.projects
        })).sort((a: any, b: any) => b.projectCount - a.projectCount);

        // 6. Project Progress
        const projectsWithProgress = projects.map((p: any) => {
            const totalMilestones = p._count.milestones;
            const completedMilestones = p.milestones.filter((m: any) => m.status === 'COMPLETED').length;
            const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

            return {
                id: p.id,
                name: p.name,
                status: p.status,
                managerName: p.manager?.name || 'Unassigned',
                taskCount: p._count.tasks,
                milestoneCount: totalMilestones,
                completedMilestones,
                progress
            };
        });

        // 7. Health Metrics
        const criticalIssues = issueStats.find((s: any) => s.severity === 'CRITICAL')?._count || 0;
        const totalOpenIssues = issueStats.reduce((acc: any, curr: any) => acc + curr._count, 0);

        // 8. Task Completion Rate
        const completedTaskCount = allTasks.filter((t: any) => t.status === 'DONE').length;
        const taskCompletionRate = allTasks.length > 0 ? Math.round((completedTaskCount / allTasks.length) * 100) : 0;

        return NextResponse.json({
            stats: {
                partnerCount,
                staffCount: users.length,
                marketCoverage,
                criticalIssues,
                totalOpenIssues,
                taskCompletionRate,
                activeProjects: projects.filter((p: any) => p.status !== 'CLOSED').length,
                missingReports: users.length - (await (prisma as any).dailyReport.count({
                    where: {
                        date: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0)),
                            lt: new Date(new Date().setHours(23, 59, 59, 999))
                        }
                    }
                }))
            },
            employees: users.map((u: any) => ({
                id: u.id,
                name: u.name,
                role: u.role,
                image: u.image,
                pendingTasks: u._count.tasks,
                pendingMilestones: u._count.milestones
            })),
            topPerformers,
            projects: projectsWithProgress,
            spaceDistribution,
            recentMilestones: recentMilestones.map((m: any) => ({
                id: m.id,
                title: m.title,
                projectName: m.project?.name || 'Unknown Project',
                ownerName: m.ownerUser?.name || 'System',
                ownerImage: m.ownerUser?.image,
                status: m.status,
                completedAt: m.completedDate
            })),
            globalActivity: globalActivity.map((t: any) => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                status: t.status,
                dueDate: t.deadline,
                assignedTo: t.assignedTo?.name,
                assignedToImage: t.assignedTo?.image,
                projectName: t.project?.name,
                updatedAt: t.updatedAt
            })),
            charts: {
                weeklyProductivity: productivityData,
                monthlyProductivity,
                taskStatus: taskDistribution.map((t: any) => ({ name: t.status, value: t._count })),
                projectStatus: projectDistribution.map((p: any) => ({ name: p.status, value: p._count })),
                issueSeverity: issueStats.map((i: any) => ({ name: i.severity, value: i._count }))
            },
            role: 'DIRECTOR'
        });
    } catch (error: any) {
        console.error('Director Dashboard API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
