import { sendPushNotification } from "@/lib/webPush";

export class NotificationService {
    static async send(userId: string, message: string, channels: ('SLACK' | 'TEAMS' | 'EMAIL' | 'WEB_PUSH')[]) {
        // Simulated integrations
        console.log(`[Notification Service] Dispatching to ${channels.join(', ')}: ${message}`);

        const results = await Promise.all(channels.map(async (channel) => {
            if (channel === 'WEB_PUSH' && userId) {
                await sendPushNotification(userId, {
                    title: 'System Notification',
                    body: message
                });
            }
            // In a real app, this would use Axios/Fetch to Hit Webhooks or SMTP
            return { channel, sent: true, timestamp: new Date() };
        }));

        return results;
    }

    static async alertDeadline(userId: string, projectName: string, taskTitle: string, dueDate: Date) {
        const msg = `🚨 DEADLINE ALERT: Task "${taskTitle}" for project "${projectName}" is due on ${dueDate.toLocaleDateString()}.`;
        return this.send(userId, msg, ['SLACK', 'EMAIL', 'WEB_PUSH']);
    }

    static async alertEscalation(userId: string, projectName: string, issue: string) {
        const msg = `⚠️ ESCALATION: High-risk issue detected in "${projectName}": ${issue}`;
        return this.send(userId, msg, ['TEAMS', 'SLACK', 'WEB_PUSH']);
    }
}
