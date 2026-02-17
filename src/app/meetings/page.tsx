"use client";

import { useState, useEffect } from 'react';
import { Calendar, Plus, Video, Clock, Users, ChevronRight, X, Loader2, MapPin, Link as LinkIcon, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

interface Meeting {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    location: string;
    meetingLink?: string;
    source: 'LOCAL' | 'GOOGLE';
    organizer?: { name: string; image?: string };
}

export default function MeetingsPage() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    // Default to EMPLOYEE view if role is missing/loading
    const userRole = (session?.user as any)?.role || 'EMPLOYEE';
    const isManagerOrAbove = ['DIRECTOR', 'MANAGER', 'TEAM_LEADER'].includes(userRole);

    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        duration: '30', // minutes
        description: '',
        type: 'remote' // remote | in-person
    });

    useEffect(() => {
        fetchMeetings();
    }, [session]);

    const fetchMeetings = async () => {
        try {
            const res = await fetch('/api/calendar');
            if (res.ok) {
                const data = await res.json();
                setMeetings(data);
            }
        } catch (error) {
            console.error("Failed to fetch meetings", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to create meeting');

            showToast('Meeting scheduled successfully!', 'success');
            setIsModalOpen(false);
            fetchMeetings();
            // Reset form
            setFormData({
                title: '',
                date: new Date().toISOString().split('T')[0],
                time: '10:00',
                duration: '30',
                description: '',
                type: 'remote'
            });
        } catch (error) {
            showToast('Failed to schedule meeting', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-heading mb-2 tracking-tight">Meetings</h1>
                    <p className="text-subheading text-base">
                        {isManagerOrAbove
                            ? "Manage team schedules and reviews"
                            : "Your upcoming meetings and standups"}
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="md"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setIsModalOpen(true)}
                >
                    Schedule Meeting
                </Button>
            </div>

            {/* Calendar Integration Notice */}
            <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm p-5 flex items-start gap-4 shadow-sm">
                <div className="p-2 bg-blue-500/10 rounded-sm">
                    <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-heading mb-1">Calendar Integration Active</h3>
                    <p className="text-xs text-body leading-relaxed max-w-2xl">
                        You can now schedule meetings directly. Google Calendar sync is also monitored.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Schedule (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold text-subheading uppercase tracking-wider">
                            {isManagerOrAbove ? "Team Schedule" : "My Schedule"}
                        </h2>
                        <button onClick={fetchMeetings} className="text-xs text-body hover:text-heading transition-colors">Refresh</button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-subheading" />
                        </div>
                    ) : meetings.length > 0 ? (
                        <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm overflow-hidden">
                            {meetings.map((meeting) => (
                                <div key={meeting.id} className="p-4 border-b border-[var(--notion-border-default)] last:border-0 hover:bg-[var(--notion-bg-tertiary)] transition-colors flex items-center justify-between group">
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center min-w-[50px] pt-1">
                                            <span className="text-xs font-bold text-subheading uppercase">
                                                {new Date(meeting.startTime).toLocaleDateString('en-US', { weekday: 'short' })}
                                            </span>
                                            <span className="text-lg font-bold text-heading">
                                                {new Date(meeting.startTime).getDate()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-heading mb-1">{meeting.title}</h3>
                                            <div className="flex items-center gap-3 text-xs text-subheading">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                    {new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {meeting.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {meeting.location}
                                                    </span>
                                                )}
                                                {meeting.source === 'GOOGLE' && (
                                                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-sm text-[10px]">Google</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {meeting.meetingLink && (
                                        <a
                                            href={meeting.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-[var(--notion-bg-hover)] rounded-sm text-blue-400"
                                            title="Join Meeting"
                                        >
                                            <Video className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm min-h-[300px] flex flex-col items-center justify-center p-8 text-center group">
                            <div className="w-16 h-16 bg-[var(--notion-bg-tertiary)] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Video className="w-8 h-8 text-body" />
                            </div>
                            <h3 className="text-heading font-semibold mb-2">No meetings scheduled</h3>
                            <p className="text-body text-sm mb-6 max-w-xs">
                                {isManagerOrAbove
                                    ? "Your team has a clear schedule. Great time for deep work or planning."
                                    : "You're all caught up! Enjoy some focus time."}
                            </p>
                            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
                                Schedule a meeting
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right Column: Templates & Quick Actions (1/3 width) */}
                <div className="space-y-6">
                    <h2 className="text-xs font-bold text-subheading uppercase tracking-wider">Quick Actions</h2>

                    <div className="space-y-3">
                        <MeetingTemplate
                            icon={<Users className="w-4 h-4" />}
                            title="Team Standup"
                            subtitle="Daily check-in"
                            color="blue"
                            onClick={() => {
                                setFormData({ ...formData, title: 'Team Standup', duration: '15' });
                                setIsModalOpen(true);
                            }}
                        />
                        <MeetingTemplate
                            icon={<Calendar className="w-4 h-4" />}
                            title="Project Review"
                            subtitle="Weekly sync"
                            color="green"
                            onClick={() => {
                                setFormData({ ...formData, title: 'Project Review', duration: '60' });
                                setIsModalOpen(true);
                            }}
                        />
                        <MeetingTemplate
                            icon={<Clock className="w-4 h-4" />}
                            title="1-on-1"
                            subtitle="Monthly feedback"
                            color="purple"
                            onClick={() => {
                                setFormData({ ...formData, title: '1-on-1', duration: '30' });
                                setIsModalOpen(true);
                            }}
                        />
                        {isManagerOrAbove && (
                            <MeetingTemplate
                                icon={<Video className="w-4 h-4" />}
                                title="Client Call"
                                subtitle="External meeting"
                                color="orange"
                                onClick={() => {
                                    setFormData({ ...formData, title: 'Client Call', duration: '45' });
                                    setIsModalOpen(true);
                                }}
                            />
                        )}
                    </div>

                    {/* Mini Role Notice */}
                    <div className="pt-4 border-t border-[var(--notion-border-default)]">
                        <div className="text-[10px] font-bold text-subheading uppercase mb-2">Viewing as</div>
                        <div className="flex items-center gap-2 text-xs text-heading px-2 py-1 bg-[var(--notion-bg-tertiary)] rounded-sm inline-block">
                            <div className={cn("w-1.5 h-1.5 rounded-full", isManagerOrAbove ? "bg-purple-500" : "bg-blue-500")} />
                            {userRole.replace('_', ' ')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Meeting Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--notion-border-default)]">
                            <h2 className="text-lg font-bold text-heading">Schedule Meeting</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-subheading hover:text-heading transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMeeting} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-subheading uppercase mb-1.5">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm px-3 py-2 text-sm text-heading focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    placeholder="e.g. Weekly Sync"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-subheading uppercase mb-1.5">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm px-3 py-2 text-sm text-heading focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-subheading uppercase mb-1.5">Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm px-3 py-2 text-sm text-heading focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-subheading uppercase mb-1.5">Duration (min)</label>
                                    <select
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                        className="w-full bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm px-3 py-2 text-sm text-heading focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    >
                                        <option value="15">15 minutes</option>
                                        <option value="30">30 minutes</option>
                                        <option value="45">45 minutes</option>
                                        <option value="60">1 hour</option>
                                        <option value="90">1.5 hours</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-subheading uppercase mb-1.5">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm px-3 py-2 text-sm text-heading focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    >
                                        <option value="remote">Remote (Online)</option>
                                        <option value="in-person">In Person</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-subheading uppercase mb-1.5">Description</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm px-3 py-2 text-sm text-heading focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                                    placeholder="Meeting agenda..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" isLoading={isSubmitting}>Schedule Meeting</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function MeetingTemplate({ icon, title, subtitle, color, onClick }: any) {
    const colorStyles: any = {
        blue: "text-blue-400 bg-blue-500/10 group-hover:bg-blue-500/20",
        green: "text-green-400 bg-green-500/10 group-hover:bg-green-500/20",
        purple: "text-purple-400 bg-purple-500/10 group-hover:bg-purple-500/20",
        orange: "text-orange-400 bg-orange-500/10 group-hover:bg-orange-500/20"
    };

    return (
        <div
            onClick={onClick}
            className="group flex items-center justify-between p-3 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm hover:bg-[var(--notion-bg-tertiary)] transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-[var(--notion-border-hover)]"
        >
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-sm transition-colors", colorStyles[color])}>
                    {icon}
                </div>
                <div>
                    <h3 className="font-semibold text-sm text-heading text-left">{title}</h3>
                    <p className="text-xs text-subheading text-left">{subtitle}</p>
                </div>
            </div>
            <ChevronRight className="w-4 h-4 text-body opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
        </div>
    );
}
