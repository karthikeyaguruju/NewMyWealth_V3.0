'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, Plus, Pencil, BanknoteIcon, Target, User, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface ActivityLog {
    id: string;
    action: string;
    description: string;
    icon?: string;
    metadata?: any;
    createdAt: string;
    isDismissed?: boolean;
}

const MAX_VISIBLE_LOGS = 5; // Show only 5 logs in dropdown

export function NotificationBell() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch logs when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen]);

    // Fetch logs on mount to get unread count
    useEffect(() => {
        fetchLogs();
        // Poll for new activities every 30 seconds
        const interval = setInterval(fetchLogs, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/activity-logs?limit=${MAX_VISIBLE_LOGS}`);
            if (response.ok) {
                const data = await response.json();
                const allLogs = data.logs || [];
                // Filter out dismissed logs for the bell
                const visibleLogs = allLogs.filter((log: ActivityLog) => !log.isDismissed);

                setLogs(visibleLogs);
                setTotalLogs(data.total || visibleLogs.length || 0);

                // Count unread activities from the last hour that are not dismissed
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                const recentCount = visibleLogs.filter(
                    (log: ActivityLog) => new Date(log.createdAt) > oneHourAgo
                ).length;
                setUnreadCount(recentCount);
            }
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearAllLogs = async () => {
        try {
            // "Dismiss" all current logs in the UI instead of deleting them from DB
            const logIds = logs.map(l => l.id);
            if (logIds.length === 0) return;

            const response = await fetch('/api/activity-logs/dismiss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: logIds })
            });

            if (response.ok) {
                setLogs([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to dismiss activity logs:', error);
        }
    };

    const handleViewAll = () => {
        setIsOpen(false);
        router.push('/profile?tab=activity');
    };

    const getActionIcon = (action: string, iconType?: string) => {
        const iconClass = "w-4 h-4";

        if (action.includes('added') || action.includes('login')) {
            return <Plus className={`${iconClass} text-green-500`} />;
        } else if (action.includes('updated')) {
            return <Pencil className={`${iconClass} text-blue-500`} />;
        } else if (action.includes('deleted')) {
            return <Trash2 className={`${iconClass} text-red-500`} />;
        } else if (action.includes('terminated')) {
            return <BanknoteIcon className={`${iconClass} text-orange-500`} />;
        } else if (action.includes('budget')) {
            return <Target className={`${iconClass} text-purple-500`} />;
        } else if (action.includes('profile')) {
            return <User className={`${iconClass} text-indigo-500`} />;
        } else {
            return <Check className={`${iconClass} text-gray-500`} />;
        }
    };

    const getTimeAgo = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return 'Just now';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Activity Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            Recent Activity
                        </h3>
                        <div className="flex items-center gap-2">
                            {logs.length > 0 && (
                                <button
                                    onClick={clearAllLogs}
                                    className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Clear all activities"
                                >
                                    Clear All
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Activity List */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading && logs.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="py-12 text-center">
                                <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No activities yet</p>
                                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                                    Your recent actions will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                                {getActionIcon(log.action, log.icon)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                                                    {log.description}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {getTimeAgo(log.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer with View All Button */}
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                        <button
                            onClick={handleViewAll}
                            className="w-full px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            View All Activities
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
