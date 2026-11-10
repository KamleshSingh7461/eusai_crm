"use client";

import React, { useState, useRef } from 'react';
import {
    X,
    Upload,
    FileText,
    Image as ImageIcon,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { NotionButton } from '@/components/notion';

interface CompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (remarks: string, proofUrl?: string) => Promise<void>;
    title: string;
    type: 'TASK' | 'MILESTONE';
}

export default function CompletionModal({ isOpen, onClose, onComplete, title, type }: CompletionModalProps) {
    const { showToast } = useToast();
    const [remarks, setRemarks] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
                showToast('Files must be 10 MB or smaller', 'error');
                return;
            }
            setFile(selectedFile);
            if (selectedFile.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(selectedFile));
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleUpload = async (): Promise<string | undefined> => {
        if (!file) return undefined;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Request failed');
            const data = await res.json();
            return data.url;
        } catch (error) {
            showToast('Upload failed', 'error');
            return undefined;
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!remarks.trim()) {
            showToast('A completion note is required', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const proofUrl = await handleUpload();
            if (file && !proofUrl) {
                setIsSubmitting(false);
                return; // Upload failed, error already shown
            }

            await onComplete(remarks, proofUrl);
            onClose();
            setRemarks('');
            setFile(null);
            setPreviewUrl(null);
        } catch (error) {
            showToast('Final synchronization failure', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center sm:p-6 bg-black/70 animate-in fade-in duration-200">
            <div
                className="bg-[#111113] border border-white/[0.08] rounded-2xl border-white/[0.08] rounded-2xl w-full rounded-b-none sm:rounded-b-3xl max-w-lg animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-b-3xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-4 sm:px-8 py-6 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between bg-emerald-500/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-display text-base font-semibold text-white">Complete task</h3>
                            <div className="text-[11px] font-semibold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                                <Activity className="w-3 h-3" />
                                Final Yield Verification
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[rgba(255,255,255,0.3)] hover:text-white transition-colors p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-8 flex-1 overflow-y-auto">
                    {/* Mission Header */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 block">Task</label>
                        <div className="text-xl font-semibold text-white tracking-tight leading-tight">
                            {title}
                        </div>
                    </div>

                    {/* Remarks/Review */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-300 block">Completion note</label>
                        <textarea
                            required
                            autoFocus
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full bg-[#18181B] border border-[rgba(255,255,255,0.1)] rounded-xl p-4 text-sm font-semibold tracking-tight focus:ring-1 focus:ring-emerald-500 transition-all min-h-[140px] text-white resize-none shadow-inner placeholder-[rgba(255,255,255,0.2)]"
                            placeholder="Provide a critical assessment of the work performed, key outcomes, and any follow-up required..."
                        />
                    </div>

                    {/* Evidence/Proof Upload */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-300 block">Proof of completion (optional PDF or image)</label>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer overflow-hidden group",
                                file ? "border-emerald-500/40 bg-emerald-500/5" : "border-[rgba(255,255,255,0.08)] bg-[#18181B] hover:border-emerald-500/30 hover:bg-emerald-500/5"
                            )}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-20 filter grayscale group-hover:grayscale-0 transition-all" />
                            ) : file ? (
                                <FileText className="absolute inset-0 w-full h-full p-6 sm:p-12 text-emerald-500/10" />
                            ) : null}

                            <div className="relative z-10 flex flex-col items-center text-center gap-3">
                                {file ? (
                                    <>
                                        {file.type.startsWith('image/') ? <ImageIcon className="w-10 h-10 text-emerald-400" /> : <FileText className="w-10 h-10 text-emerald-400" />}
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-white tracking-tight truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-[11px] font-semibold text-emerald-500/60">{(file.size / 1024 / 1024).toFixed(2)} MB - Payload Armed</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                                            <Upload className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold text-white">Deposit Yield Evidence</p>
                                            <p className="text-[11px] font-semibold text-[rgba(255,255,255,0.25)] mt-1">Image or PDF - MAX 10MB</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*,.pdf"
                            />
                        </div>
                    </div>

                    {/* Warning/Info */}
                    <div className="flex items-start gap-3 p-4 bg-blue-500/5 rounded-lg border border-blue-500/10">
                        <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-semibold text-blue-400/70 tracking-tight leading-normal">
                            Completion of this mission is irreversible and will be logged in the permanent yield ledger. Ensure all review metrics are accurate.
                        </p>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-4 pt-4 shrink-0">
                        <NotionButton
                            type="button"
                            variant="default"
                            onClick={onClose}
                            className="flex-1 bg-transparent border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] px-6 font-semibold text-[11px] h-11"
                        >
                            Abort
                        </NotionButton>
                        <NotionButton
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/40 font-semibold text-[11px] h-11"
                        >
                            {isSubmitting || isUploading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    SYNCING YIELD...
                                </span>
                            ) : (
                                "VALIDATE COMPILATION"
                            )}
                        </NotionButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
