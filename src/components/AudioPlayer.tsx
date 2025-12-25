"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
    src: string | null;
    isLoading?: boolean;
    className?: string;
}

export function AudioPlayer({ src, isLoading, className }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    // Reset when src changes
    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            // Auto-play when processed? Maybe better to let user choose.
            // Let's auto-play for better UX if it's a "Shift" operation result.
            // But browsers block auto-play sometimes. Let's start with paused.
        }
    }, [src]);

    const togglePlay = () => {
        if (!audioRef.current || !src) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            const time = parseFloat(e.target.value);
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (audioRef.current) {
            audioRef.current.volume = val;
        }
        setIsMuted(val === 0);
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        if (isMuted) {
            audioRef.current.volume = volume || 1;
            setIsMuted(false);
        } else {
            audioRef.current.volume = 0;
            setIsMuted(true);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className={cn("bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 p-6 flex flex-col gap-4 w-full max-w-2xl select-none", className)}>

            <audio
                ref={audioRef}
                src={src || undefined}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
            />

            {/* Top Row: Play/Pause/Loading & Time & Volume */}
            <div className="flex items-center justify-between gap-4">

                <button
                    onClick={togglePlay}
                    disabled={!src || isLoading}
                    className={cn(
                        "h-14 w-14 flex items-center justify-center rounded-full transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                        isPlaying
                            ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                            : "bg-[#90AB8B] text-white hover:bg-[#829b7d] shadow-[#90AB8B]/30"
                    )}
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin text-white" />
                    ) : isPlaying ? (
                        <Pause fill="currentColor" />
                    ) : (
                        <Play fill="currentColor" className="ml-1" />
                    )}
                </button>

                {/* Desktop Volume */}
                <div className="hidden sm:flex items-center gap-2 group">
                    <button onClick={toggleMute} className="text-slate-400 hover:text-slate-600 transition-colors">
                        {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolume}
                        className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#90AB8B]"
                    />
                </div>

            </div>

            {/* Bottom Row: Scrubber & Time Display */}
            <div className="flex flex-col gap-1.5 w-full">
                {/* Scrubber */}
                <div className="relative w-full h-4 group flex items-center">
                    {/* Track */}
                    <div className="absolute w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        {/* Progress */}
                        <div
                            className="h-full bg-[#90AB8B]"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    {/* Input */}
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        disabled={!src || isLoading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    {/* Handle (Visual Only) */}
                    <div
                        className="absolute h-4 w-4 bg-white border-2 border-[#90AB8B] rounded-full shadow-md pointer-events-none transition-all duration-75 ease-linear group-hover:scale-110"
                        style={{ left: `calc(${progressPercent}% - 8px)` }}
                    />
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-slate-400 tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

        </div>
    );
}
