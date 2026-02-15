"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Space {
    id: string;
    name: string;
    description?: string;
    color: string;
    type: string;
    _count?: {
        projects: number;
        resources: number;
    };
}

interface SpaceContextType {
    activeSpace: Space | null;
    setActiveSpace: (space: Space | null) => void;
    spaces: Space[];
    isLoading: boolean;
    refreshSpaces: () => Promise<void>;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export function SpaceProvider({ children }: { children: React.ReactNode }) {
    const [activeSpace, setActiveSpace] = useState<Space | null>(null);
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSpaces = async () => {
        try {
            const response = await fetch('/api/spaces');
            if (response.ok) {
                const data = await response.json();
                setSpaces(data);
            }
        } catch (error) {
            console.error('Failed to fetch spaces:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSpaces();
    }, []);

    const refreshSpaces = async () => {
        setIsLoading(true);
        await fetchSpaces();
    };

    return (
        <SpaceContext.Provider value={{ activeSpace, setActiveSpace, spaces, isLoading, refreshSpaces }}>
            {children}
        </SpaceContext.Provider>
    );
}

export function useSpace() {
    const context = useContext(SpaceContext);
    if (context === undefined) {
        throw new Error('useSpace must be used within a SpaceProvider');
    }
    return context;
}
