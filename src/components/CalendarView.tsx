
"use client";

import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';

interface CalendarEvent {
    id: string;
    summary: string;
    start: string;
    end: string;
    location?: string;
    htmlLink: string;
}

export default function CalendarView() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Diagnostic Ping
                const pingRes = await fetch('/api/ping');
                const pingData = await pingRes.json().catch(() => ({ error: 'Ping failed' }));
                console.log("📅 Calendar API: Connectivity Test (Ping):", pingData);

                const response = await fetch('/api/calendar');
                if (response.ok) {
                    const data = await response.json();
                    setEvents(data);
                } else {
                    const status = response.status;
                    const contentType = response.headers.get("content-type");
                    const rawText = await response.text();

                    console.log(`📅 Calendar API Debug - Status: ${status}, Content-Type: ${contentType}`);
                    console.log(`📅 Calendar API Raw Response:`, rawText);

                    let errorData: any = { error: `Server error (${status})` };

                    if (contentType && contentType.includes("application/json")) {
                        try {
                            errorData = JSON.parse(rawText);
                        } catch (parseError) {
                            console.error("📅 Calendar API JSON Parse Error:", parseError);
                        }
                    }

                    console.error("Failed to fetch calendar events:", errorData);
                    setError(errorData.details || errorData.error || "Could not load calendar events. You may need to re-login to grant permissions.");
                }
            } catch (error) {
                console.error('Failed to fetch calendar events', error);
                setError("Network error loading calendar.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading calendar events...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg border border-red-100">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{error}</p>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-200">
                <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-gray-900 font-medium">No Upcoming Events</h3>
                <p className="text-gray-500 text-sm">Your calendar is clear for the near future.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-[#172B4D] flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#0052CC]" />
                Upcoming Meetings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => (
                    <a
                        key={event.id}
                        href={event.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="block p-4 bg-white rounded-lg border border-[#DFE1E6] hover:border-[#0052CC] hover:shadow-sm transition-all group"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-[#172B4D] group-hover:text-[#0052CC] line-clamp-2">
                                {event.summary}
                            </h4>
                        </div>

                        <div className="space-y-1.5 text-sm text-[#6B778C]">
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                    {new Date(event.start).toLocaleString(undefined, {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: 'numeric'
                                    })}
                                </span>
                            </div>
                            {event.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="truncate">{event.location}</span>
                                </div>
                            )}
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
