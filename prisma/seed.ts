import { PrismaClient } from '@prisma/client'
import { seedDemoData } from './demo-data'
import { seedDemoCompanies } from './demo-companies'

// Seeds a small, realistic org for local/staging. Idempotent: safe to re-run.
if (process.env.APP_ENV === 'production') {
    console.error('✖ Refusing to seed a production database.')
    process.exit(1)
}

const prisma = new PrismaClient()

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)

async function upsertUser(email: string, name: string, role: string, managerIds: string[] = []) {
    return prisma.user.upsert({
        where: { email },
        update: { role },
        create: {
            email,
            name,
            role,
            reportingManagers: { connect: managerIds.map(id => ({ id })) }
        }
    })
}

async function main() {
    console.log('🌱 Starting seed...')

    // 1. One user per role, wired into a reporting chain
    const director = await upsertUser('admin@eusaiteam.com', 'Admin Director', 'DIRECTOR')
    await upsertUser('management@eusaiteam.com', 'Read-only Management', 'MANAGEMENT')
    const manager = await upsertUser('manager@eusaiteam.com', 'Sample Manager', 'MANAGER', [director.id])
    const teamLeader = await upsertUser('teamlead@eusaiteam.com', 'Sample Team Leader', 'TEAM_LEADER', [manager.id])
    const employee = await upsertUser('employee@eusaiteam.com', 'Sample Employee', 'EMPLOYEE', [teamLeader.id])
    const intern = await upsertUser('intern@eusaiteam.com', 'Sample Intern', 'INTERN', [teamLeader.id])
    console.log('✅ Seeded users for every role')

    // Your own Google account, so you can actually sign in (login is Google-only)
    const ownEmail = process.env.SEED_DIRECTOR_EMAIL?.trim().toLowerCase()
    if (ownEmail) {
        await upsertUser(ownEmail, ownEmail.split('@')[0], 'DIRECTOR')
        console.log(`✅ ${ownEmail} is a DIRECTOR`)
    } else {
        console.log('ℹ️  Set SEED_DIRECTOR_EMAIL in your env file to sign in with your own Google account')
    }

    // 2. Department (space) with members
    let space = await prisma.space.findFirst({ where: { name: 'Sample Department' } })
    if (!space) {
        space = await prisma.space.create({
            data: {
                name: 'Sample Department',
                description: 'Seeded department for local testing.',
                type: 'DEPARTMENT',
                managerId: manager.id,
                members: { connect: [teamLeader, employee, intern].map(u => ({ id: u.id })) }
            }
        })
        console.log(`✅ Seeded Space: ${space.name}`)
    }

    // 3. Project
    let project = await prisma.project.findFirst({ where: { name: 'Local Development Initiative' } })
    if (!project) {
        project = await prisma.project.create({
            data: {
                name: 'Local Development Initiative',
                description: 'A sandbox project for testing local database functionality.',
                status: 'EXECUTION',
                startDate: new Date(),
                endDate: daysFromNow(180),
                budget: 0,
                spaceId: space.id,
                managers: { connect: [{ id: manager.id }] }
            }
        })
        console.log(`✅ Seeded Project: ${project.name}`)
    }

    // 4. Milestone
    const milestoneTitle = 'Initial local DB Setup Complete'
    if (!await prisma.milestone.findFirst({ where: { title: milestoneTitle, projectId: project.id } })) {
        await prisma.milestone.create({
            data: {
                title: milestoneTitle,
                description: 'Finalize and verify the local environment sync.',
                status: 'PENDING',
                priority: 'HIGH',
                category: 'CUSTOM',
                targetDate: daysFromNow(7),
                projectId: project.id,
                spaceId: space.id,
                owner: employee.id
            }
        })
        console.log(`✅ Seeded Milestone: ${milestoneTitle}`)
    }

    // 5. Tasks
    const tasks = [
        { title: 'Verify Project Backlog Display', status: 'TODO', priority: 3, deadline: daysFromNow(2), userId: employee.id },
        { title: 'Submit first daily report', status: 'IN_PROGRESS', priority: 2, deadline: daysFromNow(1), userId: intern.id },
        { title: 'Review team milestones', status: 'TODO', priority: 2, deadline: daysFromNow(3), userId: teamLeader.id },
    ]
    for (const task of tasks) {
        if (!await prisma.task.findFirst({ where: { title: task.title, projectId: project.id } })) {
            await prisma.task.create({ data: { ...task, projectId: project.id } })
            console.log(`✅ Seeded Task: ${task.title}`)
        }
    }

    // Demo organization (people, departments, six months of history). Local only, or SEED_DEMO=1.
    if (process.env.APP_ENV === 'local' || process.env.SEED_DEMO === '1') {
        await seedDemoData(prisma, { director: director.id, manager: manager.id, teamLeader: teamLeader.id, employee: employee.id, intern: intern.id, spaceId: space.id })
        await seedDemoCompanies(prisma)
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
