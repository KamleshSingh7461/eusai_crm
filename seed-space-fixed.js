const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    const spaceId = "d5e6608e-b78b-47dd-8602-f16a2bf88d99";
    console.log(`Starting Robust Seed for Space: ${spaceId}`);

    try {
        const adminUser = await prisma.user.findFirst({ where: { email: 'admin@eusaiteam.com' } });
        if (!adminUser) {
            console.error("Admin user not found. Please run this after a initial setup.");
            return;
        }
        const adminId = adminUser.id;

        // 1. Projects
        const p1 = await prisma.project.create({
            data: {
                name: "Tier-2 Outreach Campaign",
                description: "Focusing on MOU signings in rural engineering hubs.",
                status: "EXECUTION",
                budget: 450000,
                startDate: new Date("2026-01-10"),
                endDate: new Date("2026-04-15"),
                spaceId: spaceId
            }
        });

        const p2 = await prisma.project.create({
            data: {
                name: "Sports Scholarship Framework",
                description: "Standardizing EUSAI sports integration with state universities.",
                status: "PLANNING",
                budget: 120000,
                startDate: new Date("2026-02-01"),
                endDate: new Date("2026-06-30"),
                spaceId: spaceId
            }
        });

        // 2. Resources (Personnel & Tools)
        const resources = [
            { name: "Rajesh Kumar", type: "PERSONNEL", role: "SR. PARTNERSHIP MGR", hourlyRate: 45.0, spaceId: spaceId },
            { name: "Priya Sharma", type: "PERSONNEL", role: "LEGAL ANALYST", hourlyRate: 35.0, spaceId: spaceId },
            { name: "EUSAI CRM Mobile Hub", type: "TOOL", role: "HARDWARE", hourlyRate: 5.0, spaceId: spaceId }
        ];

        for (const r of resources) {
            await prisma.resource.create({ data: r });
        }

        // 3. Wiki Pages
        const wikiPages = [
            { title: "University Onboarding Playbook", content: "Comprehensive guide for first-time university visits.", authorId: adminId, spaceId: spaceId },
            { title: "Legal MOU Annexures", content: "Required documents for financial aid clauses.", authorId: adminId, spaceId: spaceId }
        ];

        for (const w of wikiPages) {
            await prisma.wikiPage.create({ data: w });
        }

        // 4. Issues
        const issues = [
            { title: "Delayed Legal Review (Jeppiaar)", owner: "Priya Sharma", severity: "HIGH", spaceId: spaceId, projectId: p1.id },
            { title: "Missing Mascot Assets", owner: "Design Team", severity: "LOW", spaceId: spaceId, projectId: p2.id }
        ];

        for (const i of issues) {
            await prisma.issue.create({ data: i });
        }

        console.log("SUCCESS: Space 'University Relations' now has real data linked.");
    } catch (error) {
        console.error("SEED FAIL:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
