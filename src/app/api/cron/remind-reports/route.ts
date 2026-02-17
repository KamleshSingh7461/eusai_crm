import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET(request: NextRequest) {
    // 1. Security Check
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Day Check (Skip Sat/Sun)
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Allow forcing via ?force=true for testing
    const force = searchParams.get('force') === 'true';

    if ((day === 0 || day === 6) && !force) {
        return NextResponse.json({ message: 'Weekend - No reports required.' });
    }

    try {
        // 3. Fetch Target Users
        const employees = await prisma.user.findMany({
            where: {
                role: { in: ['EMPLOYEE', 'INTERN'] },
                // optional: active status check if exists
            },
            select: { id: true, name: true, email: true }
        });

        // 4. Fetch Today's Reports
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const todaysReports = await prisma.dailyReport.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            select: { userId: true }
        });

        const submittedUserIds = new Set(todaysReports.map(r => r.userId));

        // 5. Identify Non-Submitters
        const nonSubmitters = employees.filter(user => !submittedUserIds.has(user.id));

        // 6. Send Alerts
        const results = [];
        for (const user of nonSubmitters) {
            if (!user.email) continue;

            const emailHtml = `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #fdc9c9; border-radius: 8px; background-color: #fff5f5;">
                    <h2 style="color: #c53030;">Action Required: Daily Report Missing</h2>
                    <p>Hi ${user.name},</p>
                    <p>This is a reminder that your <strong>Daily Report</strong> for today (${now.toLocaleDateString()}) has not been submitted yet.</p>
                    <p>Please submit it immediately to ensure accurate tracking.</p>
                    <br/>
                    <a href="${process.env.NEXTAUTH_URL}/reports/submit" style="background-color: #c53030; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Submit Report Now</a>
                    <br/><br/>
                    <small style="color: #888;">Deadline: 6:30 PM</small>
                </div>
            `;

            const sent = await sendEmail({
                to: user.email,
                subject: '[Alert] Daily Report Missing',
                html: emailHtml
            });

            results.push({ userId: user.id, email: user.email, sent });
        }

        return NextResponse.json({
            success: true,
            totalEmployees: employees.length,
            submittedCount: submittedUserIds.size,
            missingCount: nonSubmitters.length,
            alertsSent: results.length,
            details: results
        });

    } catch (error: any) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
