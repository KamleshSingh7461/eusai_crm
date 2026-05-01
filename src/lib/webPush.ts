import webpush from 'web-push';
import prisma from './prisma';

const vapidKeys = {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
    webpush.setVapidDetails(
        'mailto:admin@eusaiteam.com',
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );
}

export async function sendPushNotification(userId: string, payload: { title: string; body: string; url?: string }) {
    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId }
        });

        if (subscriptions.length === 0) {
            return { success: false, reason: 'No subscriptions found' };
        }

        const pushPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || '/'
        });

        const results = await Promise.all(subscriptions.map(async (sub) => {
            try {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                };
                await webpush.sendNotification(pushSubscription, pushPayload);
                return { endpoint: sub.endpoint, success: true };
            } catch (error: any) {
                console.error(`Error sending push to endpoint ${sub.endpoint}:`, error);
                if (error.statusCode === 410 || error.statusCode === 404) {
                    // Subscription has expired or is no longer valid, delete it
                    await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
                }
                return { endpoint: sub.endpoint, success: false, error: error.message };
            }
        }));

        return { success: true, results };
    } catch (error) {
        console.error('Failed to send push notifications:', error);
        return { success: false, error };
    }
}
