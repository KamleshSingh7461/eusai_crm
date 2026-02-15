"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Send, CheckCircle2, Clock, Target } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function SubmitReportPage() {
    const { showToast } = useToast();
    const [currentDate, setCurrentDate] = useState('');
    const [tasksCompleted, setTasksCompleted] = useState('');
    const [hoursWorked, setHoursWorked] = useState('');
    const [accomplishments, setAccomplishments] = useState('');
    const [challenges, setChallenges] = useState('');
    const [tomorrowPlan, setTomorrowPlan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString());
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/reports/daily', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'current-user-id', // Replace with actual session user ID
                    tasksCompleted: parseInt(tasksCompleted),
                    hoursWorked: parseFloat(hoursWorked),
                    accomplishments,
                    challenges,
                    tomorrowPlan
                })
            });

            if (response.ok) {
                showToast('Daily report submitted successfully!', 'success');
                // Reset form
                setTasksCompleted('');
                setHoursWorked('');
                setAccomplishments('');
                setChallenges('');
                setTomorrowPlan('');
            } else {
                showToast('Failed to submit report', 'error');
            }
        } catch (error) {
            showToast('Failed to submit report', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#172B4D] mb-2">Daily Report Submission</h1>
                    <p className="text-[#6B778C]">Submit your daily accomplishments and plans for {currentDate}</p>
                </div>
            </div>

            {/* Stats Banner */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-[#36B37E] to-[#00875A] text-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm opacity-90">Tasks</span>
                    </div>
                    <p className="text-2xl font-bold">{tasksCompleted || '0'}</p>
                </div>
                <div className="bg-gradient-to-br from-[#0052CC] to-[#0747A6] text-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm opacity-90">Hours</span>
                    </div>
                    <p className="text-2xl font-bold">{hoursWorked || '0.0'}</p>
                </div>
                <div className="bg-gradient-to-br from-[#FFAB00] to-[#FF991F] text-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Target className="w-5 h-5" />
                        <span className="text-sm opacity-90">Progress</span>
                    </div>
                    <p className="text-2xl font-bold">{accomplishments.length > 0 ? '👍' : '⏳'}</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white border border-[#DFE1E6] rounded-lg p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        type="number"
                        label="Tasks Completed"
                        placeholder="e.g. 5"
                        value={tasksCompleted}
                        onChange={(e) => setTasksCompleted(e.target.value)}
                        required
                        min="0"
                    />
                    <Input
                        type="number"
                        label="Hours Worked"
                        placeholder="e.g. 8.5"
                        value={hoursWorked}
                        onChange={(e) => setHoursWorked(e.target.value)}
                        required
                        min="0"
                        step="0.5"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#172B4D] mb-2">
                        Today's Accomplishments *
                    </label>
                    <textarea
                        className="w-full px-4 py-3 border border-[#DFE1E6] rounded-lg focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all text-[#172B4D]"
                        rows={4}
                        placeholder="List what you accomplished today..."
                        value={accomplishments}
                        onChange={(e) => setAccomplishments(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#172B4D] mb-2">
                        Challenges Faced
                    </label>
                    <textarea
                        className="w-full px-4 py-3 border border-[#DFE1E6] rounded-lg focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all text-[#172B4D]"
                        rows={3}
                        placeholder="Any blockers or challenges?"
                        value={challenges}
                        onChange={(e) => setChallenges(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#172B4D] mb-2">
                        Tomorrow's Plan
                    </label>
                    <textarea
                        className="w-full px-4 py-3 border border-[#DFE1E6] rounded-lg focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all text-[#172B4D]"
                        rows={3}
                        placeholder="What do you plan to work on tomorrow?"
                        value={tomorrowPlan}
                        onChange={(e) => setTomorrowPlan(e.target.value)}
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        leftIcon={<Send className="w-5 h-5" />}
                        isLoading={isSubmitting}
                    >
                        Submit Daily Report
                    </Button>
                </div>
            </form>
        </div>
    );
}
