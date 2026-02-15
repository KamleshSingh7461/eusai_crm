const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    const spaceId = "d5e6608e-b78b-47dd-8602-f16a2bf88d99";
    console.log(`Seeding data for Space: ${spaceId}`);

    try {
        // 1. Create Projects
        const p1 = await prisma.project.create({
            data: {
                name: "Q1 University Outreach",
                description: "Expansion into Tier 2 city engineering colleges.",
                status: "EXECUTION",
                budget: 500000,
                startDate: new Date("2026-01-01"),
                endDate: new Date("2026-03-31"),
                spaceId: spaceId
            }
        });

        const p2 = await prisma.project.create({
            data: {
                name: "MOU Renewal Drive",
                description: "Review and renew 15 existing agreements.",
                status: "PLANNING",
                budget: 150000,
                startDate: new Date("2026-02-15"),
                endDate: new Date("2026-05-30"),
                spaceId: spaceId
            }
        });

        // 2. Create Resources (Personnel)
        await prisma.resource.createMany({
            data: [
                { name: "John Doe", type: "PERSONNEL", role: "PARTNERSHIP LEAD", spaceId: spaceId },
                { name: "Sarah Smith", type: "PERSONNEL", role: "RELATIONSHIP MGR", spaceId: spaceId },
                { name: "Tech Lab Kit A", type: "EQUIPMENT", spaceId: spaceId }
            ]
        });

        // 3. Create Wiki Pages
        await prisma.wikiPage.createMany({
            data: [
                { title: "Standard MOU Template 2026", content: "Guidelines for new university partnerships.", spaceId: spaceId },
                { title: "Engagement SOP", content: "Step by step guide for university events.", spaceId: spaceId }
            ]
        });

        // 4. Create Milestones
        await prisma.milestone.createMany({
            data: [
                { title: "10 MOU Signings", dueDate: new Date("2026-03-15"), status: "IN_PROGRESS", projectId: p1.id, spaceId: spaceId },
                { title: "Vendor Audit", dueDate: new Date("2026-04-01"), status: "PENDING", projectId: p2.id, spaceId: spaceId }
            ]
        });

        console.log("Seeding complete! Refresh your dashboard.");
    } catch (error) {
        console.error("Seeding Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
