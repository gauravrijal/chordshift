"use strict";
import React from 'react';
import { Minus, Plus, RefreshCw, Hash, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransposeControlsProps {
    semitones: number;
    setSemitones: (val: number) => void;
    preference: 'auto' | boolean;
    setPreference: (val: 'auto' | boolean) => void;
    className?: string;
}

export function TransposeControls({ semitones, setSemitones, preference, setPreference, className }: TransposeControlsProps) {

    const handlePreferenceChange = (val: string) => {
        if (val === 'auto') setPreference('auto');
        else if (val === 'sharp') setPreference(true);
        else setPreference(false);
    };

    return (
        <div className={cn("bg-white p-6 lg:p-8 rounded-[3rem] shadow-2xl shadow-emerald-900/5 ring-1 ring-black/5 transition-all", className)}>
            <div className="flex flex-col gap-4 lg:gap-6">

                {/* Header Area */}
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Transform</span>
                    {semitones !== 0 && (
                        <button
                            onClick={() => setSemitones(0)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <RefreshCw size={10} /> Reset
                        </button>
                    )}
                </div>

                {/* Central Control Area */}
                <div className="flex items-center justify-center gap-6 lg:gap-8 py-2">

                    {/* Minus Button */}
                    <button
                        onClick={() => setSemitones(semitones - 1)}
                        disabled={semitones <= -12}
                        className="h-16 w-16 lg:h-20 lg:w-20 flex-none flex items-center justify-center rounded-full bg-slate-50 border-4 border-white shadow-lg shadow-slate-200 hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                        aria-label="Lower key"
                    >
                        <Minus size={24} strokeWidth={3} className="text-[#90AB8B]" />
                    </button>

                    {/* Display */}
                    <div className="flex flex-col items-center min-w-[100px] lg:min-w-[120px]">
                        <span className={cn(
                            "text-5xl lg:text-6xl font-black tracking-tighter tabular-nums leading-none filter drop-shadow-sm",
                            semitones === 0 ? "text-slate-300" :
                                semitones > 0 ? "text-[#90AB8B]" : "text-[#90AB8B]"
                        )}>
                            {semitones > 0 ? `+${semitones}` : semitones}
                        </span>
                        <span className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">Semitones</span>
                    </div>

                    {/* Plus Button - SAGE GREEN UPDATE */}
                    <button
                        onClick={() => setSemitones(semitones + 1)}
                        disabled={semitones >= 12}
                        className="h-16 w-16 lg:h-20 lg:w-20 flex-none flex items-center justify-center rounded-full bg-slate-50 border-4 border-white shadow-lg shadow-slate-200 hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                        aria-label="Raise key"
                    >
                        <Plus size={24} strokeWidth={3} className="text-[#90AB8B]" />
                    </button>
                </div>

                {/* Formatting Toggles */}
                <div className="bg-slate-50 p-2 rounded-[2rem] flex gap-2 mx-auto max-w-sm w-full shadow-inner">
                    {[
                        { id: 'auto', label: 'Auto' },
                        { id: 'sharp', label: 'Sharps #' },
                        { id: 'flat', label: 'Flats ♭' }
                    ].map((opt) => {
                        const isActive = opt.id === 'auto' ? preference === 'auto' :
                            opt.id === 'sharp' ? preference === true :
                                preference === false;
                        return (
                            <button
                                key={opt.id}
                                onClick={() => handlePreferenceChange(opt.id)}
                                className={cn(
                                    "flex-1 px-4 py-2 lg:py-3 rounded-[1.5rem] text-xs font-bold transition-all transform",
                                    isActive
                                        ? "bg-white text-slate-900 shadow-md ring-1 ring-black/5 scale-100"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95 hover:scale-100"
                                )}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
