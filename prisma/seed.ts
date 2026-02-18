import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // 1. Create/Upsert Users
    const adminDirector = await prisma.user.upsert({
        where: { email: 'admin@eusaiteam.com' },
        update: { role: 'DIRECTOR' },
        create: {
            email: 'admin@eusaiteam.com',
            name: 'Admin Director',
            role: 'DIRECTOR'
        }
    });
    console.log(`✅ Seeded Director: ${adminDirector.email}`);

    const pranavDirector = await prisma.user.upsert({
        where: { email: 'pranav@eusaiteam.com' },
        update: { role: 'DIRECTOR' },
        create: {
            email: 'pranav@eusaiteam.com',
            name: 'Pranav Director',
            role: 'DIRECTOR'
        }
    });
    console.log(`✅ Seeded Director: ${pranavDirector.email}`);

    const employee = await prisma.user.upsert({
        where: { email: 'infotech@eusaiteam.com' },
        update: { role: 'EMPLOYEE' },
        create: {
            email: 'infotech@eusaiteam.com',
            name: 'InfoTech Employee',
            role: 'EMPLOYEE'
        }
    });
    console.log(`✅ Seeded Employee: ${employee.email}`);

    // 2. Create Project (Owned by Director)
    let project = await prisma.project.findFirst({
        where: { name: 'Local Development Initiative' }
    });

    if (!project) {
        project = await prisma.project.create({
            data: {
                name: 'Local Development Initiative',
                description: 'A sandbox project for testing local database functionality.',
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
                budget: 0,
                managerId: adminDirector.id
            }
        });
        console.log(`✅ Seeded Project: ${project.name}`);
    } else {
        console.log(`ℹ️ Project already exists: ${project.name}`);
    }

    // 3. Create Milestone for the Project
    let milestone = await prisma.milestone.findFirst({
        where: {
            title: 'Initial local DB Setup Complete',
            projectId: project.id
        }
    });

    if (!milestone) {
        milestone = await prisma.milestone.create({
            data: {
                title: 'Initial local DB Setup Complete',
                description: 'Finalize and verify the local environment sync.',
                status: 'PENDING',
                priority: 'HIGH',
                targetDate: new Date(new Date().setDate(new Date().getDate() + 7)),
                projectId: project.id,
                owner: employee.id,
                category: 'CUSTOM'
            }
        });
        console.log(`✅ Seeded Milestone: ${milestone.title}`);
    } else {
        console.log(`ℹ️ Milestone already exists: ${milestone.title}`);
    }

    // 4. Create Tasks for the Employee
    const tasks = [
        {
            title: 'Register Local Account',
            description: 'Create a local login to verify registration flow.',
            status: 'TODO',
            priority: 3,
            deadline: new Date(new Date().setDate(new Date().getDate() + 2)),
        },
        {
            title: 'Verify Project Backlog Display',
            description: 'Ensure the new project mission backlog shows the seeded tasks.',
            status: 'TODO',
            priority: 2,
            deadline: new Date(new Date().setDate(new Date().getDate() + 3)),
        }
    ];

    for (const taskData of tasks) {
        const existingTask = await prisma.task.findFirst({
            where: {
                title: taskData.title,
                projectId: project.id,
                userId: employee.id
            }
        });

        if (!existingTask) {
            await prisma.task.create({
                data: {
                    ...taskData,
                    projectId: project.id,
                    userId: employee.id
                }
            });
            console.log(`✅ Seeded Task: ${taskData.title}`);
        } else {
            console.log(`ℹ️ Task already exists: ${taskData.title}`);
        }
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
