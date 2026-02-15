
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Testing Team Query...')

    try {
        // 1. Fetch Users requesting managerId selection
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                managerId: true, // Explicitly selecting managerId
                manager: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: [
                { role: 'asc' },
                { name: 'asc' } // Testing name sort
            ],
            take: 1
        });

        console.log('✅ Fetch Success:', users);

        // 2. Mock Update (if user exists)
        if (users.length > 0) {
            const user = users[0];
            console.log(`Testing Update for user ${user.email}...`);

            // We just update name to the same value to test the typings/runtime
            const updated = await prisma.user.update({
                where: { id: user.id },
                data: {
                    name: user.name,
                    managerId: user.managerId // Updating managerId
                }
            });
            console.log('✅ Update Success:', updated);
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
