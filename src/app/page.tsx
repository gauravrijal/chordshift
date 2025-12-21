"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChordEditor } from '@/components/ChordEditor';
import { TransposeControls } from '@/components/TransposeControls';
import { PreviewPanel } from '@/components/PreviewPanel';
import { OCRImport } from '@/components/OCRImport';
import { transposeDetails } from '@/utils/parseChords';
import { Music2, Image as ImageIcon, X, Play, Pause, Zap, Minus, Plus, FileUp, Menu, Moon, Sun } from 'lucide-react';

const DEFAULT_CONTENT = `C             G
Paste chords. Adjust the key.
Am            F        G
Sing the song the way you want.`;

export default function Home() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [semitones, setSemitones] = useState(0);
  const [preference, setPreference] = useState<'auto' | boolean>('auto');
  const [showOCR, setShowOCR] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Initialize Theme (Mount only)
  React.useEffect(() => {
    // Check local storage or system preference
    const stored = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (stored === 'dark' || (!stored && systemDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Theme Toggle Handler
  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);

    // Direct DOM manipulation for instant feedback
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const menuRef = useRef<HTMLDivElement>(null);

  // Click Outside to Close Menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Autoscroll State (Lifted Up)
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(5); // 1-20
  const [isExpanded, setIsExpanded] = useState(false);

  const processedContent = useMemo(() => {
    return transposeDetails(content, semitones, preference);
  }, [content, semitones, preference]);

  return (
    // Layout: h-screen + overflow-hidden to lock the page
    <div className="flex flex-col h-screen p-4 sm:p-6 lg:p-8 font-sans bg-gradient-to-br from-[#90AB8B]/10 via-[#90AB8B]/40 to-[#90AB8B]/10 dark:bg-neutral-950 animate-gradient-x relative selection:bg-[#90AB8B]/30 selection:text-emerald-900 overflow-hidden transition-colors duration-500">

      {/* Animated Blobs (Hidden in Dark Mode for cleaner look, or adjusted) */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#90AB8B] rounded-full blur-3xl opacity-20 dark:opacity-5 animate-blob -z-10 mix-blend-multiply dark:mix-blend-normal" />
      <div className="fixed top-20 right-0 w-96 h-96 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-30 dark:opacity-10 animate-blob animation-delay-2000 -z-10 mix-blend-multiply dark:mix-blend-normal" />
      <div className="fixed -bottom-40 left-20 w-96 h-96 bg-[#90AB8B] rounded-full blur-3xl opacity-20 dark:opacity-5 animate-blob animation-delay-4000 -z-10 mix-blend-multiply dark:mix-blend-normal" />

      {/* Header - Fixed height */}
      <header className="flex-none flex items-center justify-between px-2 mb-4 relative z-20">
        <div className="flex items-center gap-4 select-none">
          {/* Logo Image */}
          <div className="h-20 w-20 flex items-center justify-center rounded-full bg-[#90AB8B] shadow-xl shadow-[#90AB8B]/20 ring-4 ring-white/50 dark:ring-slate-700/50 border-2 border-[#90AB8B]/50 overflow-hidden">
            <img src="/logo.png" alt="ChordShift Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 hidden md:block">ChordShift</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Autoscroll Controls */}
          <div className="flex items-center gap-2 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm px-2 py-1.5 rounded-full border border-slate-200/60 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-black/50">

            {/* Play/Pause */}
            <button
              onClick={() => setIsScrolling(!isScrolling)}
              className={`flex items-center justify-center h-10 w-10 rounded-full transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#90AB8B] focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${isScrolling
                ? "bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                : "bg-[#90AB8B] text-white hover:bg-[#829b7d] shadow-[#90AB8B]/20"
                }`}
              title={isScrolling ? "Pause" : "Play"}
            >
              {isScrolling ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
            </button>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Speed Controls (+/-) */}
            <div className="flex items-center gap-1.5 px-1">
              <button
                onClick={() => setScrollSpeed(Math.max(1, scrollSpeed - 1))}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-600 shadow-md hover:bg-slate-200 dark:hover:bg-slate-600 text-[#90AB8B] hover:text-[#7a9176] transition-all active:scale-95"
              >
                <Minus size={14} />
              </button>

              <div className="flex flex-col items-center w-8">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{scrollSpeed}</span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-none">Speed</span>
              </div>

              <button
                onClick={() => setScrollSpeed(Math.min(20, scrollSpeed + 1))}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-600 shadow-md hover:bg-slate-200 dark:hover:bg-slate-600 text-[#90AB8B] hover:text-[#7a9176] transition-all active:scale-95"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Import Button */}
          <button
            onClick={() => setShowOCR(true)}
            className="group flex items-center gap-3 px-6 py-3 rounded-full bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-black/50 hover:shadow-xl hover:scale-105 hover:border-sky-200 hover:text-sky-700 dark:hover:text-sky-400 transition-all text-sm font-bold text-slate-600 dark:text-slate-300"
          >
            <FileUp size={18} />
            <span className="hidden sm:inline">Import File</span>
          </button>

          {/* Hamburger Menu - ANIMATED */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="group flex flex-col items-center justify-center gap-1.5 h-12 w-12 rounded-full bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-black/50 hover:scale-105 hover:border-[#90AB8B] hover:shadow-[#90AB8B]/20 transition-all z-50 relative"
              aria-label="Menu"
            >
              {/* Top Bar */}
              <span className={`h-0.5 w-5 bg-slate-600 dark:bg-slate-300 rounded-full transition-all duration-300 ease-out origin-center ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />

              {/* Middle Bar */}
              <span className={`h-0.5 w-5 bg-slate-600 dark:bg-slate-300 rounded-full transition-all duration-200 ease-out ${isMenuOpen ? 'opacity-0 scale-50' : ''}`} />

              {/* Bottom Bar */}
              <span className={`h-0.5 w-5 bg-slate-600 dark:bg-slate-300 rounded-full transition-all duration-300 ease-out origin-center ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-3 w-56 p-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-white/10 animate-in slide-in-from-top-2 duration-200 z-50">
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-sm font-bold text-slate-700 dark:text-slate-200"
                >
                  <span className="flex items-center gap-3">
                    {isDark ? <Moon size={16} className="text-[#90AB8B]" /> : <Sun size={16} className="text-amber-500" />}
                    Dark Mode
                  </span>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isDark ? 'bg-[#90AB8B]' : 'bg-slate-200 dark:bg-neutral-700'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isDark ? 'translate-x-4' : ''}`} />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div >
      </header >

      {/* Import Modal */}
      {
        showOCR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl p-8 w-full max-w-2xl relative animate-in zoom-in-95 duration-200 ring-1 ring-black/5 dark:ring-white/10">
              <button
                onClick={() => setShowOCR(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 px-2">Import File</h2>
              <OCRImport onImport={(text) => {
                setContent(text);
                setShowOCR(false);
              }} />
            </div>
          </div>
        )
      }

      {/* Main Content */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        {/* Left: Input & Controls */}
        {!isExpanded && (
          <section className="flex flex-col gap-6 h-full min-h-0">
            <div className="flex-none">
              <TransposeControls
                semitones={semitones}
                setSemitones={setSemitones}
                preference={preference}
                setPreference={setPreference}
              />
            </div>

            <div className="flex-1 min-h-0 bg-white dark:bg-neutral-900 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden ring-1 ring-black/5 dark:ring-white/10 transition-transform hover:shadow-3xl duration-500">
              <ChordEditor value={content} onChange={setContent} className="h-full bg-transparent" />
            </div>
          </section>
        )}

        {/* Right: Preview (Receives Scrolling Props) */}
        <section className={`flex flex-col h-full min-h-0 ${isExpanded ? "lg:col-span-2" : ""}`}>
          <div className="flex-1 min-h-0 bg-white dark:bg-black rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden ring-1 ring-black/5 dark:ring-white/5 transition-transform hover:shadow-3xl duration-500">
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
        <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold tracking-wide">Designed for Musicians • Simple & Accurate</p>
      </footer>
    </div >
  );
}
