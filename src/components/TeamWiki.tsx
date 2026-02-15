"use client";

import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Plus,
    Save,
    Trash2,
    ChevronRight,
    Edit3,
    Clock,
    User,
    Loader2,
    Check,
    X
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';

interface WikiPage {
    id: string;
    title: string;
    content: string;
    authorId: string;
    updatedAt: string;
}

interface TeamWikiProps {
    projectId: string;
}

const TeamWiki: React.FC<TeamWikiProps> = ({ projectId }) => {
    const { showToast } = useToast();
    const [pages, setPages] = useState<WikiPage[]>([]);
    const [activePage, setActivePage] = useState<WikiPage | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        fetchPages();
    }, [projectId]);

    const fetchPages = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/wiki?projectId=${projectId}`);
            if (response.ok) {
                const data = await response.json();
                setPages(data);
                if (data.length > 0 && !activePage) {
                    setActivePage(data[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch wiki pages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePage = async () => {
        try {
            const response = await fetch('/api/wiki', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    title: 'New Article',
                    content: '# Engineering Whitepaper\n\nDocument your process here...',
                    authorId: 'LEAD_ARCHITECT'
                }),
            });
            if (response.ok) {
                const newPage = await response.json();
                setPages([newPage, ...pages]);
                setActivePage(newPage);
                startEditing(newPage);
            }
        } catch (error) {
            console.error('Failed to create wiki page:', error);
        }
    };

    const handleSave = async () => {
        if (!activePage) return;
        setIsSaving(true);
        try {
            const response = await fetch('/api/wiki', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: activePage.id,
                    title: editTitle,
                    content: editContent
                }),
            });
            if (response.ok) {
                const updatedPage = await response.json();
                setPages(pages.map(p => p.id === updatedPage.id ? updatedPage : p));
                setActivePage(updatedPage);
                setIsEditing(false);
                showToast(`Article "${updatedPage.title}" synchronized.`, 'success');
            }
        } catch (error) {
            console.error('Failed to save wiki page:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const startEditing = (page: WikiPage) => {
        setEditTitle(page.title);
        setEditContent(page.content);
        setIsEditing(true);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 min-h-[600px]">
            {/* Sidebar: Page List */}
            <div className="md:col-span-1 border-r border-[#DFE1E6] pr-4 space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-bold text-[#6B778C] uppercase tracking-widest flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5" /> Documentation
                    </h3>
                    <button
                        onClick={handleCreatePage}
                        className="p-1.5 hover:bg-[#DEEBFF] rounded text-[#0052CC] transition-all"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-0.5">
                    {isLoading ? (
                        <div className="py-8 flex justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-[#6B778C]" />
                        </div>
                    ) : pages.length === 0 ? (
                        <p className="text-xs text-[#6B778C] italic px-3">No active articles.</p>
                    ) : (
                        pages.map(page => (
                            <button
                                key={page.id}
                                onClick={() => {
                                    setActivePage(page);
                                    setIsEditing(false);
                                }}
                                className={cn(
                                    "w-full text-left px-3 py-2 rounded-sm text-sm transition-all flex items-center justify-between group",
                                    activePage?.id === page.id
                                        ? "bg-[#DEEBFF] text-[#0052CC] font-bold border-l-2 border-[#0052CC]"
                                        : "text-[#42526E] hover:bg-[#F4F5F7] border-l-2 border-transparent"
                                )}
                            >
                                <span className="truncate">{page.title}</span>
                                <ChevronRight className={cn(
                                    "w-3 h-3 transition-opacity",
                                    activePage?.id === page.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )} />
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content: Document Editor/Viewer */}
            <div className="md:col-span-3">
                {activePage ? (
                    <div className="card-eusai overflow-hidden flex flex-col h-full min-h-[500px] p-0 border-[#DFE1E6]">
                        {/* Toolbar */}
                        <div className="px-8 py-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#F4F5F7]/50">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="bg-white border border-[#DFE1E6] rounded-sm px-4 py-1.5 text-lg font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/50 flex-1 mr-6"
                                />
                            ) : (
                                <h2 className="text-xl font-bold text-[#172B4D]">{activePage.title}</h2>
                            )}

                            <div className="flex items-center gap-2">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-3 py-1.5 text-xs font-bold text-[#42526E] hover:text-[#172B4D]"
                                        >
                                            Discard
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="btn-eusai-create flex items-center gap-2"
                                        >
                                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            Publish
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => startEditing(activePage)}
                                        className="p-2 hover:bg-[#EBECF0] rounded text-[#42526E]"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-8 bg-white">
                            {isEditing ? (
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full h-full bg-transparent text-[#172B4D] font-mono text-sm resize-none focus:outline-none leading-relaxed"
                                    placeholder="Use markdown to structure project knowledge..."
                                />
                            ) : (
                                <div className="max-w-none">
                                    <div className="flex items-center gap-6 text-[10px] font-bold text-[#6B778C] uppercase tracking-widest mb-10 border-b border-[#DFE1E6] pb-4">
                                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {activePage.authorId}</span>
                                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(activePage.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-[#172B4D] text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                        {activePage.content}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="card-eusai flex flex-col items-center justify-center p-20 text-center h-full min-h-[500px] border-dashed border-2 border-[#DFE1E6]">
                        <BookOpen className="w-12 h-12 text-[#DFE1E6] mb-4" />
                        <h3 className="text-[#172B4D] font-bold mb-2">Knowledge Base Interface</h3>
                        <p className="text-[#6B778C] text-xs max-w-xs mx-auto mb-8">
                            Initialize a new project whitepaper or select an existing index to view technical documentation.
                        </p>
                        <button
                            onClick={handleCreatePage}
                            className="btn-eusai-create flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> New Article
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamWiki;
