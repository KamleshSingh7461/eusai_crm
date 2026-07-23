"use client";

import { useState, useEffect } from 'react';
import {
    Calendar,
    Plus,
    Video,
    Clock,
    Users,
    ChevronRight,
    X,
    Loader2,
    MapPin,
    Link as LinkIcon,
    AlertCircle,
    Copy,
    Check,
    Bell,
    Globe,
    Lock,
    Eye,
    UserCheck,
    Sparkles,
    ChevronDown,
    ExternalLink,
    Search
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

interface MeetingAttendee {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    image?: string;
}

interface Meeting {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    location: string;
    meetingLink?: string;
    source: 'LOCAL' | 'GOOGLE';
    description?: string;
    organizer?: MeetingAttendee;
    attendees?: MeetingAttendee[];
}

interface UserOption {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
    department?: string;
}

export default function MeetingsPage() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const userRole = (session?.user as any)?.role || 'EMPLOYEE';
    const currentUser = session?.user as any;
    const isManagerOrAbove = ['DIRECTOR', 'MANAGEMENT', 'MANAGER', 'TEAM_LEADER'].includes(userRole);

    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [crmUsers, setCrmUsers] = useState<UserOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dropdown / Modal Controls
    const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isInstantMeetingModalOpen, setIsInstantMeetingModalOpen] = useState(false);
    const [createdInstantLink, setCreatedInstantLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');

    // Comprehensive Form State
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '17:00',
        endDate: new Date().toISOString().split('T')[0],
        endTime: '18:00',
        isAllDay: false,
        recurrence: 'Does not repeat',
        duration: '60',
        type: 'remote', // remote | in-person
        location: 'Google Meet',
        meetingLink: '',
        notification: '10', // minutes before
        visibility: 'DEFAULT', // DEFAULT | PUBLIC | PRIVATE
        status: 'BUSY', // BUSY | FREE
        description: '',
        selectedGuestIds: [] as string[],
        externalGuests: '',
        modifyEvent: false,
        inviteOthers: true,
        seeGuestList: true
    });

    useEffect(() => {
        fetchMeetings();
        fetchCrmUsers();
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

    const fetchCrmUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const users = await res.json();
                setCrmUsers(users);
            }
        } catch (error) {
            console.error("Failed to fetch CRM users for guests:", error);
        }
    };

    // Helper: Official Google Meet instant room URL
    const generateMeetLink = () => {
        return `https://meet.google.com/new`;
    };

    // Quick Action 1: Create a meeting for later
    const handleCreateForLater = async () => {
        const meetLink = "https://meet.google.com/new";
        setCreatedInstantLink(meetLink);
        setIsInstantMeetingModalOpen(true);
        setIsNewMenuOpen(false);

        // Log meeting to CRM
        try {
            await fetch('/api/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Scheduled Google Meet Session',
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                    duration: '60',
                    location: 'Google Meet',
                    meetingLink: meetLink,
                    type: 'remote',
                    description: `Google Meet Session (Launch via ${meetLink})`
                })
            });
            fetchMeetings();
        } catch (e) {
            console.error("Error logging instant meeting:", e);
        }
    };

    // Quick Action 2: Start an instant meeting
    const handleStartInstantMeeting = async () => {
        const meetLink = "https://meet.google.com/new";
        window.open(meetLink, '_blank', 'noopener,noreferrer');
        setIsNewMenuOpen(false);

        // Log to CRM
        try {
            await fetch('/api/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Instant Meeting (${currentUser?.name || 'Organizer'})`,
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                    duration: '60',
                    location: 'Google Meet (Live)',
                    meetingLink: meetLink,
                    type: 'remote',
                    description: 'Instant meeting launched from EUSAI CRM.'
                })
            });
            fetchMeetings();
            showToast('Instant Google Meet launched in new tab!', 'success');
        } catch (e) {
            console.error("Error logging instant meeting:", e);
        }
    };

    // Quick Action 3: Open Full Schedule Modal
    const handleOpenScheduleModal = () => {
        setIsNewMenuOpen(false);
        setFormData(prev => ({
            ...prev,
            meetingLink: generateMeetLink()
        }));
        setIsScheduleModalOpen(true);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        showToast('Meeting link copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleToggleGuest = (userId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedGuestIds: prev.selectedGuestIds.includes(userId)
                ? prev.selectedGuestIds.filter(id => id !== userId)
                : [...prev.selectedGuestIds, userId]
        }));
    };

    const handleCreateMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title || 'Untitled Meeting',
                    date: formData.date,
                    time: formData.time,
                    endDate: formData.endDate,
                    endTime: formData.endTime,
                    isAllDay: formData.isAllDay,
                    duration: formData.duration,
                    description: formData.description,
                    location: formData.location,
                    meetingLink: formData.meetingLink || generateMeetLink(),
                    type: formData.type,
                    guestIds: formData.selectedGuestIds
                })
            });

            if (!res.ok) throw new Error('Failed to schedule meeting');

            showToast('Meeting scheduled & guests notified successfully!', 'success');
            setIsScheduleModalOpen(false);
            fetchMeetings();
        } catch (error) {
            showToast('Failed to schedule meeting', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = crmUsers.filter(u =>
        u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.role?.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-[1300px] mx-auto pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--notion-border-default)] pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-heading mb-1 tracking-tight">Meetings & Video Conferencing</h1>
                    <p className="text-subheading text-sm md:text-base">
                        Schedule video calls, invite CRM guests, and synchronize team reviews.
                    </p>
                </div>

                {/* Google Meet Style "New Meeting" Dropdown Menu */}
                <div className="relative">
                    <button
                        onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg font-bold text-sm shadow-md transition-all active:scale-95"
                    >
                        <Video className="w-4 h-4" />
                        <span>New Meeting</span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", isNewMenuOpen && "rotate-180")} />
                    </button>

                    {isNewMenuOpen && (
                        <div
                            className="absolute right-0 mt-2 w-72 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1.5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleCreateForLater}
                                className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-[var(--notion-bg-tertiary)] text-heading text-xs font-bold rounded-lg transition-colors text-left group"
                            >
                                <LinkIcon className="w-4 h-4 text-[#0052CC] group-hover:scale-110 transition-transform" />
                                <div>
                                    <div className="font-bold">Create a meeting for later</div>
                                    <div className="text-[10px] text-subheading font-normal">Generate shareable Google Meet link</div>
                                </div>
                            </button>

                            <button
                                onClick={handleStartInstantMeeting}
                                className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-[var(--notion-bg-tertiary)] text-heading text-xs font-bold rounded-lg transition-colors text-left group"
                            >
                                <Plus className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                                <div>
                                    <div className="font-bold">Start an instant meeting</div>
                                    <div className="text-[10px] text-subheading font-normal">Launch meeting room immediately</div>
                                </div>
                            </button>

                            <button
                                onClick={handleOpenScheduleModal}
                                className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-[var(--notion-bg-tertiary)] text-heading text-xs font-bold rounded-lg transition-colors text-left group"
                            >
                                <Calendar className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                                <div>
                                    <div className="font-bold">Schedule with Full Details</div>
                                    <div className="text-[10px] text-subheading font-normal">Set guests, permissions & protocols</div>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Schedule Feed (2 Cols) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold text-subheading uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#0052CC]" /> Upcoming Meetings ({meetings.length})
                        </h2>
                        <button onClick={fetchMeetings} className="text-xs text-body hover:text-heading transition-colors font-bold">Refresh</button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-16 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-xl">
                            <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
                        </div>
                    ) : meetings.length > 0 ? (
                        <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-xl shadow-sm overflow-hidden divide-y divide-[var(--notion-border-default)]">
                            {meetings.map((meeting) => (
                                <div key={meeting.id} className="p-5 hover:bg-[var(--notion-bg-tertiary)]/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center min-w-[55px] p-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-lg text-center shadow-inner">
                                            <span className="text-[10px] font-black text-subheading uppercase">
                                                {new Date(meeting.startTime).toLocaleDateString('en-US', { weekday: 'short' })}
                                            </span>
                                            <span className="text-xl font-bold text-heading">
                                                {new Date(meeting.startTime).getDate()}
                                            </span>
                                        </div>

                                        <div className="space-y-1.5">
                                            <h3 className="font-bold text-base text-heading group-hover:text-[#0052CC] transition-colors">{meeting.title}</h3>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-subheading">
                                                <span className="flex items-center gap-1 font-medium">
                                                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                                                    {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                    {new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {meeting.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                                        {meeting.location}
                                                    </span>
                                                )}
                                                {meeting.source === 'GOOGLE' && (
                                                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-sm text-[10px] font-bold">Google Calendar</span>
                                                )}
                                            </div>

                                            {meeting.description && (
                                                <p className="text-xs text-body line-clamp-1 mt-1 font-normal">
                                                    {meeting.description}
                                                </p>
                                            )}

                                            {/* Attendees List */}
                                            {meeting.attendees && meeting.attendees.length > 0 && (
                                                <div className="flex items-center gap-1.5 pt-1">
                                                    <span className="text-[10px] font-bold text-subheading uppercase">Guests:</span>
                                                    <div className="flex -space-x-1.5 overflow-hidden">
                                                        {meeting.attendees.slice(0, 5).map((guest, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="w-5 h-5 rounded-full bg-[#0052CC]/20 text-[#0052CC] flex items-center justify-center text-[9px] font-bold border border-white/20"
                                                                title={guest.name || guest.email}
                                                            >
                                                                {guest.name?.charAt(0) || 'G'}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {meeting.attendees.length > 5 && (
                                                        <span className="text-[10px] font-bold text-subheading">+{meeting.attendees.length - 5}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {meeting.meetingLink && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => copyToClipboard(meeting.meetingLink!)}
                                                className="p-2 text-subheading hover:text-heading hover:bg-[var(--notion-bg-hover)] rounded-md transition-colors"
                                                title="Copy Meeting Link"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <a
                                                href={meeting.meetingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-md font-bold text-xs transition-colors border border-blue-500/20"
                                            >
                                                <Video className="w-3.5 h-3.5" />
                                                Join Meeting
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-xl p-12 text-center">
                            <Video className="w-10 h-10 text-subheading mx-auto mb-3 opacity-40" />
                            <h3 className="text-heading font-bold mb-1">No meetings scheduled</h3>
                            <p className="text-subheading text-xs mb-4">Start an instant meeting or schedule a session with team guests.</p>
                            <Button variant="primary" size="sm" onClick={handleOpenScheduleModal}>
                                Schedule First Meeting
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right Sidebar Quick Actions (1 Col) */}
                <div className="space-y-6">
                    <h2 className="text-xs font-bold text-subheading uppercase tracking-wider">Templates & Shortcuts</h2>
                    <div className="space-y-3">
                        <button
                            onClick={handleStartInstantMeeting}
                            className="w-full p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all flex items-center justify-between text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <Video className="w-5 h-5 text-emerald-400" />
                                <div>
                                    <div className="font-bold text-sm text-heading">Instant Google Meet</div>
                                    <div className="text-xs text-subheading">Launch video room right now</div>
                                </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <button
                            onClick={handleCreateForLater}
                            className="w-full p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all flex items-center justify-between text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <LinkIcon className="w-5 h-5 text-blue-400" />
                                <div>
                                    <div className="font-bold text-sm text-heading">Shareable Link for Later</div>
                                    <div className="text-xs text-subheading">Generate & copy Meet link</div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal 1: Shareable Meeting Link Modal ("Create a meeting for later") */}
            {isInstantMeetingModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-heading flex items-center gap-2">
                                <Video className="w-5 h-5 text-[#0052CC]" /> Here's your joining information
                            </h3>
                            <button onClick={() => setIsInstantMeetingModalOpen(false)} className="text-subheading hover:text-heading">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-subheading leading-relaxed">
                            Send this link to people you want to meet with. Make sure you save it so you can use it later too.
                        </p>

                        <div className="flex items-center gap-2 p-3 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-xl">
                            <input
                                type="text"
                                readOnly
                                value={createdInstantLink}
                                className="bg-transparent text-sm text-heading flex-1 focus:outline-none font-mono"
                            />
                            <button
                                onClick={() => copyToClipboard(createdInstantLink)}
                                className="p-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-bold shrink-0"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => window.open(createdInstantLink, '_blank')}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5"
                            >
                                <Video className="w-4 h-4" /> Join Room Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 2: Comprehensive Google Calendar / Google Meet Schedule Modal */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[var(--notion-border-default)] flex items-center justify-between bg-[var(--notion-bg-tertiary)]/50 shrink-0">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#0052CC]" />
                                <h2 className="text-base font-bold text-heading">Schedule Event & Meeting Protocol</h2>
                            </div>
                            <button onClick={() => setIsScheduleModalOpen(false)} className="text-subheading hover:text-heading transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMeeting} className="p-6 overflow-y-auto space-y-6 flex-1">
                            {/* Title Field */}
                            <div>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-xl px-4 py-3 text-lg font-bold text-heading focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                                    placeholder="Add title..."
                                />
                            </div>

                            {/* Date, Time & All Day */}
                            <div className="space-y-3 bg-[var(--notion-bg-primary)] p-4 rounded-xl border border-[var(--notion-border-default)]">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-subheading uppercase tracking-wider flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-[#0052CC]" /> Date & Time Protocol
                                    </span>
                                    <label className="flex items-center gap-2 text-xs font-bold text-subheading cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isAllDay}
                                            onChange={e => setFormData({ ...formData, isAllDay: e.target.checked })}
                                            className="rounded text-[#0052CC]"
                                        />
                                        All day
                                    </label>
                                </div>

                                {!formData.isAllDay && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                required
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-lg px-3 py-2 text-xs text-heading font-medium"
                                            />
                                            <input
                                                type="time"
                                                required
                                                value={formData.time}
                                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                                                className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-lg px-3 py-2 text-xs text-heading font-medium"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-subheading font-bold">to</span>
                                            <input
                                                type="time"
                                                value={formData.endTime}
                                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                                className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-lg px-3 py-2 text-xs text-heading font-medium"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Recurrence */}
                                <div className="pt-2 flex items-center gap-3">
                                    <span className="text-xs text-subheading font-bold">Repeat:</span>
                                    <select
                                        value={formData.recurrence}
                                        onChange={e => setFormData({ ...formData, recurrence: e.target.value })}
                                        className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-lg px-3 py-1.5 text-xs text-heading font-medium"
                                    >
                                        <option value="Does not repeat">Does not repeat</option>
                                        <option value="Daily">Daily</option>
                                        <option value="Weekly">Weekly on this day</option>
                                        <option value="Monthly">Monthly</option>
                                    </select>
                                </div>
                            </div>

                            {/* Guests & Guest Permissions */}
                            <div className="space-y-3 bg-[var(--notion-bg-primary)] p-4 rounded-xl border border-[var(--notion-border-default)]">
                                <span className="text-xs font-bold text-subheading uppercase tracking-wider flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-emerald-400" /> Guests & Attendees ({formData.selectedGuestIds.length})
                                </span>

                                {/* Search CRM Users */}
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-subheading" />
                                    <input
                                        type="text"
                                        placeholder="Search & select CRM guests..."
                                        value={userSearchQuery}
                                        onChange={e => setUserSearchQuery(e.target.value)}
                                        className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-heading focus:outline-none"
                                    />
                                </div>

                                {/* Guest Checkboxes */}
                                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border border-[var(--notion-border-default)]/40 p-2 rounded-lg bg-[var(--notion-bg-secondary)]">
                                    {filteredUsers.map(user => (
                                        <label
                                            key={user.id}
                                            className="flex items-center justify-between p-1.5 hover:bg-[var(--notion-bg-tertiary)] rounded cursor-pointer transition-colors text-xs"
                                        >
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.selectedGuestIds.includes(user.id)}
                                                    onChange={() => handleToggleGuest(user.id)}
                                                    className="rounded text-[#0052CC]"
                                                />
                                                <div className="w-5 h-5 rounded-full bg-[#0052CC]/20 text-[#0052CC] flex items-center justify-center font-bold text-[9px]">
                                                    {user.name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="font-bold text-heading">{user.name}</span>
                                                <span className="text-[10px] text-subheading">({user.role})</span>
                                            </div>
                                            <span className="text-[10px] text-subheading">{user.email}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Guest Permissions */}
                                <div className="pt-2 border-t border-[var(--notion-border-default)]/40 space-y-2">
                                    <span className="text-[10px] font-bold text-subheading uppercase tracking-wider">Guest Permissions</span>
                                    <div className="flex flex-wrap gap-4 text-xs text-subheading font-medium">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.modifyEvent}
                                                onChange={e => setFormData({ ...formData, modifyEvent: e.target.checked })}
                                                className="rounded text-[#0052CC]"
                                            />
                                            Modify event
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.inviteOthers}
                                                onChange={e => setFormData({ ...formData, inviteOthers: e.target.checked })}
                                                className="rounded text-[#0052CC]"
                                            />
                                            Invite others
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.seeGuestList}
                                                onChange={e => setFormData({ ...formData, seeGuestList: e.target.checked })}
                                                className="rounded text-[#0052CC]"
                                            />
                                            See guest list
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Google Meet Link & Location */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-subheading uppercase mb-1.5 flex items-center gap-1.5">
                                        <Video className="w-3.5 h-3.5 text-[#0052CC]" /> Google Meet Link
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={formData.meetingLink}
                                            onChange={e => setFormData({ ...formData, meetingLink: e.target.value })}
                                            className="w-full bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-lg px-3 py-2 text-xs text-heading font-mono"
                                            placeholder="https://meet.google.com/xyz-abc-123"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, meetingLink: generateMeetLink() })}
                                            className="p-2 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-lg text-xs font-bold text-[#0052CC] hover:bg-[var(--notion-bg-tertiary)]"
                                            title="Generate New Meet Link"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-subheading uppercase mb-1.5 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Location
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-lg px-3 py-2 text-xs text-heading"
                                        placeholder="e.g. Google Meet or Conference Room A"
                                    />
                                </div>
                            </div>

                            {/* Notifications, Status & Visibility */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[var(--notion-bg-primary)] p-4 rounded-xl border border-[var(--notion-border-default)]">
                                <div>
                                    <label className="block text-[10px] font-bold text-subheading uppercase mb-1 flex items-center gap-1">
                                        <Bell className="w-3 h-3 text-amber-400" /> Notification
                                    </label>
                                    <select
                                        value={formData.notification}
                                        onChange={e => setFormData({ ...formData, notification: e.target.value })}
                                        className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-lg px-2.5 py-1.5 text-xs text-heading font-medium"
                                    >
                                        <option value="10">10 minutes before</option>
                                        <option value="15">15 minutes before</option>
                                        <option value="30">30 minutes before</option>
                                        <option value="60">1 hour before</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-subheading uppercase mb-1 flex items-center gap-1">
                                        <UserCheck className="w-3 h-3 text-purple-400" /> Availability
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-lg px-2.5 py-1.5 text-xs text-heading font-medium"
                                    >
                                        <option value="BUSY">Busy</option>
                                        <option value="FREE">Free</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-subheading uppercase mb-1 flex items-center gap-1">
                                        <Eye className="w-3 h-3 text-blue-400" /> Visibility
                                    </label>
                                    <select
                                        value={formData.visibility}
                                        onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                                        className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-lg px-2.5 py-1.5 text-xs text-heading font-medium"
                                    >
                                        <option value="DEFAULT">Default visibility</option>
                                        <option value="PUBLIC">Public</option>
                                        <option value="PRIVATE">Private</option>
                                    </select>
                                </div>
                            </div>

                            {/* Organizer Notice */}
                            <div className="flex items-center gap-3 p-3 bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-xl">
                                <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center font-bold text-xs">
                                    {currentUser?.name?.charAt(0) || 'O'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-heading">{currentUser?.name || 'Organizer'} (Organizer)</span>
                                    <span className="text-[10px] text-subheading">{currentUser?.email}</span>
                                </div>
                            </div>

                            {/* Description / Operational Briefing */}
                            <div>
                                <label className="block text-xs font-bold text-subheading uppercase mb-1.5">Operational Briefing & Description</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-xl p-3 text-xs text-heading focus:outline-none focus:ring-2 focus:ring-[#0052CC] resize-none"
                                    placeholder="Add meeting agenda, documents, or instructions for guests..."
                                />
                            </div>

                            {/* Submit & Cancel */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--notion-border-default)]">
                                <Button type="button" variant="ghost" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" isLoading={isSubmitting}>Save & Send Invites</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
