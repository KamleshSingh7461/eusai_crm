"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Briefcase } from 'lucide-react';

interface GanttTask {
    id: string;
    name: string;
    resource: string;
    start: number; // Day index (0-30)
    duration: number; // In days
    status: 'DONE' | 'IN_PROGRESS' | 'TODO';
}

const GANTT_DATA: GanttTask[] = [
    { id: '1', name: 'UI Foundation', resource: 'Alex J.', start: 0, duration: 5, status: 'DONE' },
    { id: '2', name: 'API Bridge', resource: 'Alex J.', start: 4, duration: 8, status: 'DONE' },
    { id: '3', name: 'Auth Logic', resource: 'Sarah W.', start: 10, duration: 6, status: 'IN_PROGRESS' },
    { id: '4', name: 'Resource Hub', resource: 'Mike R.', start: 15, duration: 10, status: 'TODO' },
    { id: '5', name: 'Security Audit', resource: 'External', start: 22, duration: 4, status: 'TODO' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function GanttChart() {
    return (
        <div className="card-eusai p-0 overflow-hidden bg-white shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Project Milestone Timeline
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                            <div className="w-2 h-2 rounded-full bg-primary" /> DONE
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                            <div className="w-2 h-2 rounded-full bg-blue-500" /> IN PROGRESS
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-1 px-2 rounded-lg bg-white text-foreground hover:bg-muted transition-all text-xs border border-border shadow-sm">Month</button>
                    <button className="p-1 px-2 rounded-lg bg-primary text-white transition-all text-xs border border-primary/20 shadow-sm">Quarter</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[1000px]">
                    {/* Header/Days */}
                    <div className="flex border-b border-border bg-muted/10">
                        <div className="w-60 border-r border-border p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Task / Resource
                        </div>
                        <div className="flex-1 flex">
                            {DAYS.map(day => (
                                <div key={day} className="flex-1 text-center py-4 border-r border-border/30 text-[10px] font-bold text-muted-foreground">
                                    {day}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="divide-y divide-border/40">
                        {GANTT_DATA.map((task) => (
                            <div key={task.id} className="flex group hover:bg-muted/10 transition-colors">
                                <div className="w-60 border-r border-border p-4 flex flex-col justify-center">
                                    <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{task.name}</div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <User className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-[10px] text-muted-foreground font-medium">{task.resource}</span>
                                    </div>
                                </div>
                                <div className="flex-1 flex relative py-4">
                                    {/* Grid Lines Overlay */}
                                    <div className="absolute inset-0 flex pointer-events-none">
                                        {DAYS.map(day => (
                                            <div key={day} className="flex-1 border-r border-white/[0.02]" />
                                        ))}
                                    </div>

                                    {/* Task Bar */}
                                    <div
                                        className={`absolute h-8 rounded-lg border flex items-center px-3 shadow-sm transition-all transform hover:scale-[1.02] cursor-pointer group/bar ${task.status === 'DONE' ? 'bg-primary text-white border-primary/20' :
                                            task.status === 'IN_PROGRESS' ? 'bg-blue-600 text-white border-blue-700/20' :
                                                'bg-muted text-muted-foreground border-border'
                                            }`}
                                        style={{
                                            left: `${(task.start / 31) * 100}%`,
                                            width: `${(task.duration / 31) * 100}%`,
                                            top: '12px'
                                        }}
                                    >
                                        <span className="text-[10px] font-bold truncate">{task.duration} Days</span>
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground px-2 py-1 rounded border border-border opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none whitespace-nowrap z-10 text-[10px] font-bold text-background">
                                            {task.name}: Day {task.start + 1} - {task.start + task.duration}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase">
                    <span>Total Project Window: 180 Days</span>
                    <span className="text-primary">Current Sprint: 14 Days</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg border border-border bg-white text-muted-foreground hover:text-foreground transition-all shadow-sm">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg border border-border bg-white text-muted-foreground hover:text-foreground transition-all shadow-sm">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
