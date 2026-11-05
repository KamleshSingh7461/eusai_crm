import { PrismaClient } from '@prisma/client'

// Realistic demo organization for local testing: people, departments, projects, six months of history.
// Deterministic (seeded random) so every developer gets the same data. Runs once (marker project).

const MARKER = 'Demo: Mumbai University Partnership'

let seed = 42
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]
const between = (min: number, max: number) => Math.floor(min + rand() * (max - min + 1))
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5)
const daysAhead = (n: number) => new Date(Date.now() + n * 864e5)
const midnight = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }

const PEOPLE = [
    ['priya.sharma', 'Priya Sharma', 'TEAM_LEADER'], ['rahul.kapoor', 'Rahul Kapoor', 'EMPLOYEE'],
    ['ananya.iyer', 'Ananya Iyer', 'MANAGER'], ['vikram.singh', 'Vikram Singh', 'INTERN'],
    ['neha.verma', 'Neha Verma', 'EMPLOYEE'], ['arjun.mehta', 'Arjun Mehta', 'EMPLOYEE'],
    ['kavya.nair', 'Kavya Nair', 'TEAM_LEADER'], ['rohan.das', 'Rohan Das', 'EMPLOYEE'],
    ['isha.patel', 'Isha Patel', 'EMPLOYEE'], ['aditya.rao', 'Aditya Rao', 'INTERN'],
] as const

const UNIVERSITIES = [
    ['University of Mumbai', 'Mumbai', 'PARTNER'], ['Delhi University', 'New Delhi', 'PARTNER'],
    ['Savitribai Phule Pune University', 'Pune', 'PROSPECT'], ['Anna University', 'Chennai', 'PARTNER'],
    ['Jadavpur University', 'Kolkata', 'PROSPECT'], ['Christ University', 'Bengaluru', 'PROSPECT'],
    ['Osmania University', 'Hyderabad', 'INACTIVE'], ['Amity University', 'Noida', 'PARTNER'],
] as const

const TASK_TITLES = [
    'Draft MOU for review', 'Call the sports department head', 'Prepare merchandise catalogue', 'Collect logo approval signatures',
    'Update partner contact sheet', 'Schedule campus visit', 'Send revised proposal', 'Follow up on pending invoice',
    'Design jersey mock-ups', 'Compile weekly outreach numbers', 'Book venue for spirit week', 'Review vendor quotation',
    'Upload signed agreement', 'Coordinate with student council', 'Prepare demo for the dean', 'Reconcile business orders',
]

export async function seedDemoData(prisma: PrismaClient, ids: { director: string; manager: string; teamLeader: string; employee: string; intern: string; spaceId: string }) {
    if (await prisma.project.findFirst({ where: { name: MARKER } })) {
        console.log('ℹ️  Demo data already present')
        return
    }
    console.log('🎬 Adding demo organization…')

    // People: reporting into the seeded manager / team leaders
    const people: { id: string; role: string }[] = []
    for (const [handle, name, role] of PEOPLE) {
        const managerId = role === 'MANAGER' ? ids.director : role === 'TEAM_LEADER' ? ids.manager : pick([ids.teamLeader, ...people.filter(p => p.role === 'TEAM_LEADER').map(p => p.id)])
        const user = await prisma.user.upsert({
            where: { email: `${handle}@eusaiteam.com` },
            update: {},
            create: {
                email: `${handle}@eusaiteam.com`, name, role,
                lastLogin: daysAgo(between(0, 6)), isOnline: rand() > 0.6,
                reportingManagers: { connect: [{ id: managerId }] },
            },
        })
        people.push({ id: user.id, role })
    }
    const staff = [ids.employee, ids.intern, ids.teamLeader, ...people.filter(p => !['MANAGER'].includes(p.role)).map(p => p.id)]
    const ananya = people.find(p => p.role === 'MANAGER')!.id

    // Departments
    const departments = await Promise.all([
        ['Partnerships', '#3B82F6', ids.manager], ['Merchandise', '#F472B6', ananya], ['Sports Branding', '#34D399', ananya],
    ].map(([name, color, managerId]) => prisma.space.create({
        data: {
            name, color, type: 'DEPARTMENT', managerId, description: `${name} team at EUSAI.`,
            members: { connect: staff.filter(() => rand() > 0.45).map(id => ({ id })) },
        },
    })))
    const allSpaceIds = [ids.spaceId, ...departments.map(d => d.id)]

    // Universities
    const universities = await Promise.all(UNIVERSITIES.map(([name, location, status]) => prisma.university.create({
        data: { name, location, status, contactPerson: 'Registrar office', email: `contact@${name.split(' ')[0].toLowerCase()}.edu.in` },
    })))

    // Projects
    const projectDefs = [
        [MARKER, 'EXECUTION', 0], ['Delhi University Spirit Week', 'EXECUTION', 1], ['Merchandise Store Launch', 'PLANNING', 1],
        ['Sports Logo Programme 2026', 'MONITORING', 2], ['Southern Region Outreach', 'INITIATION', 0],
    ] as const
    const projects = await Promise.all(projectDefs.map(([name, status, dept], i) => prisma.project.create({
        data: {
            name, status, description: `${name}: demo project.`, budget: between(2, 12) * 100000,
            startDate: daysAgo(between(60, 170)), endDate: daysAhead(between(30, 160)),
            spaceId: departments[dept].id,
            managers: { connect: [{ id: i % 2 ? ananya : ids.manager }] },
        },
    })))

    // Tasks spread over six months, with realistic completion dates
    const statuses = ['DONE', 'DONE', 'DONE', 'IN_PROGRESS', 'REVIEW', 'TODO']
    for (let i = 0; i < 70; i++) {
        const status = pick(statuses)
        const age = between(0, 175)
        const deadline = status === 'DONE' ? daysAgo(age - between(0, 5)) : rand() > 0.75 ? daysAgo(between(1, 10)) : daysAhead(between(1, 30))
        await prisma.task.create({
            data: {
                title: pick(TASK_TITLES), status, priority: between(1, 3), deadline,
                description: 'Demo task.',
                userId: pick(staff), projectId: pick(projects).id,
                createdAt: daysAgo(age + 3), updatedAt: status === 'DONE' ? daysAgo(age) : daysAgo(between(0, 5)),
            },
        })
    }

    // Milestones with business orders
    const categories = ['MOU', 'SPORTS_LOGO', 'BUSINESS_ORDER', 'EUSAI_AGREEMENT']
    for (let i = 0; i < 18; i++) {
        const status = pick(['COMPLETED', 'IN_PROGRESS', 'IN_PROGRESS', 'PENDING', 'DELAYED'])
        const uni = pick(universities)
        const milestone = await prisma.milestone.create({
            data: {
                title: `${pick(['MOU', 'Logo approval', 'Spirit merchandise', 'Agreement'])}: ${uni.name}`,
                category: pick(categories), status, priority: pick(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
                progress: status === 'COMPLETED' ? 100 : between(10, 85),
                targetDate: status === 'DELAYED' ? daysAgo(between(2, 20)) : daysAhead(between(-30, 60)),
                completedDate: status === 'COMPLETED' ? daysAgo(between(1, 120)) : null,
                owner: pick(staff), projectId: pick(projects).id, universityId: uni.id, spaceId: pick(allSpaceIds),
                isFlagged: rand() > 0.85,
            },
        })
        if (rand() > 0.5) {
            await prisma.businessOrder.create({
                data: {
                    title: `${pick(['Jerseys', 'Spirit kits', 'Outgoing packages'])} order`, amount: between(25, 400) * 1000,
                    status: pick(['PAID', 'PENDING']), universityId: uni.id, universityName: uni.name, milestoneId: milestone.id,
                    orderType: pick(['School Spirit', 'Outgoing Packages', 'Merchandise Jersey']),
                },
            })
        }
    }

    // Issues
    for (let i = 0; i < 9; i++) {
        const status = pick(['OPEN', 'OPEN', 'RESOLVING', 'RESOLVED'])
        await prisma.issue.create({
            data: {
                title: pick(['Vendor delivery delayed', 'Logo files rejected', 'Payment not received', 'Venue booking clash', 'Contract clause dispute']),
                severity: pick(['CRITICAL', 'HIGH', 'MEDIUM', 'MEDIUM', 'LOW']), status,
                projectId: pick(projects).id, reporterId: pick(staff), assignedToId: pick([ids.manager, ananya, ids.teamLeader]),
                resolution: status === 'RESOLVED' ? 'Resolved with the vendor.' : null,
                createdAt: daysAgo(between(1, 40)),
            },
        })
    }

    // Daily reports for the last 21 days (some people skip days; nobody has reported today yet)
    for (const userId of staff) {
        for (let d = 1; d <= 21; d++) {
            const date = midnight(daysAgo(d))
            if (date.getDay() === 0 || rand() < 0.18) continue
            await prisma.dailyReport.create({
                data: {
                    userId, date, hoursWorked: between(5, 9), tasksCompleted: between(0, 4),
                    accomplishments: 'Followed up with partner universities and updated the tracker.',
                    challenges: rand() > 0.7 ? 'Waiting on approvals.' : null, tomorrowPlan: 'Continue outreach.',
                    submittedAt: new Date(date.getTime() + between(17, 23) * 3600e3),
                },
            }).catch(() => { })
        }
        // weekly reports with scores for the performance pages
        for (let w = 1; w <= 4; w++) {
            const start = midnight(daysAgo(w * 7 + 6))
            await prisma.weeklyReport.create({
                data: {
                    userId, weekStartDate: start, weekEndDate: daysAgo(w * 7), totalTasksCompleted: between(3, 15),
                    totalHoursWorked: between(30, 48), keyAccomplishments: 'Closed partner follow-ups.', performanceScore: between(55, 98),
                },
            }).catch(() => { })
        }
    }

    // Expenses awaiting approval
    for (let i = 0; i < 6; i++) {
        await prisma.expense.create({
            data: {
                amount: between(8, 60) * 100, category: pick(['TRAVEL', 'SERVICES', 'HARDWARE']), status: pick(['PENDING', 'PENDING', 'APPROVED']),
                description: pick(['Cab to campus visit', 'Printing brochures', 'Courier for signed MOU', 'Team lunch with dean office']),
                userId: pick(staff), projectId: pick(projects).id, date: daysAgo(between(0, 14)),
            },
        })
    }

    // Meetings and notifications
    for (let i = 0; i < 5; i++) {
        const start = daysAhead(between(0, 10))
        start.setHours(between(10, 17), 0, 0, 0)
        await prisma.meeting.create({
            data: {
                title: pick(['Weekly partnerships sync', 'Review with Mumbai University', 'Merchandise planning', 'Logo approvals stand-up']),
                startTime: start, endTime: new Date(start.getTime() + 45 * 60e3), location: pick(['Online', 'Office']),
                organizerId: pick([ids.director, ids.manager, ananya]), attendees: { connect: staff.slice(0, 4).map(id => ({ id })) },
            },
        })
    }
    for (const userId of [ids.director, ids.manager, ids.teamLeader, ids.employee]) {
        await prisma.notification.createMany({
            data: [
                { userId, title: 'New task assigned', message: 'Prepare merchandise catalogue', type: 'INFO', link: '/tasks' },
                { userId, title: 'Milestone completed', message: 'MOU: University of Mumbai', type: 'SUCCESS', link: '/milestones' },
                { userId, title: 'Report reminder', message: 'Submit today’s daily report before 11:59 PM IST', type: 'WARNING', link: '/reports/submit' },
            ],
        })
    }

    console.log(`✅ Demo organization: ${people.length} people, ${departments.length} departments, ${projects.length} projects, 70 tasks, 18 milestones`)
}
