import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session.user as any).role;

        // Ensure only Directors can access full organization activity
        if (role !== 'DIRECTOR') {
            return NextResponse.json({ error: 'Forbidden. Director access required.' }, { status: 403 });
        }

        // Fetch user activity data, excluding super admin if necessary
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                lastLogin: true,
                isOnline: true,
            },
            orderBy: {
                lastLogin: 'desc'
            }
        });

        // Current time to manually track expiration safely
        const now = new Date();
        const activeTimeoutMs = 15 * 60 * 1000; // Define active as logged in last 15 min 

        // Enhance data map to determine true "Online" presence
        const activityData = users.map(user => {
            let isCurrentlyOnline = false;

            if (user.lastLogin) {
                const timeDiff = now.getTime() - new Date(user.lastLogin).getTime();
                if (timeDiff < activeTimeoutMs) {
                    isCurrentlyOnline = true;
                }
            }

            return {
                ...user,
                isOnline: isCurrentlyOnline, // Override static DB field with dynamic calculation
                lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null
            };
        });

        return NextResponse.json({
            count: activityData.length,
            onlineCount: activityData.filter(u => u.isOnline).length,
            activity: activityData
        });
    } catch (error: any) {
        console.error('Failed to retrieve user activity data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
