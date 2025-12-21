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
        <div className={cn("flex flex-col h-full bg-white dark:bg-transparent", className)}>
            {/* Fixed Header */}
            <div className="flex-none flex items-center justify-between px-10 py-5 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-neutral-900/50">
                <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-slate-400 dark:bg-neutral-600 ring-4 ring-slate-100 dark:ring-neutral-800" />
                    <label className="text-base font-bold text-slate-700 dark:text-slate-200 tracking-tight">Original Song</label>
                </div>
                <div className="p-2.5 bg-white dark:bg-neutral-800 rounded-full shadow-sm ring-1 ring-slate-100 dark:ring-white/10">
                    <PenTool size={14} className="text-slate-400 dark:text-slate-500" />
                </div>
            </div>

            {/* Scrollable Text Area - flex-1 with resize-none handles the grow/scroll */}
            <textarea
                className="flex-1 w-full bg-white dark:bg-transparent text-slate-700 dark:text-slate-300 p-10 font-mono text-sm sm:text-base resize-none focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 selection:bg-sky-100 dark:selection:bg-sky-900/30 selection:text-sky-900 dark:selection:text-sky-200"
                placeholder="Paste your chord sheet here...&#10;[G]Hello [D]world"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
            />
        </div>
    );
}
