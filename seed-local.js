const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
    console.log("Seeding local database...");
    
    // 1. Create Admin (Director) User
    const hashedAdminPassword = await bcrypt.hash("admin123", 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@eusaiteam.com' },
        update: { password: hashedAdminPassword },
        create: {
            email: 'admin@eusaiteam.com',
            name: 'EUSAI TEAM',
            password: hashedAdminPassword,
            role: 'DIRECTOR',
            isOnline: true
        }
    });
    console.log("✅ Director user seeded: admin@eusaiteam.com");

    // 2. Create Default Space
    const space = await prisma.space.upsert({
        where: { id: "d5e6608e-b78b-47dd-8602-f16a2bf88d99" },
        update: {},
        create: {
            id: "d5e6608e-b78b-47dd-8602-f16a2bf88d99",
            name: "University Relations",
            description: "Default department space for university partnerships",
            color: "#0052CC",
            managerId: adminUser.id
        }
    });
    console.log("✅ Default space created:", space.name);

    // 3. Create Manager User: kamlesh@alumniindia.com
    const hashedManagerPassword = await bcrypt.hash("manager123", 10);
    const managerUser = await prisma.user.upsert({
        where: { email: 'kamlesh@alumniindia.com' },
        update: { 
            role: 'MANAGER',
            password: hashedManagerPassword,
            name: 'Kamlesh Singh'
        },
        create: {
            email: 'kamlesh@alumniindia.com',
            name: 'Kamlesh Singh',
            password: hashedManagerPassword,
            role: 'MANAGER',
            department: 'University Relations',
            reportingManagers: {
                connect: { id: adminUser.id }
            },
            memberSpaces: {
                connect: { id: space.id }
            }
        }
    });
    console.log("✅ Manager user seeded: kamlesh@alumniindia.com");

    // 4. Create Management User: infotech@eusaiteam.com
    const hashedMgmtPassword = await bcrypt.hash("mgmt123", 10);
    const mgmtUser = await prisma.user.upsert({
        where: { email: 'infotech@eusaiteam.com' },
        update: {
            role: 'MANAGEMENT',
            password: hashedMgmtPassword,
            name: 'EUSAI Infotech Management'
        },
        create: {
            email: 'infotech@eusaiteam.com',
            name: 'EUSAI Infotech Management',
            password: hashedMgmtPassword,
            role: 'MANAGEMENT',
            department: 'Executive Management',
            isOnline: true
        }
    });
    console.log("✅ Management user seeded: infotech@eusaiteam.com");

    console.log("Local database seeding completed successfully!");
}

seed()
    .catch(e => console.error("Seeding error:", e))
    .finally(async () => await prisma.$disconnect());
