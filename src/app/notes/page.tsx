"use client";

import { FileText, Plus, Search, Folder, Tag, Users } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function NotesPage() {
    const [notes] = useState<any[]>([]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#172B4D] mb-2 tracking-tight">Notes Maker</h1>
                    <p className="text-[#6B778C] text-sm md:text-base">Create and collaborate on team notes</p>
                </div>
                <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                    New Note
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B778C]" />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        className="w-full bg-white border border-[#DFE1E6] rounded-sm py-3 pl-10 pr-4 text-sm text-[#172B4D] placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" leftIcon={<Tag className="w-4 h-4" />}>
                        Tags
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={<Folder className="w-4 h-4" />}>
                        Folders
                    </Button>
                </div>
            </div>

            {/* Notes Grid */}
            {notes.length === 0 ? (
                <div className="bg-white border border-[#DFE1E6] rounded-sm p-12 text-center">
                    <FileText className="w-12 h-12 text-[#DFE1E6] mx-auto mb-3" />
                    <p className="text-sm text-[#6B778C] mb-4">No notes yet</p>
                    <p className="text-xs text-[#97A0AF] mb-6 max-w-md mx-auto">
                        Create your first note to start documenting ideas, meeting notes, or project documentation
                    </p>
                    <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                        Create Note
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notes.map((note) => (
                        <NoteCard key={note.id} note={note} />
                    ))}
                </div>
            )}

            {/* Feature Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-sm p-6">
                <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-bold text-purple-900 mb-1">Rich Text Editor Coming Soon</h3>
                        <p className="text-xs text-purple-700">
                            Create beautiful notes with a Notion-style block editor. Features include:
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-purple-700">
                            <li className="flex items-start gap-2">
                                <span className="text-purple-600 mt-0.5">•</span>
                                <span>Rich text formatting with headings, lists, and code blocks</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-600 mt-0.5">•</span>
                                <span>Collaborative editing with team members</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-600 mt-0.5">•</span>
                                <span>Tags and organization for easy retrieval</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NoteCard({ note }: any) {
    return (
        <div className="bg-white border border-[#DFE1E6] rounded-sm p-4 hover:shadow-md hover:border-[#0052CC] transition-all cursor-pointer group">
            <h3 className="font-bold text-[#172B4D] group-hover:text-[#0052CC] transition-colors mb-2 line-clamp-2">
                {note.title}
            </h3>
            <p className="text-xs text-[#6B778C] mb-3 line-clamp-3">{note.content}</p>
            <div className="flex items-center justify-between text-xs text-[#97A0AF]">
                <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{note.collaborators} collaborators</span>
                </div>
                <span>{note.updatedAt}</span>
            </div>
        </div>
    );
}
