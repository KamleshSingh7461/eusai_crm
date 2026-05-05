import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
            : null;

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('FCM_INITIALIZED: Firebase Admin SDK ready.');
        } else {
            console.warn('FCM_WARNING: No service account found. Push notifications will be restricted to Web.');
        }
    } catch (error) {
        console.error('FCM_INIT_ERROR:', error);
    }
}

export async function sendFcmNotification(tokens: string[], payload: { title: string; body: string; data?: any }) {
    if (!admin.apps.length || tokens.length === 0) return;

    try {
        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
            tokens: tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`FCM_BROADCAST: Successfully sent ${response.successCount} messages.`);
        
        // Handle invalid tokens
        if (response.failureCount > 0) {
            // Note: In production, you'd want to remove invalid tokens from the DB here
        }
        
        return response;
    } catch (error) {
        console.error('FCM_SEND_ERROR:', error);
        throw error;
    }
}
