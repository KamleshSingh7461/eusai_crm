import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from 'googleapis';
import prisma from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// Helper to generate realistic Google Meet format links (e.g. meet.google.com/srf-hzui-nir)
function generateGoogleMeetLink() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const randStr = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `https://meet.google.com/${randStr(3)}-${randStr(4)}-${randStr(3)}`;
}

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
                organizer: { select: { id: true, name: true, email: true, image: true, role: true } },
                attendees: { select: { id: true, name: true, email: true, image: true, role: true } }
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
                    location: event.location || 'Google Meet',
                    meetingLink: event.hangoutLink || event.htmlLink,
                    source: 'GOOGLE',
                    description: event.description,
                    attendees: event.attendees?.map((a: any) => ({ name: a.displayName || a.email, email: a.email })) || []
                })) || [];
            }
        } catch (error) {
            console.warn("Google Calendar fetch failed:", error);
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

        const userId = (session.user as any).id;
        const body = await req.json();

        const {
            title,
            date,
            time,
            endDate: customEndDate,
            endTime: customEndTime,
            duration,
            description,
            location,
            meetingLink: providedMeetingLink,
            type,
            guestIds,
            isAllDay
        } = body;

        // Construct start and end dates
        let startDate: Date;
        let endDate: Date;

        if (isAllDay) {
            startDate = new Date(`${date}T00:00:00`);
            endDate = new Date(`${date}T23:59:59`);
        } else {
            startDate = new Date(`${date}T${time || '10:00'}`);
            if (customEndDate && customEndTime) {
                endDate = new Date(`${customEndDate}T${customEndTime}`);
            } else {
                const durationMins = parseInt(duration) || 60;
                endDate = new Date(startDate.getTime() + (durationMins * 60000));
            }
        }

        const autoMeetLink = (type === 'remote' || !location || location.toLowerCase().includes('google meet') || location.toLowerCase().includes('online'))
            ? (providedMeetingLink || generateGoogleMeetLink())
            : providedMeetingLink;

        const targetAttendees = Array.from(new Set([userId, ...(guestIds || [])]));

        const meeting = await prisma.meeting.create({
            data: {
                title: title || 'Untitled Meeting',
                description: description || null,
                startTime: startDate,
                endTime: endDate,
                organizerId: userId,
                location: location || (type === 'remote' ? 'Google Meet (Online)' : 'Office'),
                meetingLink: autoMeetLink,
                attendees: {
                    connect: targetAttendees.map(id => ({ id }))
                }
            },
            include: {
                organizer: { select: { id: true, name: true, email: true, image: true, role: true } },
                attendees: { select: { id: true, name: true, email: true, image: true, role: true } }
            }
        });

        // Notify invited guests in CRM
        if (guestIds && Array.isArray(guestIds)) {
            for (const guestId of guestIds) {
                if (guestId !== userId) {
                    await createNotification({
                        userId: guestId,
                        title: '📅 New Meeting Invitation',
                        message: `You have been invited to '${meeting.title}' on ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                        type: 'INFO',
                        link: '/meetings'
                    }).catch(e => console.error("Notification error:", e));
                }
            }
        }

        return NextResponse.json(meeting);

    } catch (error: any) {
        console.error('Create Meeting Error:', error);
        return NextResponse.json({ error: 'Failed to create meeting', details: error.message }, { status: 500 });
    }
}
