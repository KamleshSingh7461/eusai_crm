import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const subscription = await request.json();

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        // Save subscription to database
        // Use upsert to avoid duplicates for the same endpoint
        await prisma.pushSubscription.upsert({
            where: {
                endpoint: subscription.endpoint,
            },
            update: {
                userId: userId,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
            create: {
                userId: userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving push subscription:", error);
        return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }
}
