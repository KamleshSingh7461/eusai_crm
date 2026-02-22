import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubordinateIds, getAccessibleProjectIds } from '@/lib/hierarchy';

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const currentUserId = (session.user as any).id;

    if (!['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // Fetch Hierarchy Data
        const targetUserIds = await getSubordinateIds(currentUserId, userRole);
        const targetProjectIds = await getAccessibleProjectIds(currentUserId, userRole, targetUserIds);

        // 1. Employee KPIs & Department Pulse
        const employees = await prisma.user.findMany({
            where: {
                role: { not: 'DIRECTOR' },
                ...(targetUserIds ? { id: { in: targetUserIds } } : {})
            },
            include: {
                tasks: {
                    select: { status: true, deadline: true, updatedAt: true }
                },
                _count: {
                    select: { tasks: true }
                }
            }
        });

        const employeeKPIs = employees.map(emp => {
            const completedTasks = emp.tasks.filter(t => t.status === 'DONE');
            const totalTasks = emp._count.tasks || 1;
            const completionRate = Math.round((completedTasks.length / totalTasks) * 100);

            const onTimeTasks = completedTasks.filter(t => new Date(t.updatedAt) <= new Date(t.deadline));
            const onTimeRate = completedTasks.length > 0
                ? Math.round((onTimeTasks.length / completedTasks.length) * 100)
                : 100;

            return {
                id: emp.id,
                name: emp.name,
                role: emp.role,
                department: emp.department || 'General',
                completionRate,
                onTimeRate,
                activeCount: totalTasks - completedTasks.length
            };
        });

        const avgEmployeeCompletion = Math.round(employeeKPIs.reduce((acc, curr) => acc + curr.completionRate, 0) / (employeeKPIs.length || 1));

        // Group by Department (or Role if Dept is missing)
        const departmentStats: Record<string, { total: number; sumCompletion: number }> = {};
        employeeKPIs.forEach(emp => {
            const key = emp.department === 'General' ? emp.role : emp.department;
            if (!departmentStats[key]) departmentStats[key] = { total: 0, sumCompletion: 0 };
            departmentStats[key].total += 1;
            departmentStats[key].sumCompletion += emp.completionRate;
        });

        const departmentPulse = Object.entries(departmentStats).map(([name, stats]) => ({
            name,
            avgEfficiency: Math.round(stats.sumCompletion / stats.total),
            headcount: stats.total
        })).sort((a, b) => b.avgEfficiency - a.avgEfficiency);


        // 2. Project KPIs & Financials
        const projects = await prisma.project.findMany({
            where: {
                ...(targetProjectIds ? { id: { in: targetProjectIds } } : {})
            },
            include: {
                tasks: { select: { status: true } },
                issues: { select: { severity: true, status: true } },
                expenses: { where: { status: 'APPROVED' }, select: { amount: true } },
                _count: { select: { dailyReports: true } }
            }
        });

        let totalSpent = 0;

        const projectKPIs = projects.map(p => {
            const totalTasks = p.tasks.length || 1;
            const doneTasks = p.tasks.filter(t => t.status === 'DONE').length;
            const progress = Math.round((doneTasks / totalTasks) * 100);

            const openIssues = p.issues.filter(i => i.status !== 'CLOSED');
            const riskScore = openIssues.length * 10
                + (p.status === 'INITIATION' ? 0 : 0)
                + (openIssues.some(i => i.severity === 'CRITICAL') ? 50 : 0);

            // Financials per project
            const spent = p.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

            totalSpent += spent;

            return {
                id: p.id,
                name: p.name,
                progress,
                riskScore,
                issueCount: openIssues.length,
                spent
            };
        });

        // 3. Strategic Risks (Critical/High Issues)
        const criticalIssues = await prisma.issue.findMany({
            where: {
                status: { not: 'CLOSED' },
                severity: { in: ['CRITICAL', 'HIGH'] },
                ...(targetProjectIds ? { projectId: { in: targetProjectIds } } : {})
            },
            include: {
                project: { select: { name: true } },
                space: { select: { name: true } }
            },
            orderBy: { severity: 'asc' },
            take: 5
        });

        const strategicRisks = criticalIssues.map(issue => ({
            id: issue.id,
            title: issue.title,
            severity: issue.severity,
            source: issue.project?.name || issue.space?.name || 'General',
            daysOpen: issue.daysOpen
        }));


        // 4. Task KPIs (Global/Team)
        const allTasks = await prisma.task.findMany({
            where: {
                OR: [
                    targetUserIds ? { userId: { in: targetUserIds } } : {},
                    targetProjectIds ? { projectId: { in: targetProjectIds } } : {}
                ]
            },
            select: { status: true, priority: true, deadline: true, createdAt: true, updatedAt: true }
        });

        const totalTasksGlobal = allTasks.length;
        const completedGlobal = allTasks.filter(t => t.status === 'DONE').length;
        const overdueGlobal = allTasks.filter(t => t.status !== 'DONE' && new Date(t.deadline) < new Date()).length;

        // Avg Resolution Time (in days)
        const resolutionTimes = allTasks
            .filter(t => t.status === 'DONE')
            .map(t => (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 3600 * 24));
        const avgResolutionTime = resolutionTimes.length > 0
            ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
            : 0;

        // 5. Team KPIs (Velocity)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const velocity = allTasks.filter(t =>
            t.status === 'DONE' && new Date(t.updatedAt) >= sevenDaysAgo
        ).length;

        // Construct Response
        return NextResponse.json({
            employees: {
                avgCompletion: avgEmployeeCompletion,
                topPerformers: employeeKPIs.sort((a, b) => b.completionRate - a.completionRate).slice(0, 5),
                list: employeeKPIs
            },
            projects: {
                total: projects.length,
                avgRisk: Math.round(projectKPIs.reduce((acc, curr) => acc + curr.riskScore, 0) / (projectKPIs.length || 1)),
                list: projectKPIs.sort((a, b) => b.riskScore - a.riskScore)
            },
            tasks: {
                total: totalTasksGlobal,
                completed: completedGlobal,
                completionRate: Math.round((completedGlobal / (totalTasksGlobal || 1)) * 100),
                overdue: overdueGlobal,
                avgResolutionTime: avgResolutionTime.toFixed(1)
            },
            team: {
                velocity,
                activeIssues: projects.reduce((acc, curr) => acc + curr._count.dailyReports, 0)
            },
            // NEW SECTIONS
            risks: strategicRisks,
            departments: departmentPulse,
            financials: {
                totalSpent
            }
        });

    } catch (error) {
        console.error('Failed to fetch KPI report:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
