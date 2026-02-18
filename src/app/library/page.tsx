"use client";

import React, { useState, useEffect } from 'react';
import {
    Search,
    FileText,
    Grid,
    List,
    Folder,
    Plus, // For future "Upload"
    Clock,
    BookOpen,
    Image as ImageIcon,
    FileCode,
    MoreHorizontal,
    Download
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSpace } from '@/context/SpaceContext';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Types
interface LibraryDocument {
    id: string;
    name: string;
    type: string;
    size: string;
    url: string;
    projectId?: string;
    uploadedBy: string;
    createdAt: string;
}

interface LibraryWikiPage {
    id: string;
    title: string;
    content: string; // Preview only
    projectId?: string;
    authorId: string;
    updatedAt: string;
}

export default function LibraryPage() {
    const { spaces, isLoading: isSpacesLoading } = useSpace();
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<'ALL' | 'DOCUMENTS' | 'WIKI' | 'SPACES'>('ALL');
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
    const [searchQuery, setSearchQuery] = useState('');

    // Data State
    const [documents, setDocuments] = useState<LibraryDocument[]>([]);
    const [wikiPages, setWikiPages] = useState<LibraryWikiPage[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            setIsLoadingContent(true);
            try {
                const [docsRes, wikiRes] = await Promise.all([
                    fetch('/api/documents'),
                    fetch('/api/wiki')
                ]);

                if (docsRes.ok) {
                    const docs = await docsRes.json();
                    setDocuments(Array.isArray(docs) ? docs : []);
                }
                if (wikiRes.ok) {
                    const wikis = await wikiRes.json();
                    setWikiPages(Array.isArray(wikis) ? wikis : []);
                }
            } catch (error) {
                console.error("Failed to fetch library content", error);
            } finally {
                setIsLoadingContent(false);
            }
        };

        fetchContent();
    }, []);

    // filtering logic
    const filteredDocuments = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredWiki = wikiPages.filter(page =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredSpaces = spaces.filter((space: any) =>
        space.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getFileIcon = (type: string) => {
        if (type.includes('image')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
        if (type.includes('code') || type.includes('json') || type.includes('js')) return <FileCode className="w-5 h-5 text-yellow-500" />;
        if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
        return <FileText className="w-5 h-5 text-blue-500" />;
    };

    return (
        <div className="flex flex-col h-full bg-[var(--notion-bg-primary)] animate-in fade-in duration-500">
            {/* Header */}
            <div className="px-6 py-6 border-b border-[var(--notion-border-default)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-heading font-display tracking-tight">Library</h1>
                        <p className="text-subheading mt-1">Centralized knowledge base and asset repository.</p>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 bg-[var(--notion-bg-secondary)] p-1 rounded-sm overflow-x-auto no-scrollbar">
                        {(['ALL', 'DOCUMENTS', 'WIKI', 'SPACES'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-bold rounded-sm transition-all whitespace-nowrap",
                                    activeTab === tab
                                        ? "bg-[var(--notion-bg-primary)] text-heading shadow-sm"
                                        : "text-subheading hover:bg-[var(--notion-bg-hover)] hover:text-heading"
                                )}
                            >
                                {tab.charAt(0) + tab.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    {/* Search & View Toggle */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subheading" />
                            <input
                                placeholder="Search library..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[var(--notion-bg-secondary)] border border-[var(--notion-border-default)] rounded-sm pl-9 pr-4 py-1.5 text-sm text-heading placeholder:text-subheading focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                            />
                        </div>
                        <div className="flex items-center border border-[var(--notion-border-default)] rounded-sm bg-[var(--notion-bg-secondary)] p-0.5">
                            <button
                                onClick={() => setViewMode('GRID')}
                                className={cn(
                                    "p-1.5 rounded-sm transition-all",
                                    viewMode === 'GRID' ? "bg-[var(--notion-bg-primary)] text-heading shadow-sm" : "text-subheading hover:text-heading"
                                )}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('LIST')}
                                className={cn(
                                    "p-1.5 rounded-sm transition-all",
                                    viewMode === 'LIST' ? "bg-[var(--notion-bg-primary)] text-heading shadow-sm" : "text-subheading hover:text-heading"
                                )}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {(isLoadingContent || isSpacesLoading) ? (
                    <div className="flex flex-col items-center justify-center p-12 text-subheading">
                        <Clock className="w-8 h-8 animate-pulse mb-3 opacity-20" />
                        <p className="text-sm">Loading library content...</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Documents Section */}
                        {(activeTab === 'ALL' || activeTab === 'DOCUMENTS') && filteredDocuments.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        Documents
                                    </h2>
                                    {activeTab === 'ALL' && <button onClick={() => setActiveTab('DOCUMENTS')} className="text-xs text-subheading hover:text-heading hover:underline">View All</button>}
                                </div>
                                <div className={cn(
                                    "grid gap-4",
                                    viewMode === 'GRID' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                                )}>
                                    {filteredDocuments.slice(0, activeTab === 'ALL' ? 4 : undefined).map(doc => (
                                        <div key={doc.id} className="group relative bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] hover:border-[var(--notion-border-hover)] rounded-sm p-4 transition-all hover:shadow-sm">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="p-2 bg-[var(--notion-bg-secondary)] rounded-sm group-hover:bg-blue-50 transition-colors">
                                                    {getFileIcon(doc.type || 'file')}
                                                </div>
                                                <button className="opacity-0 group-hover:opacity-100 text-subheading hover:text-heading transition-opacity">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <h3 className="font-bold text-heading text-sm mb-1 truncate" title={doc.name}>{doc.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-subheading">
                                                <span>{doc.size || 'Unknown size'}</span>
                                                <span>•</span>
                                                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {/* Hover Action */}
                                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-sm pointer-events-none">
                                                <a href={doc.url} target="_blank" rel="noreferrer" className="pointer-events-auto bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-sm hover:scale-105 transition-transform flex items-center gap-1">
                                                    <Download className="w-3 h-3" /> Download
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Wiki Section */}
                        {(activeTab === 'ALL' || activeTab === 'WIKI') && filteredWiki.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-orange-500" />
                                        Wiki Pages
                                    </h2>
                                    {activeTab === 'ALL' && <button onClick={() => setActiveTab('WIKI')} className="text-xs text-subheading hover:text-heading hover:underline">View All</button>}
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {filteredWiki.slice(0, activeTab === 'ALL' ? 3 : undefined).map(page => (
                                        <div key={page.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 hover:bg-[var(--notion-bg-secondary)] rounded-sm border border-transparent hover:border-[var(--notion-border-default)] transition-all group cursor-pointer">
                                            <div className="p-2 bg-orange-50 rounded-sm text-orange-600">
                                                <BookOpen className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-heading text-sm mb-0.5 truncate">{page.title}</h3>
                                                <p className="text-xs text-subheading truncate opacity-80">{page.content.substring(0, 100)}...</p>
                                            </div>
                                            <div className="text-xs text-subheading hidden sm:block whitespace-nowrap">
                                                Updated {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Spaces Section */}
                        {(activeTab === 'ALL' || activeTab === 'SPACES') && filteredSpaces.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                                        <Folder className="w-4 h-4 text-yellow-500" />
                                        Spaces
                                    </h2>
                                    {activeTab === 'ALL' && <button onClick={() => setActiveTab('SPACES')} className="text-xs text-subheading hover:text-heading hover:underline">View All</button>}
                                </div>
                                <div className={cn(
                                    "grid gap-4",
                                    viewMode === 'GRID' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                                )}>
                                    {filteredSpaces.slice(0, activeTab === 'ALL' ? 4 : undefined).map((space: any) => (
                                        <Link key={space.id} href={`/spaces/${space.id}`} className="block group">
                                            <div className="bg-[var(--notion-bg-primary)] border border-[var(--notion-border-default)] group-hover:border-blue-400 rounded-sm p-4 h-full transition-all">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div
                                                        className="w-8 h-8 rounded-sm flex items-center justify-center text-white font-bold text-xs"
                                                        style={{ backgroundColor: space.color || '#0052CC' }}
                                                    >
                                                        {space.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <h3 className="font-bold text-heading text-sm truncate group-hover:text-blue-600 transition-colors">{space.name}</h3>
                                                </div>
                                                <p className="text-xs text-subheading line-clamp-2 mb-3 h-8">{space.description || 'No description available.'}</p>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-subheading uppercase tracking-wider">
                                                    <span className="bg-[var(--notion-bg-secondary)] px-1.5 py-0.5 rounded-sm border border-[var(--notion-border-default)]">
                                                        {space.type}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{space._count?.projects || 0} projects</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Empty States */}
                        {activeTab === 'ALL' && filteredDocuments.length === 0 && filteredWiki.length === 0 && filteredSpaces.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Search className="w-12 h-12 text-[var(--notion-border-default)] mb-4" />
                                <h3 className="text-lg font-bold text-heading mb-1">No results found</h3>
                                <p className="text-sm text-subheading max-w-md">
                                    We couldn't find anything matching "{searchQuery}" in your library. Try adjusting your search or filters.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
