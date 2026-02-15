import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Fetch notifications for the logged-in user
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Fetch unread notifications first, then recent read ones, limit to 20
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Count unread
        const unreadCount = await prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}

// PATCH: Mark one or all notifications as read
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { id, markAll } = await request.json();

        if (markAll) {
            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true }
            });
            return NextResponse.json({ success: true, message: "All notifications marked as read" });
        }

        if (id) {
            // Check ownership
            const notification = await prisma.notification.findUnique({
                where: { id }
            });

            if (!notification || notification.userId !== userId) {
                return NextResponse.json({ error: "Notification not found or unauthorized" }, { status: 404 });
            }

            await prisma.notification.update({
                where: { id },
                data: { isRead: true }
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    } catch (error) {
        console.error("Error updating notification:", error);
        return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }
}

// DELETE: Clear all notifications or a specific one
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        const clearAll = url.searchParams.get("clearAll") === "true";

        if (clearAll) {
            await prisma.notification.deleteMany({
                where: { userId }
            });
            return NextResponse.json({ success: true, message: "All notifications cleared" });
        }

        if (id) {
            const notification = await prisma.notification.findUnique({
                where: { id }
            });

            if (!notification || notification.userId !== userId) {
                return NextResponse.json({ error: "Notification not found or unauthorized" }, { status: 404 });
            }

            await prisma.notification.delete({
                where: { id }
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    } catch (error) {
        console.error("Error deleting notification:", error);
        return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
    }
}
