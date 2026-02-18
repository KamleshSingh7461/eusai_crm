
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    try {
        const milestones = await prisma.milestone.findMany({
            take: 1,
            include: {
                university: { select: { name: true } }
            }
        })
        console.log('Successfully fetched milestones:', milestones)
    } catch (e) {
        console.error('Failed to fetch milestones:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
