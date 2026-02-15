// Email Service using SendGrid
// Install: npm install @sendgrid/mail

import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key from environment
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
}

export class EmailService {
    private static FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@eusai.com';

    /**
     * Send a generic email
     */
    static async send(options: EmailOptions): Promise<boolean> {
        try {
            const msg: any = {
                to: options.to,
                from: options.from || EmailService.FROM_EMAIL,
                subject: options.subject,
                text: options.text || '',
                html: options.html || options.text || '',
            };

            await sgMail.send(msg);
            console.log('Email sent successfully to:', options.to);
            return true;
        } catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }

    /**
     * Notify director about pending daily reports
     */
    static async notifyDirectorPendingReports(directorEmail: string, pendingEmployees: string[]): Promise<boolean> {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #0052CC 0%, #0747A6 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">EUSAI TEAM</h1>
                    <p style="color: #DEEBFF; margin: 10px 0 0 0;">Daily Report Notification</p>
                </div>
                <div style="padding: 30px; background: #FAFBFC;">
                    <h2 style="color: #172B4D; margin-top: 0;">Pending Daily Reports</h2>
                    <p style="color: #6B778C; line-height: 1.6;">
                        The following employees have not yet submitted their daily reports for ${new Date().toLocaleDateString()}:
                    </p>
                    <ul style="color: #172B4D; line-height: 2;">
                        ${pendingEmployees.map(emp => `<li>${emp}</li>`).join('')}
                    </ul>
                    <p style="color: #6B778C; margin-top: 20px;">
                        Total pending: <strong>${pendingEmployees.length}</strong>
                    </p>
                </div>
                <div style="padding: 20px; text-align: center; color: #6B778C; font-size: 12px;">
                    © ${new Date().getFullYear()} EUSAI TEAM. All rights reserved.
                </div>
            </div>
        `;

        return this.send({
            to: directorEmail,
            subject: `Daily Report Alert: ${pendingEmployees.length} Pending Submissions`,
            html
        });
    }

    /**
     * Send weekly summary report to director
     */
    static async sendWeeklySummary(directorEmail: string, summary: any): Promise<boolean> {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #36B37E 0%, #00875A 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">📊 Weekly Performance Report</h1>
                    <p style="color: #E3FCEF; margin: 10px 0 0 0;">Week of ${summary.weekStart} - ${summary.weekEnd}</p>
                </div>
                <div style="padding: 30px; background: #FAFBFC;">
                    <h2 style="color: #172B4D;">Team Performance Summary</h2>
                    <div style="background: white; border: 1px solid #DFE1E6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <p style="color: #6B778C; margin: 0 0 10px 0;">Total Tasks Completed:</p>
                        <h3 style="color: #0052CC; margin: 0; font-size: 32px;">${summary.totalTasks}</h3>
                    </div>
                    <div style="background: white; border: 1px solid #DFE1E6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <p style="color: #6B778C; margin: 0 0 10px 0;">Total Hours Worked:</p>
                        <h3 style="color: #36B37E; margin: 0; font-size: 32px;">${summary.totalHours} hrs</h3>
                    </div>
                    <div style="background: white; border: 1px solid #DFE1E6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <p style="color: #6B778C; margin: 0 0 10px 0;">Team Average Performance:</p>
                        <h3 style="color: #FFAB00; margin: 0; font-size: 32px;">${summary.avgPerformance}/100</h3>
                    </div>
                    <h3 style="color: #172B4D; margin-top: 30px;">Top Performers 🏆</h3>
                    <ol style="color: #172B4D; line-height: 2;">
                        ${summary.topPerformers.map((p: any, i: number) =>
            `<li><strong>${p.name}</strong> - ${p.score} points</li>`
        ).join('')}
                    </ol>
                </div>
                <div style="padding: 20px; text-align: center; color: #6B778C; font-size: 12px;">
                    © ${new Date().getFullYear()} EUSAI TEAM. All rights reserved.
                </div>
            </div>
        `;

        return this.send({
            to: directorEmail,
            subject: `Weekly Team Report: ${summary.weekStart} - ${summary.weekEnd}`,
            html
        });
    }

    /**
     * Send milestone achievement notification
     */
    static async notifyMilestoneAchieved(recipients: string[], milestone: any): Promise<boolean> {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #FFAB00 0%, #FF991F 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🎯 Milestone Achieved!</h1>
                </div>
                <div style="padding: 30px; background: #FAFBFC;">
                    <h2 style="color: #172B4D;">${milestone.title}</h2>
                    <p style="color: #6B778C; line-height: 1.6;">${milestone.description}</p>
                    <div style="background: white; border: 1px solid #DFE1E6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <p style="color: #6B778C; margin: 0;">Category: <strong>${milestone.category}</strong></p>
                        <p style="color: #6B778C; margin: 10px 0 0 0;">Completed: <strong>${new Date(milestone.completedDate).toLocaleDateString()}</strong></p>
                    </div>
                    <p style="color: #36B37E; font-weight: bold; text-align: center; font-size: 18px;">
                        Congratulations to the team! 🎉
                    </p>
                </div>
                <div style="padding: 20px; text-align: center; color: #6B778C; font-size: 12px;">
                    © ${new Date().getFullYear()} EUSAI TEAM. All rights reserved.
                </div>
            </div>
        `;

        return this.send({
            to: recipients,
            subject: `🎯 Milestone Achieved: ${milestone.title}`,
            html
        });
    }
}
