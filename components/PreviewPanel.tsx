"use strict";
import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Copy, FileText, CheckCircle2 } from 'lucide-react';
import { jsPDF } from "jspdf";

interface PreviewPanelProps {
    content: string;
    className?: string;
}

export function PreviewPanel({ content, className }: PreviewPanelProps) {
    const [copied, setCopied] = React.useState(false);

    // --- Logic to Highlight Chords ---
    const renderHighlighted = useMemo(() => {
        if (!content) return null;

        const lines = content.split('\n');
        return lines.map((line, lineIdx) => {
            const tokens = line.split(/(\s+|\[.*?\]|\/)/g);
            return (
                <div key={lineIdx} className="min-h-[1.5em]">
                    {tokens.map((token, tIdx) => {
                        const isBracketChord = /^\[.+\]$/.test(token);
                        const isInlineChord = /^[A-G][#b]?(?:m|maj|dim|aug|sus|add|7|9|11|13|5)*[0-9]*(?:\/[A-G][#b]?)?$/.test(token);
                        const isChord = isBracketChord || (isInlineChord && token.length < 6 && token.length > 0);

                        return (
                            <span key={tIdx} className={isChord ? "text-indigo-600 font-bold" : "text-slate-600"}>
                                {token}
                            </span>
                        );
                    })}
                </div>
            );
        });
    }, [content]);


    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        doc.setFont("monospace");
        doc.setFontSize(12);

        const lines = content.split('\n');
        let y = 15;

        lines.forEach(line => {
            if (y > 280) { doc.addPage(); y = 15; }
            doc.text(line, 10, y);
            y += 6;
        });

        doc.save("song.pdf");
    };

    return (
        <div className={cn("flex flex-col h-full bg-white", className)}>
            {/* Heavy padding px-12 to avoid clipping */}
            <div className="flex items-center justify-between px-12 py-6 border-b border-indigo-50/50 bg-indigo-50/30">
                <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)] ring-4 ring-indigo-100" />
                    <label className="text-base font-bold text-slate-800 tracking-tight">Transposed View</label>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 hover:text-indigo-600 transition-all text-slate-500"
                    >
                        {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                        onClick={handleDownloadPdf}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 hover:text-indigo-600 transition-all text-slate-500"
                    >
                        <FileText size={14} /> <span className="hidden sm:inline">Txt</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full bg-indigo-50/5 p-10 overflow-auto">
                <div className="font-mono text-sm sm:text-base whitespace-pre leading-relaxed text-slate-600">
                    {content ? renderHighlighted : <span className="text-slate-400 italic">Transposed song will appear here...</span>}
                </div>
            </div>
        </div>
    );
}
