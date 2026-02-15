const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking Database for Spaces...");
    try {
        const spaces = await prisma.space.findMany();
        console.log(`Found ${spaces.length} spaces.`);
        spaces.forEach(s => {
            console.log(`- ID: ${s.id}, Name: ${s.name}`);
        });
    } catch (error) {
        console.error("Error accessing Space table:", error.message);
        if (error.message.includes("does not exist")) {
            console.log("HINT: You might need to run 'prisma db push' or 'prisma generate'.");
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
