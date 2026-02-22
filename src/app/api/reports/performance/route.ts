import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubordinateIds } from '@/lib/hierarchy';

// GET /api/reports/performance - Employee performance analytics
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const currentUserId = (session.user as any).id;

    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'month';

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        if (period === 'week') startDate.setDate(startDate.getDate() - 7);
        else if (period === 'month') startDate.setDate(startDate.getDate() - 30);
        else startDate.setDate(startDate.getDate() - 90);

        // RBAC: Determine which users' performance to show
        const targetUserIds = await getSubordinateIds(currentUserId, userRole);

        // Fetch weekly reports with user details
        const weeklyReports = await prisma.weeklyReport.findMany({
            where: {
                weekStartDate: { gte: startDate, lte: endDate },
                ...(targetUserIds ? { userId: { in: targetUserIds } } : {})
            },
            include: {
                user: {
                    select: { id: true, name: true, image: true, role: true }
                }
            },
            orderBy: { weekStartDate: 'desc' }
        });

        // Group by user and calculate metrics
        const userMetrics = weeklyReports.reduce((acc: any, report) => {
            if (!acc[report.userId]) {
                acc[report.userId] = {
                    userId: report.userId,
                    user: report.user,
                    totalTasks: 0,
                    totalHours: 0,
                    avgPerformance: 0,
                    reportsCount: 0,
                    kpis: []
                };
            }

            acc[report.userId].totalTasks += report.totalTasksCompleted;
            acc[report.userId].totalHours += report.totalHoursWorked;
            acc[report.userId].avgPerformance += report.performanceScore || 0;
            acc[report.userId].reportsCount += 1;

            if (report.kpiMetrics) {
                try {
                    acc[report.userId].kpis.push(JSON.parse(report.kpiMetrics));
                } catch (e) { }
            }

            return acc;
        }, {});

        // Calculate final averages
        const performance = Object.values(userMetrics).map((m: any) => {
            const avgKpis = m.kpis.reduce((a: any, k: any) => ({
                avgTasksPerDay: (a.avgTasksPerDay || 0) + (k.avgTasksPerDay || 0),
                avgHoursPerDay: (a.avgHoursPerDay || 0) + (k.avgHoursPerDay || 0),
                completionRate: (a.completionRate || 0) + (k.completionRate || 0)
            }), {});

            return {
                ...m,
                avgPerformance: Math.round(m.avgPerformance / m.reportsCount),
                avgTasksPerWeek: Math.round(m.totalTasks / m.reportsCount),
                avgHoursPerWeek: Math.round(m.totalHours / m.reportsCount),
                metrics: {
                    avgTasksPerDay: Math.round((avgKpis.avgTasksPerDay || 0) / m.reportsCount * 10) / 10,
                    avgHoursPerDay: Math.round((avgKpis.avgHoursPerDay || 0) / m.reportsCount * 10) / 10,
                    completionRate: Math.round((avgKpis.completionRate || 0) / m.reportsCount)
                }
            };
        }).sort((a: any, b: any) => b.avgPerformance - a.avgPerformance);

        return NextResponse.json({
            period,
            dateRange: { start: startDate, end: endDate },
            employeePerformance: performance
        });
    } catch (error) {
        console.error('Performance API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
