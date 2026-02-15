import prisma from '@/lib/prisma';
import dbConnect from '@/lib/mongodb';
import { Activity } from '@/models/MongoModels';

export class ReportingService {
    static async generateProjectSummary(projectId: string) {
        // 1. Get relational data
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { tasks: true, resources: true }
        });

        if (!project) throw new Error('Project not found');

        // 2. Get activity logs from NoSQL
        await dbConnect();
        const activities = await Activity.find({ projectId }).sort({ timestamp: -1 }).limit(10);

        // 3. Calculate metrics
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter((t: any) => t.status === 'DONE').length;
        const velocity = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        const budgetUsed = project.resources.reduce((acc: number, res: any) => acc + Number(res.hourlyRate), 0); // Mock logic

        return {
            projectName: project.name,
            status: project.status,
            metrics: {
                velocity: `${velocity.toFixed(1)}%`,
                budgetUsed: `$${budgetUsed.toLocaleString()}`,
                resourcesCount: project.resources.length,
                tasksRemaining: totalTasks - completedTasks
            },
            recentActivities: activities.map(a => ({
                action: a.action,
                time: a.timestamp
            }))
        };
    }

    static async saveReport(projectId: string, type: string, content: any) {
        return await prisma.report.create({
            data: {
                projectId,
                type,
                content: content as any,
            }
        });
    }
}
