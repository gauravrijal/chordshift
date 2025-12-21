"use strict";
import React, { useRef, useState } from 'react';
import { Camera, Sparkles, Loader2, X } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { cn } from '@/lib/utils';

interface OCRImportProps {
    onImport: (text: string) => void;
    className?: string;
}

export function OCRImport({ onImport, className }: OCRImportProps) {
    const [image, setImage] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (typeof ev.target?.result === 'string') {
                    setImage(ev.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const runOCR = async () => {
        if (!image) return;
        setScanning(true);
        try {
            const worker = await createWorker('eng');
            const { data: { text } } = await worker.recognize(image);
            onImport(text);
            await worker.terminate();
        } catch (err) {
            console.error("OCR Failed", err);
            alert("Could not extract text.");
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className={cn("flex flex-col items-center justify-center", className)}>
            {!image ? (
                <div
                    className="w-full h-48 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="bg-blue-50 p-4 rounded-full mb-3 text-blue-500 group-hover:scale-110 transition-transform">
                        <Camera size={24} />
                    </div>
                    <h3 className="font-semibold text-slate-900">Click to Upload</h3>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG or Screenshot</p>
                </div>
            ) : (
                <div className="w-full flex flex-col items-center gap-4">
                    <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-inner">
                        <img src={image} alt="Preview" className="w-full h-full object-contain" />
                        <button
                            onClick={() => setImage(null)}
                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full backdrop-blur-sm transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {scanning ? (
                        <button disabled className="w-full bg-slate-100 text-slate-400 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-wait">
                            <Loader2 className="animate-spin" size={18} /> Processing...
                        </button>
                    ) : (
                        <button
                            onClick={runOCR}
                            className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all"
                        >
                            <Sparkles size={18} /> Extract Chords
                        </button>
                    )}
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/heic"
                onChange={handleFileChange}
            />
        </div>
    );
}
