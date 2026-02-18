
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    try {
        // Simulate what happens for a MANAGER
        const userId = 'admin-id' // Just a placeholder
        const userRole = 'MANAGER'

        console.log('Testing role-based logic for:', userRole)

        const currentUser = await prisma.user.findFirst({
            where: { role: 'DIRECTOR' }, // Find someone who might have subordinates or just any user
            include: { subordinates: true }
        });

        if (!currentUser) {
            console.log('No user found to test subordinates logic.');
        } else {
            const subordinateIds = currentUser.subordinates?.map(u => u.id) || [];
            console.log('Found subordinates count:', subordinateIds.length);

            const milestones = await prisma.milestone.findMany({
                where: { owner: { in: [currentUser.id, ...subordinateIds] } }
            });
            console.log('Successfully fetched milestones for simulated role.');
        }

    } catch (e) {
        console.error('Failed role-based logic test:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
