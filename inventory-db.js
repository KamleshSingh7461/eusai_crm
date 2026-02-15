const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Global Data Inventory:");
    try {
        const totalProjects = await prisma.project.count();
        const totalResources = await prisma.resource.count();
        const totalMilestones = await prisma.milestone.count();
        const totalIssues = await prisma.issue.count();
        const totalTasks = await prisma.task.count();
        const totalUniversities = await prisma.university.count();

        console.log(`- Total Projects: ${totalProjects}`);
        console.log(`- Total Resources: ${totalResources}`);
        console.log(`- Total Milestones: ${totalMilestones}`);
        console.log(`- Total Issues: ${totalIssues}`);
        console.log(`- Total Tasks: ${totalTasks}`);
        console.log(`- Total Universities: ${totalUniversities}`);

    } catch (error) {
        console.error("Error inventorying data:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
