import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user as any;

    try {
        let whereClause: any = {};

        if (role === 'DIRECTOR' || role === 'MANAGER') {
            // View all tasks
            whereClause = {};
        } else if (role === 'TEAM_LEADER') {
            // View own tasks AND tasks assigned to subordinates
            // First, find subordinates
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { subordinates: true }
            }) as any;

            const subordinateIds = user?.subordinates?.map((s: any) => s.id) || [];

            whereClause = {
                OR: [
                    { userId: userId },             // Assigned to me
                    { userId: { in: subordinateIds } } // Assigned to my team
                ]
            };
        } else {
            // Employee/Intern: View only assigned tasks
            whereClause = { userId: userId };
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            include: {
                assignedTo: {
                    select: { id: true, name: true, image: true, email: true }
                },
                project: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Analytical Meta for Managers/Directors
        let meta = null;
        if (role === 'DIRECTOR' || role === 'MANAGER' || role === 'TEAM_LEADER') {
            const now = new Date();
            const workload: any = {};
            const projects: any = {};
            let overdue = 0;
            let highPriority = 0;
            let completed = 0;

            tasks.forEach((task: any) => {
                // Workload per user
                const assigneeId = task.userId || 'unassigned';
                const assigneeName = task.assignedTo?.name || 'Unassigned';
                if (!workload[assigneeId]) {
                    workload[assigneeId] = { name: assigneeName, count: 0, completed: 0, overdue: 0 };
                }
                workload[assigneeId].count++;
                if (task.status === 'DONE') {
                    workload[assigneeId].completed++;
                    completed++;
                } else if (new Date(task.deadline) < now) {
                    workload[assigneeId].overdue++;
                    overdue++;
                }

                if (task.priority === 3 && task.status !== 'DONE') highPriority++;

                // Project distribution
                const projId = task.projectId || 'none';
                const projName = task.project?.name || 'No Project';
                if (!projects[projId]) projects[projId] = { name: projName, count: 0 };
                projects[projId].count++;
            });

            meta = {
                health: {
                    total: tasks.length,
                    completed,
                    overdue,
                    highPriority,
                    velocity: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
                },
                workload: Object.values(workload),
                projects: Object.values(projects)
            };
        }

        return NextResponse.json({ tasks, meta });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = session.user as any;

    // Only authorized roles can create tasks
    if (!['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { title, description, deadline, priority, projectId, project, assignedToId, status } = body;

        // Handle "project" string (legacy) vs "projectId"
        // If projectId is missing but 'project' name is given, we might need logic or just enforce projectId.
        // For now, let's assume projectId is passed.

        const newTask = await prisma.task.create({
            data: {
                title,
                description,
                deadline: new Date(deadline),
                priority: parseInt(priority) || 1, // Ensure int
                projectId: projectId, // This ties it to a project
                userId: assignedToId, // This assigns it to a user
                status: status || 'TODO'
            }
        });

        return NextResponse.json(newTask);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
