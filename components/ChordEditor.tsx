"use strict";
import React from 'react';
import { cn } from '@/lib/utils';
import { PenTool } from 'lucide-react';

interface ChordEditorProps {
    value: string;
    onChange: (val: string) => void;
    className?: string;
}

export function ChordEditor({ value, onChange, className }: ChordEditorProps) {
    return (
        <div className={cn("flex flex-col h-full bg-white", className)}>
            {/* Increased padding to px-12 to clear the rounded-3xl/4xl corner radius */}
            <div className="flex items-center justify-between px-12 py-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-slate-300 ring-4 ring-slate-100" />
                    <label className="text-base font-bold text-slate-700 tracking-tight">Original Song</label>
                </div>
                <div className="p-2.5 bg-white rounded-full shadow-sm ring-1 ring-slate-100">
                    <PenTool size={14} className="text-slate-400" />
                </div>
            </div>

            <textarea
                className="flex-1 w-full bg-white text-slate-700 p-10 font-mono text-sm sm:text-base resize-none focus:outline-none placeholder:text-slate-300 selection:bg-indigo-100 selection:text-indigo-900"
                placeholder="Paste your chord sheet here...&#10;[G]Hello [D]world"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
            />
        </div>
    );
}
