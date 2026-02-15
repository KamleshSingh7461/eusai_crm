import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// This endpoint should be secured with a secret in production
// e.g. check for Authorization: Bearer process.env.CRON_SECRET

export async function GET(request: NextRequest) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Get all Employees/Interns
        const employees = await prisma.user.findMany({
            where: {
                role: { in: ['EMPLOYEE', 'INTERN'] },
                // Active users only (status check could be added here)
            },
            select: { id: true, email: true, name: true, flagCount: true }
        });

        // 2. Get today's reports
        const reports = await prisma.dailyReport.findMany({
            where: {
                date: today
            },
            select: { userId: true }
        });

        const reportedUserIds = new Set(reports.map(r => r.userId));
        const missingReporters = employees.filter(e => !reportedUserIds.has(e.id));

        // 3. Process missing reporters
        const results = [];
        for (const user of missingReporters) {
            // Increment flag count
            // Note: flagCount field needs to be added to schema first.
            // Attempting to update if schema allows, else skip update but send email.

            try {
                // This will fail if migration hasn't run yet, so wrapping in try/catch for safety during dev
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        flagCount: { increment: 1 },
                        lastFlaggedAt: new Date()
                    }
                });
            } catch (dberr) {
                console.warn(`Could not update flag count for ${user.email} (Schema mismatch?)`);
            }

            // Send Email
            if (user.email) {
                // In real app, use a nice HTML template
                const sent = await sendEmail(
                    user.email,
                    'URGENT: Daily Report Not Submitted',
                    `<p>Hi ${user.name},</p>
                     <p>You have not submitted your daily report for <strong>${today.toLocaleDateString()}</strong>.</p>
                     <p>Please submit it immediately. Your account has been flagged for non-compliance.</p>
                     <p>Regards,<br/>EUSAI Team</p>`
                );
                results.push({ email: user.email, sent });
            }
        }

        return NextResponse.json({
            totalEmployees: employees.length,
            reportsSubmitted: reports.length,
            missing: missingReporters.length,
            actions: results
        });

    } catch (error) {
        console.error("Cron Job Failed:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
