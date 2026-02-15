export class NotificationService {
    static async send(message: string, channels: ('SLACK' | 'TEAMS' | 'EMAIL')[]) {
        // Simulated integrations
        console.log(`[Notification Service] Dispatching to ${channels.join(', ')}: ${message}`);

        const results = await Promise.all(channels.map(async (channel) => {
            // In a real app, this would use Axios/Fetch to Hit Webhooks or SMTP
            return { channel, sent: true, timestamp: new Date() };
        }));

        return results;
    }

    static async alertDeadline(projectName: string, taskTitle: string, dueDate: Date) {
        const msg = `🚨 DEADLINE ALERT: Task "${taskTitle}" for project "${projectName}" is due on ${dueDate.toLocaleDateString()}.`;
        return this.send(msg, ['SLACK', 'EMAIL']);
    }

    static async alertEscalation(projectName: string, issue: string) {
        const msg = `⚠️ ESCALATION: High-risk issue detected in "${projectName}": ${issue}`;
        return this.send(msg, ['TEAMS', 'SLACK']);
    }
}
