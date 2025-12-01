'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, TrendingUp, Settings, LogOut, X, PieChart, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const menuItems = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        name: 'Transactions',
        href: '/transactions',
        icon: ArrowLeftRight,
    },
    {
        name: 'Investments',
        href: '/investments',
        icon: TrendingUp,
    },
    {
        name: 'Analytics',
        href: '/analytics',
        icon: PieChart,
    },
    {
        name: 'Settings',
        href: '/profile',
        icon: Settings,
    },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            setIsLoggingOut(true);
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/login');
            } catch (error) {
                console.error('Logout failed:', error);
                setIsLoggingOut(false);
            }
        }
    };

    return (
        <>
            <aside className={cn(
                "fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen md:glass-card",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
                                <TrendingUp className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Finance</h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Dashboard</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => onClose?.()}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                                        isActive
                                            ? 'bg-primary-600 text-white shadow-md'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    )}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer with Logout */}
                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={handleLogout}
                            loading={isLoggingOut}
                            icon={<LogOut size={20} />}
                        >
                            Logout
                        </Button>

                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                            © 2025 My Finance Dashboard
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}
