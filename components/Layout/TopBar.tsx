'use client';

import React from 'react';
import { format } from 'date-fns';
import { Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface TopBarProps {
    onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
    const { theme, toggleTheme } = useTheme();
    const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');

    return (
        <header className="glass-card mb-6 p-4 flex items-center justify-between sticky top-0 z-10 mx-4 mt-4 md:mx-0 md:mt-0 md:rounded-none md:border-x-0 md:border-t-0 md:glass-card-none md:bg-white/80 md:dark:bg-gray-900/80 md:backdrop-blur-xl">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <Menu size={24} className="text-gray-700 dark:text-gray-300" />
                </button>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white hidden md:block">
                        My Finance Dashboard
                    </h2>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white md:hidden">
                        Dashboard
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{currentDate}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? (
                        <Moon size={20} className="text-gray-700 dark:text-gray-300" />
                    ) : (
                        <Sun size={20} className="text-gray-700 dark:text-gray-300" />
                    )}
                </button>
            </div>
        </header>
    );
}
