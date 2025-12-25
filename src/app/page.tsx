"use client";

import React, { useState, useMemo } from 'react';
import { ChordEditor } from '@/components/ChordEditor';
import { TransposeControls } from '@/components/TransposeControls';
import { PreviewPanel } from '@/components/PreviewPanel';
import { OCRImport } from '@/components/OCRImport';
import { Navbar } from '@/components/Navbar';
import { transposeDetails } from '@/utils/parseChords';
import { Play, Pause, Minus, X, Plus, FileUp } from 'lucide-react';

const DEFAULT_CONTENT = `C             G
Paste chords. Adjust the key.
Am            F        G
Sing the song the way you want.`;

export default function Home() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [semitones, setSemitones] = useState(0);
  const [preference, setPreference] = useState<'auto' | boolean>('auto');
  const [showOCR, setShowOCR] = useState(false);

  // Autoscroll State (Lifted Up)
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(5); // 1-20
  const [isExpanded, setIsExpanded] = useState(false);

  const processedContent = useMemo(() => {
    return transposeDetails(content, semitones, preference);
  }, [content, semitones, preference]);

  return (
    // Layout: responsive vertical height with safety scroll
    <div className="flex flex-col min-h-screen lg:h-screen lg:min-h-[850px] p-4 sm:p-6 lg:p-8 font-sans bg-gradient-to-br from-[#EBF4DD] via-[#90AB8B] to-[#5A7863] animate-gradient-x relative selection:bg-[#90AB8B]/30 selection:text-emerald-900 lg:overflow-y-auto transition-colors duration-500">

      {/* Animated Blobs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#90AB8B] rounded-full blur-3xl opacity-20 animate-blob -z-10 mix-blend-multiply" />
      <div className="fixed top-20 right-0 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-30 animate-blob animation-delay-2000 -z-10 mix-blend-multiply" />
      <div className="fixed -bottom-40 left-20 w-96 h-96 bg-[#90AB8B] rounded-full blur-3xl opacity-20 animate-blob animation-delay-4000 -z-10 mix-blend-multiply" />

      {/* Navbar with embedded Autoscroll Controls */}
      <Navbar>
        {/* Autoscroll Controls */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-2 py-1.5 rounded-full border border-slate-200/60 shadow-lg shadow-slate-200/50">

          {/* Play/Pause */}
          <button
            onClick={() => setIsScrolling(!isScrolling)}
            className={`flex items-center justify-center h-10 w-10 rounded-full transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#90AB8B] focus:ring-offset-2 ${isScrolling
              ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
              : "bg-[#90AB8B] text-white hover:bg-[#829b7d] shadow-[#90AB8B]/20"
              }`}
            title={isScrolling ? "Pause" : "Play"}
          >
            {isScrolling ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Speed Controls (+/-) */}
          <div className="flex items-center gap-1.5 px-1">
            <button
              onClick={() => setScrollSpeed(Math.max(1, scrollSpeed - 1))}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 border-2 border-white shadow-md hover:bg-slate-200 text-[#90AB8B] hover:text-[#7a9176] transition-all active:scale-95"
            >
              <Minus size={14} />
            </button>

            <div className="flex flex-col items-center w-8">
              <span className="text-sm font-bold text-slate-700 leading-none">{scrollSpeed}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">Speed</span>
            </div>

            <button
              onClick={() => setScrollSpeed(Math.min(20, scrollSpeed + 1))}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 border-2 border-white shadow-md hover:bg-slate-200 text-[#90AB8B] hover:text-[#7a9176] transition-all active:scale-95"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Import Button */}
        <button
          onClick={() => setShowOCR(true)}
          className="group flex items-center gap-3 px-4 lg:px-6 py-3 rounded-full bg-white border border-slate-200/60 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:scale-105 hover:border-[#90AB8B] hover:text-[#90AB8B] transition-all text-sm font-bold text-slate-600"
        >
          <FileUp size={18} />
          <span className="hidden sm:inline">Import File</span>
        </button>
      </Navbar>

      {/* Import Modal */}
      {showOCR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[3rem] shadow-2xl p-8 w-full max-w-2xl relative animate-in zoom-in-95 duration-200 ring-1 ring-black/5">
            <button
              onClick={() => setShowOCR(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-6 px-2">Import File</h2>
            <OCRImport onImport={(text) => {
              setContent(text);
              setShowOCR(false);
            }} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mb-6">

        {/* Left: Input & Controls */}
        {!isExpanded && (
          <section className="flex flex-col gap-6 h-full lg:min-h-0 min-h-[600px]">
            <div className="flex-none">
              <TransposeControls
                semitones={semitones}
                setSemitones={setSemitones}
                preference={preference}
                setPreference={setPreference}
              />
            </div>

            <div className="flex-1 min-h-[300px] bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden ring-1 ring-black/5 transition-transform hover:shadow-3xl duration-500">
              <ChordEditor value={content} onChange={setContent} className="h-full bg-transparent" />
            </div>
          </section>
        )}

        {/* Right: Preview (Receives Scrolling Props) */}
        <section className={`flex flex-col h-full lg:min-h-0 min-h-[600px] ${isExpanded ? "lg:col-span-2" : ""}`}>
          <div className="flex-1 min-h-[300px] bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden ring-1 ring-black/5 transition-transform hover:shadow-3xl duration-500">
            <PreviewPanel
              content={processedContent}
              className="h-full bg-transparent"
              isScrolling={isScrolling}
              scrollSpeed={scrollSpeed}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
            />
          </div>
        </section>

      </main>

      <footer className="flex-none py-4 text-center">
        <p className="text-white/90 text-xs font-semibold tracking-wide drop-shadow-md">Designed for Musicians • Simple & Accurate</p>
      </footer>
    </div >
  );
}
