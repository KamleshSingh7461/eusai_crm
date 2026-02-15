const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const spaceId = "d5e6608e-b78b-47dd-8602-f16a2bf88d99";
    console.log(`Analyzing Space: ${spaceId}`);

    try {
        const projectCount = await prisma.project.count({ where: { spaceId } });
        const resourceCount = await prisma.resource.count({ where: { spaceId } });
        const milestoneCount = await prisma.milestone.count({ where: { spaceId } });
        const issueCount = await prisma.issue.count({ where: { spaceId } });

        console.log(`Real Counts in DB for this Space:`);
        console.log(`- Projects: ${projectCount}`);
        console.log(`- Resources: ${resourceCount}`);
        console.log(`- Milestones: ${milestoneCount}`);
        console.log(`- Issues: ${issueCount}`);

        if (projectCount === 0) {
            console.log("\nNo projects linked. Checking for unlinked projects...");
            const unlinkedProjects = await prisma.project.count({ where: { spaceId: null } });
            console.log(`Found ${unlinkedProjects} projects globally that are NOT linked to any space.`);
        }

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
