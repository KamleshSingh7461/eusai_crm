import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // Find the first user in the database (likely the one just logged in)
    const firstUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' }
    });

    if (firstUser) {
        console.log(`👤 Found user: ${firstUser.email}`);

        // Update role to DIRECTOR
        const updatedUser = await prisma.user.update({
            where: { id: firstUser.id },
            data: { role: 'DIRECTOR' }
        });

        console.log(`✅ Promoted ${updatedUser.email} to DIRECTOR`);
    } else {
        console.log('⚠️ No users found in database. Please log in first.');
    }

    console.log('🌱 Seed finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
