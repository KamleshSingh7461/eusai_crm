import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from 'googleapis';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // 1. Fetch Local Meetings
        const localMeetings = await prisma.meeting.findMany({
            where: {
                OR: [
                    { organizerId: userId },
                    { attendees: { some: { id: userId } } }
                ]
            },
            include: {
                organizer: { select: { name: true, image: true } },
                attendees: { select: { name: true, image: true } }
            },
            orderBy: { startTime: 'asc' }
        });

        // 2. Fetch Google Calendar Events (if linked)
        let googleEvents: any[] = [];
        try {
            const account = await prisma.account.findFirst({
                where: { userId, provider: 'google' }
            });

            if (account?.access_token && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
                const auth = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET
                );
                auth.setCredentials({ access_token: account.access_token, refresh_token: account.refresh_token });
                const calendar = google.calendar({ version: 'v3', auth });

                const response = await calendar.events.list({
                    calendarId: 'primary',
                    timeMin: new Date().toISOString(),
                    maxResults: 10,
                    singleEvents: true,
                    orderBy: 'startTime',
                });

                googleEvents = response.data.items?.map((event: any) => ({
                    id: event.id,
                    title: event.summary || 'Untitled Meeting',
                    startTime: event.start?.dateTime || event.start?.date,
                    endTime: event.end?.dateTime || event.end?.date,
                    location: event.location,
                    meetingLink: event.htmlLink,
                    source: 'GOOGLE',
                    description: event.description
                })) || [];
            }
        } catch (error) {
            console.warn("Google Calendar fetch failed:", error);
            // Continue with just local events if google fails
        }

        // 3. Merge and Sort
        const allEvents = [
            ...localMeetings.map(m => ({ ...m, source: 'LOCAL' })),
            ...googleEvents
        ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        return NextResponse.json(allEvents);

    } catch (error: any) {
        console.error('Calendar API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, date, time, duration, description, type } = body;

        // Construct start and end times
        const startDate = new Date(`${date}T${time}`);
        const endDate = new Date(startDate.getTime() + (parseInt(duration) * 60000));

        const meeting = await prisma.meeting.create({
            data: {
                title,
                description,
                startTime: startDate,
                endTime: endDate,
                organizerId: (session.user as any).id,
                location: type === 'remote' ? 'Online' : 'Office',
                // Add current user as attendee by default
                attendees: {
                    connect: { id: (session.user as any).id }
                }
            }
        });

        return NextResponse.json(meeting);

    } catch (error: any) {
        console.error('Create Meeting Error:', error);
        return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
    }
}
