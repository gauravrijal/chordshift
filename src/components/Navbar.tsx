"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarProps {
    children?: React.ReactNode; // Slot for page-specific controls (e.g. Autoscroll)
}

export function Navbar({ children }: NavbarProps) {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { href: '/', label: 'Chord Transpose' },
        { href: '/pitch', label: 'Audio Pitch' },
    ];

    return (
        <header className="flex-none flex items-center justify-between px-2 mb-4 relative z-50 gap-2 sm:gap-4 select-none">
            {/* Left: Logo & Title & Nav */}
            <div className="flex items-center gap-4">
                {/* Logo Image */}
                <Link href="/" className="flex-none block">
                    <div className="h-16 w-16 lg:h-20 lg:w-20 flex items-center justify-center rounded-full bg-[#90AB8B] shadow-xl shadow-[#90AB8B]/20 ring-4 ring-white/50 border-2 border-[#90AB8B]/50 overflow-hidden cursor-pointer transition-transform hover:scale-105 active:scale-95">
                        <img src="/logo.png" alt="ChordShift Logo" className="w-full h-full object-cover" />
                    </div>
                </Link>

                <div className="hidden md:flex flex-col gap-1">
                    <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-800 leading-none">ChordShift</h1>
                    <nav className="flex gap-4 text-sm font-semibold">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "px-2 py-0.5 rounded-full transition-colors",
                                    pathname === link.href
                                        ? "text-[#5A7863] bg-white/50"
                                        : "text-slate-600 hover:text-slate-900"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Right: Actions & Mobile Menu */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Page Specific Actions (Autoscroll etc) */}
                {children}

                {/* Mobile Menu Toggle */}
                <div className="md:hidden relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-3 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg shadow-slate-200/50 text-slate-700 hover:text-[rgb(144,171,139)] transition-all active:scale-90 z-50 relative"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Mobile Dropdown */}
                    {isMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 bg-transparent z-40"
                                onClick={() => setIsMenuOpen(false)}
                            />
                            <div className="absolute top-14 right-0 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-2 flex flex-col gap-1 border border-white/20 z-50 animate-in fade-in slide-in-from-top-4 duration-200 origin-top-right">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={cn(
                                            "px-4 py-3 rounded-xl font-bold transition-all",
                                            pathname === link.href
                                                ? "bg-[#90AB8B]/20 text-[#5A7863]"
                                                : "text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
