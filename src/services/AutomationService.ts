import prisma from "@/lib/prisma";

export type AutomationEvent = 'PROJECT_CREATED' | 'PROJECT_UPDATED' | 'TASK_COMPLETED';

export class AutomationService {
    static async trigger(event: AutomationEvent, payload: any) {
        console.log(`[AutomationService] Triggering event: ${event}`);

        try {
            const webhooks = await (prisma.webhook as any).findMany({
                where: { event, isActive: true }
            });

            const deliveries = webhooks.map(async (webhook: any) => {
                try {
                    const response = await fetch(webhook.url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            event,
                            timestamp: new Date().toISOString(),
                            data: payload
                        })
                    });

                    if (!response.ok) {
                        console.error(`[AutomationService] Failed delivery to ${webhook.url}: ${response.statusText}`);
                    } else {
                        console.log(`[AutomationService] Successful delivery to ${webhook.url}`);
                    }
                } catch (err) {
                    console.error(`[AutomationService] Error delivering to ${webhook.url}:`, err);
                }
            });

            await Promise.allSettled(deliveries);
        } catch (error) {
            console.error('[AutomationService] Error fetching webhooks:', error);
        }
    }
}
