import { PrismaClient } from '@prisma/client'

// Demo details for the group companies, for local development only. Real details are entered on the live
// server's Companies page. The values pass the CIN/GSTIN format checks but can't belong to a real company:
// CINs use state code ZZ and GSTINs use state code 00, neither of which exists. Phone numbers are all zeros.
//
// Safe to re-run: a company's details are only filled in while its CIN is empty, so anything typed on the
// Companies page is never overwritten. Demo staff only get employment details if they have no employee ID yet.

const COMPANIES = [
    {
        code: 'AC', legalName: 'Alumni Connect India Private Limited', emailDomains: ['alumniindia.com'],
        brandColor: '#0F6E56', cin: 'U80301ZZ2018PTC000101', gstin: '00AABCA0101A1Z5',
        registeredAddress: 'Demo address: 101 Example Tower, Sector 1, Demo City 110001',
        verifyDomain: 'verify.alumniindia.com',
    },
    {
        code: 'FGSN', legalName: 'Freedom Global Sports Network Private Limited', emailDomains: ['fgsnlive.com'],
        brandColor: '#993C1D', cin: 'U92490ZZ2019PTC000202', gstin: '00AABCF0202B1Z5',
        registeredAddress: 'Demo address: 202 Example Arena Road, Demo City 400001',
        verifyDomain: 'verify.fgsnlive.com',
    },
    {
        code: 'WS', legalName: 'Wyldcard Stats Private Limited', emailDomains: [] as string[],
        brandColor: '#3C3489', cin: 'U72200ZZ2021PTC000303', gstin: '00AABCW0303C1Z5',
        registeredAddress: 'Demo address: 303 Example Data Park, Demo City 560001',
        // .test is reserved for testing, so this can never point at someone else's site
        verifyDomain: 'verify.wyldcard.test',
    },
    {
        code: 'EUSAI', legalName: 'EUSAI Team Private Limited', emailDomains: ['eusaiteam.com'],
        brandColor: '#0C447C', cin: 'U74999ZZ2020PTC000404', gstin: '00AABCE0404D1Z5',
        registeredAddress: 'Demo address: 404 Example Business Centre, Demo City 110020',
        verifyDomain: 'verify.eusaiteam.com',
    },
    {
        code: 'TTF', legalName: 'Trenz Team Fibre Private Limited', emailDomains: ['teamfibreinc.com'],
        brandColor: '#27500A', cin: 'U17299ZZ2022PTC000505', gstin: '00AABCT0505E1Z5',
        registeredAddress: 'Demo address: 505 Example Industrial Estate, Demo City 380001',
        verifyDomain: 'verify.teamfibreinc.com',
    },
]

// demo staff spread across the companies so lists, filters and (later) cards show every brand
const STAFF: { email: string; code: string; designation: string; joined: string }[] = [
    { email: 'employee@eusaiteam.com', code: 'EUSAI', designation: 'Partnerships associate', joined: '2026-01-19' },
    { email: 'manager@eusaiteam.com', code: 'EUSAI', designation: 'Operations manager', joined: '2023-04-03' },
    { email: 'teamlead@eusaiteam.com', code: 'EUSAI', designation: 'Team leader, partnerships', joined: '2024-01-15' },
    { email: 'intern@eusaiteam.com', code: 'EUSAI', designation: 'Intern, marketing', joined: '2026-07-01' },
    { email: 'priya.sharma@eusaiteam.com', code: 'AC', designation: 'Alumni relations lead', joined: '2022-08-08' },
    { email: 'rahul.kapoor@eusaiteam.com', code: 'AC', designation: 'Community associate', joined: '2025-02-17' },
    { email: 'ananya.iyer@eusaiteam.com', code: 'FGSN', designation: 'Broadcast manager', joined: '2021-11-01' },
    { email: 'vikram.singh@eusaiteam.com', code: 'FGSN', designation: 'Intern, production', joined: '2026-06-02' },
    { email: 'neha.verma@eusaiteam.com', code: 'WS', designation: 'Data analyst', joined: '2024-09-09' },
    { email: 'kavya.nair@eusaiteam.com', code: 'WS', designation: 'Analytics team leader', joined: '2023-05-22' },
    { email: 'rohan.das@eusaiteam.com', code: 'TTF', designation: 'Field engineer', joined: '2025-10-06' },
    { email: 'isha.patel@eusaiteam.com', code: 'TTF', designation: 'Project coordinator', joined: '2024-03-11' },
]

export async function seedDemoCompanies(prisma: PrismaClient) {
    for (const c of COMPANIES) {
        const domain = c.emailDomains[0]
        const details = {
            cin: c.cin, gstin: c.gstin, registeredAddress: c.registeredAddress, brandColor: c.brandColor,
            verifyDomain: c.verifyDomain, website: domain ? `www.${domain}` : null,
            hrEmail: domain ? `hr@${domain}` : 'hr@wyldcard.test', hrPhone: '+91 00000 00000',
            signatoryName: 'Demo Signatory', signatoryTitle: 'Director',
        }
        const existing = await prisma.company.findUnique({ where: { code: c.code } })
        if (!existing) {
            await prisma.company.create({ data: { code: c.code, legalName: c.legalName, emailDomains: c.emailDomains, ...details } })
        } else if (!existing.cin) {
            await prisma.company.update({ where: { id: existing.id }, data: details })
        }
    }
    console.log('✅ Demo company details')

    let issued = 0
    for (const s of STAFF) {
        const person = await prisma.user.findUnique({ where: { email: s.email }, select: { id: true, employeeCode: true } })
        if (!person || person.employeeCode) continue
        const joined = new Date(`${s.joined}T00:00:00.000Z`)
        await prisma.$transaction(async tx => {
            const company = await tx.company.update({
                where: { code: s.code },
                data: { nextEmployeeNumber: { increment: 1 } },
                select: { id: true, code: true, nextEmployeeNumber: true },
            })
            const n = company.nextEmployeeNumber - 1
            await tx.user.update({
                where: { id: person.id },
                data: {
                    companyId: company.id, designation: s.designation, dateOfJoining: joined, employmentStatus: 'ACTIVE',
                    employeeCode: `${company.code}-${joined.getUTCFullYear()}-${String(n).padStart(4, '0')}`,
                },
            })
        })
        issued++
    }
    console.log(`✅ Demo employee IDs issued: ${issued}`)
}
