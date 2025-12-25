"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { Navbar } from '@/components/Navbar';
import { Upload, Play, Pause, Download, Minus, Plus, RefreshCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AudioPitchPage() {
    // Audio State
    const [audioBuffer, setAudioBuffer] = useState<Tone.ToneAudioBuffer | null>(null);
    const [originalDuration, setOriginalDuration] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [pitch, setPitch] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [preserveTempo, setPreserveTempo] = useState(true);
    const [fileName, setFileName] = useState<string | null>(null);

    // Refs for Tone.js infrastructure
    const playerRef = useRef<Tone.Player | null>(null);
    const pitchShiftRef = useRef<Tone.PitchShift | null>(null);

    // Initialize Tone.js on user interaction (playback)
    const initAudio = async () => {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
    };

    // Handle File Upload
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsProcessing(true);
        setIsPlaying(false);

        // reset
        if (playerRef.current) {
            playerRef.current.stop();
            playerRef.current.dispose();
            playerRef.current = null;
        }

        try {
            await initAudio();
            const arrayBuffer = await file.arrayBuffer();
            const buffer = await Tone.context.decodeAudioData(arrayBuffer);

            setAudioBuffer(new Tone.ToneAudioBuffer(buffer));
            setOriginalDuration(buffer.duration);

            // Initialize Player & Effects
            playerRef.current = new Tone.Player(buffer).toDestination();
            playerRef.current.loop = false;

            // Setup PitchShift
            pitchShiftRef.current = new Tone.PitchShift(0).toDestination();
            playerRef.current.disconnect(); // Disconnect from master
            playerRef.current.connect(pitchShiftRef.current); // Connect through pitch shifter

            playerRef.current.onstop = () => setIsPlaying(false);

            setIsProcessing(false);
        } catch (error) {
            console.error("Error decoding audio:", error);
            setIsProcessing(false);
            alert("Could not decode audio file.");
        }
    };

    // Create a new effect chain when inputs change
    useEffect(() => {
        if (!pitchShiftRef.current || !playerRef.current) return;

        // Tone.PitchShift handles tempo preservation automatically if used correctly, 
        // BUT for simple pitch shifting without tempo change (chipmunk), we use playbackRate.
        // Tone.PitchShift is granular synthesis, so it ALWAYS preserves tempo but changes pitch.

        if (preserveTempo) {
            // Use PitchShift effect
            pitchShiftRef.current.pitch = pitch;
            playerRef.current.playbackRate = 1;
        } else {
            // Chipmunk Mode: Disable pitch shift effect (set to 0) and use playbackRate
            // This is tricky because PitchShift adds latency. 
            // Better workflow: Disconnect pitch shift and play directly if !preserveTempo
            pitchShiftRef.current.pitch = 0;
            const rate = Math.pow(2, pitch / 12);
            playerRef.current.playbackRate = rate;
        }

    }, [pitch, preserveTempo]);

    // Play/Pause
    const togglePlayback = async () => {
        if (!playerRef.current) return;
        await initAudio();

        if (isPlaying) {
            playerRef.current.stop();
        } else {
            playerRef.current.start();
        }
        setIsPlaying(!isPlaying);
    };

    // Download / Export (Offline Rendering)
    const handleDownload = async () => {
        if (!audioBuffer) return;
        setIsProcessing(true);

        try {
            const originalBuffer = audioBuffer.get(); // native AudioBuffer
            // Calculate new duration if using playbackRate (chipmunk)
            // If preserving tempo, duration is roughly same.
            let duration = originalBuffer.duration;
            if (!preserveTempo) {
                const rate = Math.pow(2, pitch / 12);
                duration = duration / rate;
            }

            // Offline Context
            const resultBuffer = await Tone.Offline(async () => {
                const player = new Tone.Player(originalBuffer);

                if (preserveTempo) {
                    const shifter = new Tone.PitchShift(pitch).toDestination();
                    player.connect(shifter);
                } else {
                    const rate = Math.pow(2, pitch / 12);
                    player.playbackRate = rate;
                    player.toDestination();
                }
                player.start(0);
            }, duration + 0.5); // Add slight buffer tail

            // Convert AudioBuffer to WAV
            // (We need a simple helper or do it manually, Tone doesn't export WAV directly)
            // For this MVP, let's assume we implement a `audioBufferToWav` util.
            // PLACEHOLDER: Since we can't easily implement WAV encoder in one file without deps,
            // we will warn user or use a simple hack.

            // ...Actually, let's implement a simple WAV encoder inline for robustness.
            const wavBlob = audioBufferToWav(resultBuffer);
            const url = URL.createObjectURL(wavBlob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `shifted_${fileName || 'audio'}.wav`;
            a.click();
            URL.revokeObjectURL(url);

        } catch (e) {
            console.error(e);
            alert("Export failed");
        } finally {
            setIsProcessing(false);
        }
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
                    <p className="text-slate-500 mb-8">Upload a song, change the key, preserve the tempo.</p>

                    {/* File Upload / Status */}
                    <div className="mb-10">
                        {!audioBuffer ? (
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
                                <div className="text-slate-500 text-sm mb-4">Duration: {Math.round(originalDuration)}s</div>
                                <button
                                    onClick={() => {
                                        setAudioBuffer(null);
                                        playerRef.current?.stop();
                                        setIsPlaying(false);
                                    }}
                                    className="text-xs text-[#5A7863] bg-white px-3 py-1 rounded-full border border-[#90AB8B]/30 hover:bg-[#90AB8B] hover:text-white transition-colors"
                                >
                                    Change File
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Controls (Only if file loaded) */}
                    <div className={cn("transition-all duration-500", !audioBuffer ? "opacity-30 pointer-events-none blur-sm" : "opacity-100")}>

                        {/* Pitch Control */}
                        <div className="flex flex-col items-center gap-6 mb-10">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semitone Shift</label>

                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => setPitch(Math.max(-12, pitch - 1))}
                                    className="h-16 w-16 flex items-center justify-center rounded-full bg-slate-50 border-2 border-slate-200 shadow-lg text-slate-400 hover:text-[#90AB8B] hover:border-[#90AB8B] hover:scale-105 transition-all text-2xl active:scale-95 disabled:opacity-50"
                                >
                                    <Minus />
                                </button>

                                <div className="flex flex-col items-center w-32">
                                    <span className={cn("text-6xl font-black tabular-nums transition-colors", pitch !== 0 ? "text-[#90AB8B]" : "text-slate-200")}>
                                        {pitch > 0 ? `+${pitch}` : pitch}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 mt-2">SEMITONES</span>
                                </div>

                                <button
                                    onClick={() => setPitch(Math.min(12, pitch + 1))}
                                    className="h-16 w-16 flex items-center justify-center rounded-full bg-slate-50 border-2 border-slate-200 shadow-lg text-slate-400 hover:text-[#90AB8B] hover:border-[#90AB8B] hover:scale-105 transition-all text-2xl active:scale-95 disabled:opacity-50"
                                >
                                    <Plus />
                                </button>
                            </div>

                            <button
                                onClick={() => setPitch(0)}
                                className={cn("text-xs font-bold px-3 py-1 rounded-full transition-all", pitch !== 0 ? "text-slate-500 hover:bg-slate-100" : "text-slate-300 opacity-0 pointer-events-none")}
                            >
                                <RefreshCcw size={12} className="inline mr-1" /> Reset
                            </button>
                        </div>

                        {/* Options */}
                        <div className="flex justify-center mb-10">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn("w-12 h-6 rounded-full p-1 transition-colors duration-300 relative", preserveTempo ? "bg-[#90AB8B]" : "bg-slate-200")}>
                                    <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300", preserveTempo ? "translate-x-6" : "translate-x-0")} />
                                </div>
                                <input type="checkbox" className="hidden" checked={preserveTempo} onChange={(e) => setPreserveTempo(e.target.checked)} />
                                <span className="text-sm font-semibold text-slate-600 group-hover:text-[#90AB8B] transition-colors">Preserve Tempo</span>
                            </label>
                        </div>


                        {/* Action Bar */}
                        <div className="flex items-center justify-center gap-4 border-t border-slate-100 pt-8">
                            {/* Playback */}
                            <button
                                onClick={togglePlayback}
                                className={cn("flex items-center gap-3 px-8 py-4 rounded-full text-white font-bold shadow-xl transition-all hover:scale-105 hover:shadow-2xl active:scale-95 min-w-[180px] justify-center",
                                    isPlaying ? "bg-amber-400 hover:bg-amber-500 shadow-amber-200" : "bg-[#90AB8B] hover:bg-[#7fa378] shadow-[#90AB8B]/30"
                                )}
                            >
                                {isProcessing ? (
                                    <Loader2 className="animate-spin" />
                                ) : isPlaying ? (
                                    <>
                                        <Pause fill="currentColor" /> Pause
                                    </>
                                ) : (
                                    <>
                                        <Play fill="currentColor" /> Play Shifted
                                    </>
                                )}
                            </button>

                            {/* Download */}
                            <button
                                onClick={handleDownload}
                                disabled={isProcessing}
                                className="flex items-center justify-center h-14 w-14 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-[#90AB8B] hover:border-[#90AB8B] hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                title="Download WAV"
                            >
                                <Download size={24} />
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

// ---- WAV Encoder Helper (Minimal) ----
function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    const channels = [];
    let i, sample, offset = 0, pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (hardcoded in this writer)

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // write interleaved data
    for (i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));

    while (pos < buffer.length) {
        for (i = 0; i < numOfChan; i++) { // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(44 + offset, sample, true); // write 16-bit sample
            offset += 2;
        }
        pos++;
    }

    return new Blob([bufferArr], { type: "audio/wav" });

    function setUint16(data: any) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: any) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}
