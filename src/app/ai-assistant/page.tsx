"use client";

import { Sparkles } from 'lucide-react';

export default function AIAssistantPage() {
    return (
        <div className="flex flex-col h-[calc(100dvh-6rem)] md:h-[calc(100vh-6rem)] w-full bg-[var(--notion-bg-primary)] items-center justify-center text-center p-6">
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
            <h1 className="text-2xl font-semibold text-heading mb-2">EUSAI AI is Coming Soon!</h1>
            <p className="text-subheading max-w-md">
                We're working hard to bring you an intelligent assistant that will help streamline your workflow. Stay tuned for updates!
            </p>
        </div>
    );
}
