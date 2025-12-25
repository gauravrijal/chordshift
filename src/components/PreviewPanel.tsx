"use strict";
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Copy, FileText, CheckCircle2, Maximize2, Minimize2 } from 'lucide-react';
import { jsPDF } from "jspdf";

interface PreviewPanelProps {
    content: string;
    className?: string;
    isScrolling: boolean;
    scrollSpeed: number;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

export function PreviewPanel({ content, className, isScrolling, scrollSpeed, isExpanded, onToggleExpand }: PreviewPanelProps) {
    const [copied, setCopied] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const lastTimeRef = useRef<number>(0);
    const scrollAccumulatorRef = useRef<number>(0);

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
                            <span key={tIdx} className={isChord ? "text-[#90AB8B] font-bold" : "text-slate-800"}>
                                {token}
                            </span>
                        );
                    })}
                </div>
            );
        });
    }, [content]);

    // --- Autoscroll Logic ---
    useEffect(() => {
        let animationFrameId: number;

        const scroll = (timestamp: number) => {
            if (!scrollContainerRef.current) return;

            if (!lastTimeRef.current) lastTimeRef.current = timestamp;
            const deltaTime = timestamp - lastTimeRef.current;
            lastTimeRef.current = timestamp;

            // Exponential Speed Curve (1 to 20)
            // Range: ~5px/sec (crawl) to ~300px/sec (fast scan)
            // Formula: Base * Multiplier^(level)
            // Let's use a calibrated approach:
            // Speed 1: ~10px/s
            // Speed 10: ~60px/s
            // Speed 20: ~400px/s

            // Normalized 0 to 1
            const t = (scrollSpeed - 1) / 19;
            // Quadratic/Cubic ease-in for natural feeling speedup
            const pxPerSecond = 10 + (400 * Math.pow(t, 2.5));

            const pxPerFrame = (pxPerSecond * deltaTime) / 1000;

            scrollAccumulatorRef.current += pxPerFrame;
            scrollContainerRef.current.scrollTop = scrollAccumulatorRef.current;

            animationFrameId = requestAnimationFrame(scroll);
        };

        if (isScrolling) {
            // Initialize accumulator only if starting fresh or sync needed
            if (scrollContainerRef.current) {
                // Determine starting point - ALWAYS SYNC to current position on start
                scrollAccumulatorRef.current = scrollContainerRef.current.scrollTop;
            }
            lastTimeRef.current = 0;
            animationFrameId = requestAnimationFrame(scroll);
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isScrolling, scrollSpeed]);


    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleDownloadTxt = () => {
        const element = document.createElement("a");
        const file = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "transposed_song.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        doc.setFont("monospace");
        doc.setFontSize(12);

        const lines = content.split('\n');
        let y = 15;

        // Basic pagination logic
        lines.forEach(line => {
            if (y > 280) { doc.addPage(); y = 15; }
            doc.text(line, 10, y);
            y += 6;
        });

        doc.save("song.pdf");
    };

    return (
        <div className={cn("flex flex-col h-full bg-white", className)}>
            {/* Fixed Header */}
            <div className="flex-none flex items-center justify-between px-4 sm:px-6 lg:px-10 py-5 border-b border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-[#90AB8B] shadow-[0_0_12px_rgba(144,171,139,0.8)] ring-4 ring-white" />
                    <label className="text-base font-bold text-slate-800 tracking-tight">Transposed View</label>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onToggleExpand}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#90AB8B] hover:text-[#90AB8B] transition-all text-slate-500 mr-2"
                        title={isExpanded ? "Collapse View" : "Expand View"}
                    >
                        {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        <span className="hidden sm:inline">{isExpanded ? 'Collapse' : 'Expand'}</span>
                    </button>

                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#90AB8B] hover:text-[#90AB8B] transition-all text-slate-500"
                        title="Copy to Clipboard"
                    >
                        {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    {/* Divider */}
                    <div className="w-px bg-slate-200 mx-1 h-6 self-center" />

                    <button
                        onClick={handleDownloadTxt}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#90AB8B] hover:text-[#90AB8B] transition-all text-slate-500"
                        title="Download as TXT"
                    >
                        <FileText size={14} /> <span className="hidden sm:inline">Txt</span>
                    </button>

                    <button
                        onClick={handleDownloadPdf}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 border border-red-100 shadow-sm hover:shadow-md hover:border-red-300 hover:text-red-700 transition-all text-red-600"
                        title="Download as PDF"
                    >
                        <FileText size={14} /> <span className="hidden sm:inline">PDF</span>
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div
                ref={scrollContainerRef}
                className="flex-1 w-full bg-white p-10 overflow-auto"
            >
                <div className="font-mono text-sm sm:text-base whitespace-pre leading-relaxed text-slate-800 pb-[50vh]">
                    {content ? renderHighlighted : <span className="text-slate-400 italic">Transposed song will appear here...</span>}
                </div>
            </div>
        </div>
    );
}
