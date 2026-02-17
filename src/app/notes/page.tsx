"use client";

import React, { useState, useEffect } from 'react';
import {
    FileText,
    Plus,
    Search,
    Trash2,
    Save,
    Clock,
    MoreVertical,
    ChevronLeft,
    Edit3,
    Layout
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface Note {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
    createdAt: string;
    color?: string;
}

export default function NotesPage() {
    const { data: session } = useSession();
    const [notes, setNotes] = useState<Note[]>([]);
    const [activeNote, setActiveNote] = useState<Note | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileListVisible, setIsMobileListVisible] = useState(true);

    // Load notes from localStorage on mount
    useEffect(() => {
        const savedNotes = localStorage.getItem('eusai_crm_notes');
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        }
    }, []);

    // Save notes to localStorage whenever they change
    useEffect(() => {
        if (notes.length > 0) {
            localStorage.setItem('eusai_crm_notes', JSON.stringify(notes));
        }
    }, [notes]);

    // Create a new note
    const createNote = () => {
        const newNote: Note = {
            id: Date.now().toString(),
            title: '',
            content: '',
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            color: '#191919'
        };
        setNotes([newNote, ...notes]);
        setActiveNote(newNote);
        setIsMobileListVisible(false);
    };

    // Update active note
    const updateNote = (id: string, updates: Partial<Note>) => {
        const updatedNotes = notes.map(note =>
            note.id === id
                ? { ...note, ...updates, updatedAt: new Date().toISOString() }
                : note
        );
        setNotes(updatedNotes);

        // Also update the active note state to reflect changes immediately
        if (activeNote && activeNote.id === id) {
            setActiveNote({ ...activeNote, ...updates, updatedAt: new Date().toISOString() });
        }
    };

    // Delete note
    const deleteNote = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('Are you sure you want to delete this note?')) {
            const filteredNotes = notes.filter(n => n.id !== id);
            setNotes(filteredNotes);
            if (activeNote?.id === id) {
                setActiveNote(null);
                setIsMobileListVisible(true);
            }
            localStorage.setItem('eusai_crm_notes', JSON.stringify(filteredNotes));
        }
    };

    // Filter notes
    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4 md:gap-6 animate-in fade-in duration-500">
            {/* Sidebar List */}
            <div className={cn(
                "flex-1 md:flex-none md:w-80 flex flex-col gap-4 transition-all duration-300",
                activeNote && !isMobileListVisible ? "hidden md:flex" : "flex"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-1">
                    <h1 className="text-2xl font-bold text-[rgba(255,255,255,0.9)] tracking-tight flex items-center gap-2">
                        <Layout className="w-6 h-6 text-[#0052CC]" /> Notes
                    </h1>
                    <button
                        onClick={createNote}
                        className="p-2 bg-[#0052CC] hover:bg-[#0747A6] rounded-lg text-white transition-all shadow-lg hover:shadow-[#0052CC]/25"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.4)]" />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#191919]/60 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-xl py-3 pl-10 pr-4 text-sm text-[rgba(255,255,255,0.9)] placeholder-[rgba(255,255,255,0.4)] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/50 transition-all shadow-inner"
                    />
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {filteredNotes.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <FileText className="w-12 h-12 mx-auto mb-2 text-[rgba(255,255,255,0.2)]" />
                            <p className="text-sm text-[rgba(255,255,255,0.4)]">No notes found</p>
                        </div>
                    ) : (
                        filteredNotes.map((note) => (
                            <div
                                key={note.id}
                                onClick={() => {
                                    setActiveNote(note);
                                    setIsMobileListVisible(false);
                                }}
                                className={cn(
                                    "p-4 rounded-xl border border-transparent cursor-pointer transition-all group relative overflow-hidden",
                                    activeNote?.id === note.id
                                        ? "bg-[#0052CC]/10 border-[#0052CC]/30 shadow-md"
                                        : "bg-[#191919]/40 hover:bg-[#191919]/60 border-[rgba(255,255,255,0.05)]"
                                )}
                            >
                                <h3 className={cn(
                                    "font-bold mb-1 truncate pr-8",
                                    !note.title ? "text-[rgba(255,255,255,0.3)] italic" : "text-[rgba(255,255,255,0.9)]"
                                )}>
                                    {note.title || 'Untitled Note'}
                                </h3>
                                <p className="text-xs text-[rgba(255,255,255,0.5)] line-clamp-2 h-8">
                                    {note.content || 'No content...'}
                                </p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-[10px] text-[rgba(255,255,255,0.3)] flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(note.updatedAt).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={(e) => deleteNote(note.id, e)}
                                        className="p-1.5 text-[rgba(255,255,255,0.4)] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                {activeNote?.id === note.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0052CC]" />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Editor Area */}
            <div className={cn(
                "flex-1 bg-[#191919]/80 backdrop-blur-3xl rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-2xl overflow-hidden flex flex-col transition-all duration-300",
                !activeNote && isMobileListVisible ? "hidden md:flex opacity-50 pointer-events-none" : "flex"
            )}>
                {activeNote ? (
                    <>
                        {/* Editor Header */}
                        <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between bg-[#191919]/50">
                            <button
                                onClick={() => setIsMobileListVisible(true)}
                                className="md:hidden p-2 text-[rgba(255,255,255,0.6)] hover:text-white"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-xs text-[rgba(255,255,255,0.4)] font-mono">
                                Last edited: {new Date(activeNote.updatedAt).toLocaleString()}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => deleteNote(activeNote.id)}
                                    className="p-2 text-[rgba(255,255,255,0.6)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Delete Note"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Editor Content */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-10">
                            <input
                                type="text"
                                placeholder="Note Title"
                                value={activeNote.title}
                                onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                                className="w-full bg-transparent border-none text-3xl md:text-4xl font-bold text-[rgba(255,255,255,0.9)] placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-0 mb-6"
                            />
                            <textarea
                                placeholder="Start typing..."
                                value={activeNote.content}
                                onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                                className="w-full h-[calc(100%-80px)] bg-transparent border-none resize-none text-base md:text-lg text-[rgba(255,255,255,0.7)] placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-0 leading-relaxed custom-scrollbar"
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-[#191919] border border-[rgba(255,255,255,0.05)] flex items-center justify-center mb-6 shadow-inner">
                            <Edit3 className="w-8 h-8 text-[rgba(255,255,255,0.2)]" />
                        </div>
                        <h2 className="text-xl font-bold text-[rgba(255,255,255,0.8)] mb-2">Select a note to view</h2>
                        <p className="text-[rgba(255,255,255,0.4)] max-w-xs">
                            Choose a note from the sidebar or create a new one to get started.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
