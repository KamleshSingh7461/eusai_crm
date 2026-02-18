
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    try {
        const userId = 'placeholder' // I don't have a real userId here for a raw script without session
        // Just test the queries used in the route
        const myMilestones = await prisma.milestone.findMany({
            take: 5,
            select: { status: true, category: true }
        });
        console.log('Successfully fetched milestones for dashboard:', myMilestones)

        const universityCount = await prisma.university.count({ where: { status: 'PROSPECT' } })
        console.log('University count:', universityCount)

    } catch (e) {
        console.error('Failed dashboard query test:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
