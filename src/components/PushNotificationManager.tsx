"use client";

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function PushNotificationManager() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setPermission(Notification.permission);
            checkSubscription();
        } else {
            setLoading(false);
        }
    }, []);

    const checkSubscription = async () => {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
        setLoading(false);
    };

    const subscribeToPush = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered');

            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                const subscribeOptions = {
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(
                        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
                    )
                };

                const subscription = await registration.pushManager.subscribe(subscribeOptions);
                
                await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(subscription),
                });

                setIsSubscribed(true);
            }
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const unsubscribeFromPush = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                // Optionally notify backend to remove subscription
                setIsSubscribed(false);
            }
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            {isSubscribed ? (
                <button
                    onClick={unsubscribeFromPush}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold hover:bg-green-500/20 transition-all"
                    title="Push Notifications Active"
                >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Push Active</span>
                </button>
            ) : (
                <button
                    onClick={subscribeToPush}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 border border-white/10 text-xs font-bold hover:bg-white/10 hover:text-white transition-all"
                    title="Enable Push Notifications"
                >
                    <BellOff className="w-3.5 h-3.5" />
                    <span>Enable Push</span>
                </button>
            )}
        </div>
    );
}
