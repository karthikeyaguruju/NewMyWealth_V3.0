'use client';

import React from 'react';
import { Wallet } from 'lucide-react';

export function LandingFooter() {
    return (
        <footer className="py-12 border-t border-slate-200 dark:border-white/5 text-center px-6">
            <div className="flex items-center justify-center gap-2 mb-6">
                <Wallet className="text-emerald-500" size={20} />
                <span className="font-bold text-slate-900 dark:text-white">MyWealth</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
                © {new Date().getFullYear()} MyWealth. All rights reserved. Built for your financial freedom.
            </p>
        </footer>
    );
}
