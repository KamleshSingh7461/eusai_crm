"use client";

import { Clock, FileText, Briefcase, CheckSquare, Folder, ArrowUpRight, Calendar, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

export default function RecentPage() {
    const [recentItems, setRecentItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchRecents();
    }, []);

    const fetchRecents = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/recent');
            if (res.ok) {
                const data = await res.json();
                setRecentItems(data);
            } else {
                showToast('Failed to load recent items', 'error');
            }
        } catch (error) {
            console.error('Error fetching recents:', error);
            showToast('Network error loading recents', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const groupedItems = {
        'Today': recentItems.filter(item => isToday(new Date(item.updatedAt))),
        'Yesterday': recentItems.filter(item => isYesterday(new Date(item.updatedAt))),
        'This Week': recentItems.filter(item => !isToday(new Date(item.updatedAt)) && !isYesterday(new Date(item.updatedAt)) && isThisWeek(new Date(item.updatedAt))),
        'Older': recentItems.filter(item => !isThisWeek(new Date(item.updatedAt)))
    };

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-end justify-between border-b border-[rgba(255,255,255,0.09)] pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[rgba(255,255,255,0.9)] mb-2 tracking-tight flex items-center gap-3">
                        <Clock className="w-8 h-8 text-[#0052CC]" />
                        Recent Activity
                    </h1>
                    <p className="text-[rgba(255,255,255,0.7)] text-base">Track your latest updates across projects, tasks, and spaces.</p>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-10">
                {isLoading ? (
                    <div className="space-y-8">
                        <SpaceSkeleton />
                        <SpaceSkeleton />
                    </div>
                ) : (
                    <>
                        {Object.entries(groupedItems).map(([period, items]: [string, any[]]) => (
                            items.length > 0 && (
                                <div key={period} className="relative">
                                    <div className="sticky top-0 bg-[#1D2125]/95 backdrop-blur-sm z-10 py-3 mb-2 border-b border-[rgba(255,255,255,0.09)]">
                                        <h2 className="text-xs font-black text-[rgba(255,255,255,0.5)] uppercase tracking-widest pl-1">{period}</h2>
                                    </div>
                                    <div className="grid gap-3">
                                        {items.map((item) => (
                                            <RecentItem key={`${item.type}-${item.id}`} item={item} />
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}

                        {recentItems.length === 0 && (
                            <div className="bg-[#2f3437] border-2 border-dashed border-[rgba(255,255,255,0.09)] rounded-lg p-16 text-center">
                                <div className="bg-[#3b4045] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8 text-[rgba(255,255,255,0.5)]" />
                                </div>
                                <h3 className="text-[rgba(255,255,255,0.9)] font-bold text-lg mb-2">No recent activity found</h3>
                                <p className="text-[rgba(255,255,255,0.7)] max-w-sm mx-auto">
                                    It looks quiet here. As you work on projects and tasks, they will appear here automatically.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function RecentItem({ item }: any) {
    const getIcon = () => {
        switch (item.type) {
            case 'project': return Briefcase;
            case 'task': return CheckSquare;
            case 'space': return Folder;
            default: return FileText;
        }
    };

    const Icon = getIcon();

    const typeConfig: any = {
        project: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
        task: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
        space: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
        page: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' }
    };

    const config = typeConfig[item.type] || typeConfig.page;

    const Content = (
        <div className="bg-[#2f3437] border border-[rgba(255,255,255,0.09)] rounded-lg p-4 hover:border-[#0052CC] hover:bg-[#3b4045] transition-all cursor-pointer group relative overflow-hidden">
            <div className="flex items-start gap-4">
                {/* Icon Box */}
                <div className={cn("p-3 rounded-md shrink-0 transition-colors", config.bg, config.text)}>
                    <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    {/* Title Row */}
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                            <h3 className="text-base font-bold text-[rgba(255,255,255,0.9)] group-hover:text-[#0052CC] transition-colors truncate leading-tight">
                                {item.title}
                            </h3>
                            {item.space !== 'Unassigned' && (
                                <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-[rgba(255,255,255,0.5)]">
                                    {item.spaceColor && (
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.spaceColor }} />
                                    )}
                                    <span>{item.space}</span>
                                </div>
                            )}
                        </div>

                        {/* Status Badge */}
                        {item.status && (
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0",
                                item.status === 'DONE' || item.status === 'COMPLETED' ? "bg-emerald-500/20 text-emerald-400" :
                                    item.status === 'IN_PROGRESS' || item.status === 'EXECUTION' ? "bg-blue-500/20 text-blue-400" :
                                        item.status === 'TODO' || item.status === 'INITIATION' ? "bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.7)]" :
                                            "bg-purple-500/20 text-purple-400" // For spaces/other
                            )}>
                                {item.status.replace('_', ' ')}
                            </span>
                        )}
                    </div>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-4 text-xs text-[rgba(255,255,255,0.5)] font-medium mt-3 border-t border-[rgba(255,255,255,0.09)] pt-3">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}</span>
                        </div>
                        {item.priority && (
                            <div className="flex items-center gap-1.5">
                                <AlertCircle className={cn("w-3.5 h-3.5", item.priority > 1 ? "text-orange-400" : "text-[rgba(255,255,255,0.5)]")} />
                                <span>{item.priority === 3 ? 'High Priority' : item.priority === 2 ? 'Medium' : 'Low'}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hover Arrow */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 translate-x-2">
                    <ArrowUpRight className="w-5 h-5 text-[#0052CC]" />
                </div>
            </div>
        </div>
    );

    if (item.link && item.link !== '/tasks') { // Tasks don't have a specific page yet, or modal logic is needed
        return <Link href={item.link}>{Content}</Link>;
    }

    return Content;
}

function SpaceSkeleton() {
    return (
        <div>
            <Skeleton className="h-4 w-24 mb-4 bg-[#3b4045]" />
            <div className="space-y-3">
                <Skeleton className="h-24 w-full bg-[#2f3437]" />
                <Skeleton className="h-24 w-full bg-[#2f3437]" />
                <Skeleton className="h-24 w-full bg-[#2f3437]" />
            </div>
        </div>
    );
}
