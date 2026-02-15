"use client";

import React, { useState, useEffect } from 'react';
import {
    File,
    FileText,
    Image as ImageIcon,
    MoreVertical,
    Download,
    Trash2,
    Upload,
    Search,
    Filter,
    Loader2,
    CheckCircle2,
    MoreHorizontal
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';

interface Document {
    id: string;
    name: string;
    type: string;
    size: string;
    url: string;
    uploadedBy: string;
    createdAt: string;
}

interface DocumentVaultProps {
    projectId: string;
}

const DocumentVault: React.FC<DocumentVaultProps> = ({ projectId }) => {
    const { showToast } = useToast();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, [projectId]);

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/documents?projectId=${projectId}`);
            if (response.ok) {
                const data = await response.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadClick = () => {
        setIsUploading(true);
        setTimeout(async () => {
            const newDoc = {
                projectId,
                name: `EUSAI_Project_Plan_v${(documents.length + 1)}.pdf`,
                type: 'PDF',
                size: '2.4 MB',
                url: '#',
                uploadedBy: 'SYSTEM_ADMIN'
            };

            await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDoc),
            });

            fetchDocuments();
            setIsUploading(false);
            showToast(`Document uploaded: ${newDoc.name}`, 'success');
        }, 1500);
    };

    const getIcon = (type: string) => {
        const t = type.toUpperCase();
        if (t === 'PDF') return <FileText className="w-4 h-4 text-[#FF5630]" />;
        if (t === 'IMAGE' || t === 'PNG' || t === 'JPG') return <ImageIcon className="w-4 h-4 text-[#0052CC]" />;
        return <File className="w-4 h-4 text-[#6B778C]" />;
    };

    const filteredDocs = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B778C]" />
                    <input
                        type="text"
                        placeholder="Search workspace artifacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-[#DFE1E6] rounded-sm py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/50 focus:border-[#4C9AFF] transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-sm border border-[#DFE1E6] bg-white hover:bg-[#F4F5F7] text-[#42526E]">
                        <Filter className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="btn-eusai-create flex items-center gap-2"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>

            <div className="border border-[#DFE1E6] rounded-sm overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[#F4F5F7] border-b border-[#DFE1E6] text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">
                            <th className="px-6 py-3">File Name</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Size</th>
                            <th className="px-6 py-3">Modified</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFE1E6] text-sm">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-[#6B778C]">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-[#0052CC]" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Synchronizing Vault...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredDocs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-[#6B778C] text-xs italic">
                                    Archive is empty.
                                </td>
                            </tr>
                        ) : (
                            filteredDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-[#F4F5F7] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {getIcon(doc.type)}
                                            <span className="font-medium text-[#172B4D] group-hover:text-[#0052CC] transition-colors cursor-pointer">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-[#EBECF0] text-[#42526E] px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border border-[#DFE1E6]">
                                            {doc.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[#6B778C] text-xs">{doc.size}</td>
                                    <td className="px-6 py-4 text-[#6B778C] text-xs">
                                        {new Date(doc.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 hover:bg-[#EBECF0] rounded text-[#42526E]">
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                            <button className="p-1.5 hover:bg-[#FFEBE6] rounded text-[#BF2600]">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="card-eusai bg-[#F4F5F7]/30">
                    <h4 className="text-[11px] font-bold text-[#172B4D] uppercase tracking-wider mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#36B37E]" /> Governance Standard
                    </h4>
                    <p className="text-xs text-[#6B778C] leading-snug">
                        All artifacts undergo automated cryptographic verification. Version history is immutable within the current project scope.
                    </p>
                </div>
                <div className="card-eusai bg-white">
                    <h4 className="text-[11px] font-bold text-[#172B4D] uppercase tracking-wider mb-2">
                        Vault Integrity
                    </h4>
                    <p className="text-xs text-[#6B778C] leading-snug">
                        Meta-tags and indexing are synchronized across workspace nodes to ensure zero-latency retrieval.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DocumentVault;
