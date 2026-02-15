"use client";

import React, { useState } from 'react';
import { useSpace } from '@/context/SpaceContext';
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Briefcase,
    Users,
    Calendar,
    Layout,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

export default function SpacesPage() {
    const router = useRouter();
    const { spaces, isLoading, activeSpace, setActiveSpace } = useSpace();
    const { data: session } = useSession();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    const userRole = (session?.user as any)?.role || 'EMPLOYEE';
    const canManageSpaces = ['DIRECTOR', 'MANAGER'].includes(userRole);

    const filteredSpaces = spaces.filter(space => {
        const matchesSearch = space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            space.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'ALL' || space.type === filterType;
        return matchesSearch && matchesFilter;
    });

    if (isLoading) {
        return (
            <div className="flex bg-[#FAFBFC] h-[calc(100vh-64px)] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#172B4D] mb-1">Spaces Directory</h1>
                    <p className="text-[#6B778C] text-sm md:text-base">Organize EUSAI's departments, regions, and strategic verticals.</p>
                </div>
                {canManageSpaces && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-sm font-bold text-sm hover:bg-[#0747A6] transition-colors shadow-sm">
                        <Plus className="w-4 h-4" />
                        New Space
                    </button>
                )}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-sm border border-[#DFE1E6] shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B778C]" />
                    <input
                        type="search"
                        placeholder="Search spaces..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all"
                    />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#6B778C]" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm py-1.5 px-3 text-xs font-bold text-[#42526E] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                        >
                            <option value="ALL">All Types</option>
                            <option value="STANDARD">Standard</option>
                            <option value="DEPARTMENT">Department</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Spaces Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSpaces.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white border border-dashed border-[#DFE1E6] rounded-lg">
                        <div className="p-4 bg-[#F4F5F7] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <Layout className="w-8 h-8 text-[#6B778C]" />
                        </div>
                        <h3 className="text-lg font-bold text-[#172B4D]">No spaces found</h3>
                        <p className="text-[#6B778C] max-w-xs mx-auto mt-1">Try adjusting your search or filters to find what you're looking for.</p>
                    </div>
                ) : (
                    filteredSpaces.map(space => (
                        <div
                            key={space.id}
                            className={cn(
                                "group relative bg-white border rounded-sm p-6 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden",
                                activeSpace?.id === space.id ? "border-[#0052CC] ring-1 ring-[#0052CC]" : "border-[#DFE1E6]"
                            )}
                            onClick={() => {
                                setActiveSpace(space);
                                router.push(`/spaces/${space.id}`);
                            }}
                        >
                            {/* Accent Bar */}
                            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: space.color }} />

                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-md transform group-hover:scale-110 transition-transform"
                                    style={{ backgroundColor: space.color }}
                                >
                                    {space.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                                <button className="p-1.5 text-[#6B778C] hover:bg-[#F4F5F7] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-[#172B4D] group-hover:text-[#0052CC] transition-colors truncate">{space.name}</h3>
                                <p className="text-sm text-[#6B778C] line-clamp-2 min-h-[40px]">
                                    {space.description || 'No description provided for this space.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-[#F4F5F7]">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-50 rounded-sm">
                                        <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-[#172B4D] leading-none">{space._count?.projects || 0}</span>
                                        <span className="text-[10px] text-[#6B778C] uppercase font-bold tracking-tight">Projects</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-green-50 rounded-sm">
                                        <Users className="w-3.5 h-3.5 text-green-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-[#172B4D] leading-none">{space._count?.resources || 0}</span>
                                        <span className="text-[10px] text-[#6B778C] uppercase font-bold tracking-tight">Resources</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                        space.type === 'DEPARTMENT' ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                                    )}>
                                        {space.type}
                                    </span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-[#0052CC] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Empty State Help */}
            <div className="bg-[#EAE6FF] p-6 rounded-lg flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 bg-white rounded-full">
                    <Layout className="w-8 h-8 text-[#403294]" />
                </div>
                <div className="flex-1">
                    <h4 className="text-[#172B4D] font-bold">New to Spaces?</h4>
                    <p className="text-[#403294] text-sm">Spaces are high-level containers for your work. You can group projects by department, region, or business vertical to keep everything organized and focused.</p>
                </div>
                <Link
                    href="/Spaces_Usage_Guide.md"
                    className="px-6 py-2 bg-[#403294] text-white text-sm font-bold rounded-sm hover:opacity-90 transition-opacity"
                >
                    View Guide
                </Link>
            </div>
        </div>
    );
}
