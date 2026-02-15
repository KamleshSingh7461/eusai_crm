const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTeamFetch() {
    try {
        const teamMembers = await prisma.user.findMany({
            where: {
                role: { in: ['MANAGER', 'TEAM_LEADER', 'EMPLOYEE', 'INTERN'] }
            },
            select: { id: true, name: true, image: true, role: true }
        });
        console.log('Team members found:', teamMembers.length);
        console.log('Sample member:', teamMembers[0]);
    } catch (error) {
        console.error('Error fetching team:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTeamFetch();
