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
import Modal, { ModalIcon } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { FieldLabel, fieldClass } from '@/components/ui/Field';

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

    const noun = type === 'MILESTONE' ? 'milestone' : 'task';

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            size="md"
            title={`Mark ${noun} as done`}
            description={title}
            icon={<ModalIcon tone="emerald"><CheckCircle2 /></ModalIcon>}
            onSubmit={handleSubmit}
            closeOnBackdrop={false}
            footer={<>
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="success" isLoading={isSubmitting || isUploading} disabled={!remarks.trim()} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
                    {isUploading ? 'Uploading…' : `Mark as done`}
                </Button>
            </>}
        >
            <div className="space-y-5">
                <div>
                    <FieldLabel htmlFor="completion-note" required>Completion note</FieldLabel>
                    <textarea
                        id="completion-note"
                        required
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        rows={5}
                        className={cn(fieldClass, 'h-auto resize-y py-2.5 leading-relaxed')}
                        placeholder="What was delivered, the outcome, and any follow-up needed"
                    />
                </div>

                <div>
                    <FieldLabel>Proof of completion <span className="font-normal text-zinc-500">(optional)</span></FieldLabel>
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                        className={cn('flex w-full items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-left transition-colors',
                            file ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : 'border-[#2F2F35] bg-[#18181B] hover:border-[#3A3A41] hover:bg-[#1F1F23]')}>
                        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg', file ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-300')}>
                            {previewUrl ? <img src={previewUrl} alt="" className="h-full w-full object-cover" /> : file ? (file.type.startsWith('image/') ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />) : <Upload className="h-5 w-5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-zinc-100">{file ? file.name : 'Attach an image or PDF'}</span>
                            <span className="block text-xs text-zinc-500">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · tap to replace` : 'Up to 10 MB'}</span>
                        </span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf" />
                </div>

                <p className="flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Your note and file are saved with the {noun} and your lead is notified.
                </p>
            </div>
        </Modal>
    );
}
