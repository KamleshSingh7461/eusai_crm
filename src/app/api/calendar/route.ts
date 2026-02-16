import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from 'googleapis';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("📅 Calendar API: GET request received");
        const session = await getServerSession(authOptions);
        console.log("📅 Calendar API: Session check:", !!session);

        if (!session || !session.user) {
            console.error("📅 Calendar API: Unauthorized - No session");
            const err = { error: 'Unauthorized', code: 'NO_SESSION' };
            console.log("📅 Calendar API: Returning 401:", err);
            return NextResponse.json(err, { status: 401 });
        }

        const userId = (session.user as any).id;
        console.log(`📅 Calendar API: User ID ${userId}`);

        if (!prisma) {
            console.error("📅 Calendar API: Prisma client not initialized");
            return NextResponse.json({ error: 'Internal Server Error', details: 'Database client not available' }, { status: 500 });
        }

        const account = await (prisma as any).account.findFirst({
            where: {
                userId: userId,
                provider: 'google',
            },
        });

        if (!account) {
            console.error(`📅 Calendar API: No Google account found for user ${userId}`);
            return NextResponse.json({
                error: 'OAuth Error',
                details: 'No Google account linked. Please sign in with Google to use calendar features.',
                code: 'NO_GOOGLE_ACCOUNT'
            }, { status: 403 });
        }

        if (!account.access_token) {
            console.error(`📅 Calendar API: Missing access token for user ${userId}`);
            return NextResponse.json({
                error: 'OAuth Error',
                details: 'Missing access token. Please re-login to grant calendar permissions.',
                code: 'NO_ACCESS_TOKEN'
            }, { status: 403 });
        }

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            console.error("📅 Calendar API: Missing Google Client ID or Secret in environment variables");
            return NextResponse.json({
                error: 'Configuration Error',
                details: 'Google OAuth credentials are missing in the server environment.'
            }, { status: 500 });
        }

        console.log("📅 Calendar API: Initializing Google Auth...");
        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        auth.setCredentials({
            access_token: account.access_token,
            refresh_token: account.refresh_token,
        });

        console.log("📅 Calendar API: Fetching events from Google...");
        const calendar = google.calendar({ version: 'v3', auth });

        const now = new Date();
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        console.log(`📅 Calendar API: Successfully fetched ${response.data.items?.length || 0} events`);

        const events = response.data.items?.map((event: any) => ({
            id: event.id,
            summary: event.summary || 'Untitled Meeting',
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            location: event.location,
            htmlLink: event.htmlLink,
        })) || [];

        console.log(`📅 Calendar API: Returning ${events.length} events`);
        return NextResponse.json(events);
    } catch (error: any) {
        console.error('🔴 Google Calendar API Fatal Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
