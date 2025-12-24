'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function LandingNavbar() {
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);

    const isLoginPage = pathname === '/login';
    const isSignupPage = pathname === '/signup';

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-[100] transition-all duration-300",
                isScrolled
                    ? "py-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 shadow-lg"
                    : "py-6 bg-transparent"
            )}
        >
            <nav className="flex items-center justify-between px-6 max-w-7xl mx-auto w-full">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                        <Wallet className="text-slate-950" size={24} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        MyWealth
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <a href="/#features" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">Features</a>
                    <a href="/#how-it-works" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">How it works</a>
                    {!isLoginPage && <Link href="/login" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">Sign In</Link>}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    {!isSignupPage && (
                        <Link href="/signup" className="hidden sm:block px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/10">
                            Get Started
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    );
}
