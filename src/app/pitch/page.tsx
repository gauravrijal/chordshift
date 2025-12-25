```
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Upload, Download, Minus, Plus, RefreshCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Audio Utilities
import { decodeAudio } from '@/audio/decode';
import { processAudio } from '@/audio/processor'; // Now using SoundTouch / OfflineContext approach
import { audioBufferToWav } from '@/audio/waveEncoder';

export default function AudioPitchPage() {
    
    // State
    const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
    const [processedBlobUrl, setProcessedBlobUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [pitch, setPitch] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Debounce processing: wait for user to stop clicking
    const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initial Load
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsProcessing(true);
        setProcessedBlobUrl(null);

        try {
            const buffer = await decodeAudio(file);
            setOriginalBuffer(buffer);
            setPitch(0);
            
            // Initial: No pitch shift, just create WAV from original for consistency
            const wav = audioBufferToWav(buffer);
            const url = URL.createObjectURL(wav);
            setProcessedBlobUrl(url);

            setIsProcessing(false);
        } catch (error) {
            console.error("Error decoding:", error);
            alert("Could not load audio. Please use WAV or MP3.");
            setIsProcessing(false);
        }
    };

    // Handle Pitch Change
    const changePitch = (newPitch: number) => {
        setPitch(newPitch);
        
        if (!originalBuffer) return;

        setIsProcessing(true);

        // Clear existing debounce
        if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
        }

        // Set minimal debounce to avoid choppy UI
        processingTimeoutRef.current = setTimeout(async () => {
            try {
                // Process
                const shiftedBuffer = await processAudio(originalBuffer, newPitch);
                
                // Encode
                const wav = audioBufferToWav(shiftedBuffer);
                const url = URL.createObjectURL(wav);
                
                // Release old URL to stop leak
                if (processedBlobUrl) {
                    URL.revokeObjectURL(processedBlobUrl);
                }

                setProcessedBlobUrl(url);
            } catch (e) {
                console.error("Processing failed", e);
                alert("Audio processing failed.");
            } finally {
                setIsProcessing(false);
            }
        }, 500); // 500ms delay to wait for clicks to settle
    };

    // Download Handler
    const handleDownload = () => {
        if (!processedBlobUrl) return;
        const a = document.createElement('a');
        a.href = processedBlobUrl;
        a.download = `shifted_${ fileName || 'audio' }.wav`;
        a.click();
    };

    return (
        <div className="flex flex-col min-h-screen lg:h-screen lg:min-h-[850px] p-4 sm:p-6 lg:p-8 font-sans bg-gradient-to-br from-[#EBF4DD] via-[#90AB8B] to-[#5A7863] animate-gradient-x relative selection:bg-[#90AB8B]/30 selection:text-emerald-900 lg:overflow-y-auto transition-colors duration-500">
             {/* Animated Blobs (Matched) */}
             <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#90AB8B] rounded-full blur-3xl opacity-20 animate-blob -z-10 mix-blend-multiply" />
             <div className="fixed top-20 right-0 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-30 animate-blob animation-delay-2000 -z-10 mix-blend-multiply" />
             <div className="fixed -bottom-40 left-20 w-96 h-96 bg-[#90AB8B] rounded-full blur-3xl opacity-20 animate-blob animation-delay-4000 -z-10 mix-blend-multiply" />

            {/* Navbar */}
            <Navbar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center mb-6 w-full max-w-4xl mx-auto">
                <div className="w-full bg-white/90 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-slate-200/50 p-8 lg:p-12 ring-1 ring-white/50 text-center animate-in zoom-in-95 duration-300">
                    
                    <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Audio Pitch Shift</h1>
                    <p className="text-slate-500 mb-8">High-quality pitch shifting while preserving tempo.</p>

                    {/* File Upload / Status */}
                    <div className="mb-10">
                        {!originalBuffer ? (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-3xl cursor-pointer hover:bg-slate-50 hover:border-[#90AB8B] transition-all group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-[#90AB8B]/10 group-hover:text-[#90AB8B] text-slate-400">
                                         <Upload size={32} />
                                    </div>
                                    <p className="mb-2 text-sm text-slate-500 font-semibold">Click to upload audio</p>
                                    <p className="text-xs text-slate-400">MP3, WAV, M4A</p>
                                </div>
                                <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
                            </label>
                        ) : (
                            <div className="bg-[#EBF4DD]/50 rounded-2xl p-6 flex flex-col items-center border border-[#90AB8B]/20">
                                <div className="text-slate-800 font-bold text-lg mb-1">{fileName}</div>
                                <div className="text-slate-500 text-sm mb-4">Original Duration: {Math.round(originalBuffer.duration)}s</div>
                                <button 
                                    onClick={() => {
                                        setOriginalBuffer(null);
                                        setProcessedBlobUrl(null);
                                        setPitch(0);
                                    }}
                                    className="text-xs text-[#5A7863] bg-white px-3 py-1 rounded-full border border-[#90AB8B]/30 hover:bg-[#90AB8B] hover:text-white transition-colors"
                                >
                                    Change File
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Controls & Player */}
                    <div className={cn("transition-all duration-500", !originalBuffer ? "opacity-30 pointer-events-none blur-sm" : "opacity-100")}>
                        
                         {/* Pitch Semitone Control */}
                         <div className="flex flex-col items-center gap-6 mb-10">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semitone Shift</label>
                            
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => changePitch(Math.max(-12, pitch - 1))}
                                    disabled={isProcessing}
                                    className="h-16 w-16 flex items-center justify-center rounded-full bg-slate-50 border-2 border-slate-200 shadow-lg text-slate-400 hover:text-[#90AB8B] hover:border-[#90AB8B] hover:scale-105 transition-all text-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Minus />
                                </button>

                                <div className="flex flex-col items-center w-32 relative">
                                     {isProcessing && (
                                         <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                                             <Loader2 className="animate-spin text-[#90AB8B]" />
                                         </div>
                                     )}
                                     <span className={cn("text-6xl font-black tabular-nums transition-colors", pitch !== 0 ? "text-[#90AB8B]" : "text-slate-200")}>
                                        {pitch > 0 ? `+ ${ pitch } ` : pitch}
                                     </span>
                                     <span className="text-xs font-bold text-slate-400 mt-2">SEMITONES</span>
                                </div>

                                <button
                                    onClick={() => changePitch(Math.min(12, pitch + 1))}
                                    disabled={isProcessing}
                                    className="h-16 w-16 flex items-center justify-center rounded-full bg-slate-50 border-2 border-slate-200 shadow-lg text-slate-400 hover:text-[#90AB8B] hover:border-[#90AB8B] hover:scale-105 transition-all text-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus />
                                </button>
                            </div>

                            <button
                                onClick={() => changePitch(0)}
                                className={cn("text-xs font-bold px-3 py-1 rounded-full transition-all", pitch !== 0 ? "text-slate-500 hover:bg-slate-100" : "text-slate-300 opacity-0 pointer-events-none")}
                            >
                                <RefreshCcw size={12} className="inline mr-1" /> Reset
                            </button>
                        </div>

                        {/* Custom Player */}
                        <div className="flex flex-col items-center gap-8 border-t border-slate-100 pt-8">
                             
                             <AudioPlayer 
                                src={processedBlobUrl} 
                                isLoading={isProcessing}
                                className="w-full" 
                             />

                             {/* Download */}
                             <button
                                onClick={handleDownload}
                                disabled={isProcessing || !processedBlobUrl}
                                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-[#90AB8B] hover:border-[#90AB8B] hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none font-bold text-sm"
                             >
                                 <Download size={18} /> Download Shifted WAV
                             </button>
                        </div>
                    </div>

                </div>
            </main>

            <footer className="flex-none py-4 text-center">
                <p className="text-white/90 text-xs font-semibold tracking-wide drop-shadow-md">Designed for Musicians • Simple & Accurate</p>
            </footer>
        </div>
    );
}
```
