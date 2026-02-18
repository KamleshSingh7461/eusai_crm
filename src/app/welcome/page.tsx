"use client";

import { Smile, Sparkles, Star } from 'lucide-react';

export default function WelcomePage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Welcome Header */}
            <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-6">
                    <Smile className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-heading mb-4">Welcome to EUSAI CRM!</h1>
                <p className="text-lg text-body max-w-2xl mx-auto">
                    Your enterprise platform for seamless project management, team collaboration, and business growth.
                </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FeatureCard
                    icon={<Sparkles className="w-6 h-6" />}
                    title="Smart Organization"
                    description="Organize projects, tasks, and milestones with intuitive spaces and teamspaces"
                    color="blue"
                />
                <FeatureCard
                    icon={<Star className="w-6 h-6" />}
                    title="Team Collaboration"
                    description="Work together with real-time messaging, shared notes, and collaborative tools"
                    color="purple"
                />
                <FeatureCard
                    icon={<Smile className="w-6 h-6" />}
                    title="AI Assistant"
                    description="Get help from EUSAI AI to streamline your workflow and boost productivity"
                    color="green"
                />
            </div>

            {/* Quick Start Guide */}
            <div className="bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm shadow-sm p-8">
                <h2 className="text-xl font-bold text-heading mb-6">Quick Start Guide</h2>
                <div className="space-y-4">
                    <QuickStartStep
                        number={1}
                        title="Explore your Dashboard"
                        description="Start by checking your personalized dashboard for an overview of your tasks and projects"
                    />
                    <QuickStartStep
                        number={2}
                        title="Join a Teamspace"
                        description="Collaborate with your team by joining or creating teamspaces for your projects"
                    />
                    <QuickStartStep
                        number={3}
                        title="Create your first Task"
                        description="Get started by creating tasks, setting milestones, and tracking your progress"
                    />
                    <QuickStartStep
                        number={4}
                        title="Try EUSAI AI"
                        description="Ask our AI assistant for help with anything – from finding tasks to generating reports"
                    />
                </div>
            </div>

            {/* Team Introduction */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-500/30 rounded-sm p-8 text-center">
                <h2 className="text-xl font-bold text-heading mb-3">Built for Teams, Powered by Innovation</h2>
                <p className="text-sm text-body max-w-2xl mx-auto mb-6">
                    EUSAI CRM is designed to help teams of all sizes work smarter, collaborate better, and achieve more together.
                    Whether you're a director overseeing projects or an employee managing daily tasks, we've got you covered.
                </p>
                <p className="text-xs text-[#97A0AF]">
                    Need help? Check out our documentation or reach out to your team administrator.
                </p>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, description, color }: any) {
    const colors: any = {
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        purple: 'bg-purple-50 text-purple-600 border-purple-200',
        green: 'bg-green-50 text-green-600 border-green-200'
    };

    return (
        <div className="bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] rounded-sm p-6 hover:shadow-md transition-all">
            <div className={`inline-flex p-3 rounded-lg mb-4 ${colors[color]}`}>
                {icon}
            </div>
            <h3 className="text-lg font-bold text-heading mb-2">{title}</h3>
            <p className="text-sm text-body">{description}</p>
        </div>
    );
}

function QuickStartStep({ number, title, description }: any) {
    return (
        <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center font-bold text-sm">
                {number}
            </div>
            <div>
                <h3 className="font-bold text-heading mb-1">{title}</h3>
                <p className="text-sm text-body">{description}</p>
            </div>
        </div>
    );
}
