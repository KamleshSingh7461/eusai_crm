import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getMobileSession } from '@/lib/auth-mobile';
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        let session = await getServerSession(authOptions);
        if (!session?.user) {
            session = await getMobileSession() as any;
        }

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { token, deviceType } = await request.json();

        if (!token) {
            return NextResponse.json({ error: "Token required" }, { status: 400 });
        }

        // Save or update the FCM token for this user
        await prisma.fcmToken.upsert({
            where: { token: token },
            update: {
                userId: userId,
                deviceType: deviceType,
                updatedAt: new Date(),
            },
            create: {
                token: token,
                userId: userId,
                deviceType: deviceType,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("FCM_SUBSCRIBE_POST", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
