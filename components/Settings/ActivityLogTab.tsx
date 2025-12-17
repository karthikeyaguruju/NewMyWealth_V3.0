'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
    Bell,
    Search,
    Trash2,
    Plus,
    Pencil,
    BanknoteIcon,
    Target,
    User,
    Check,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Filter
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/contexts/ToastContext';

interface ActivityLog {
    id: string;
    action: string;
    description: string;
    icon?: string;
    metadata?: any;
    createdAt: string;
}

const ACTION_TYPES = [
    { value: '', label: 'All Activities' },
    { value: 'transaction_added', label: 'Transactions Added' },
    { value: 'transaction_updated', label: 'Transactions Updated' },
    { value: 'transaction_deleted', label: 'Transactions Deleted' },
    { value: 'investment_terminated', label: 'Investments Terminated' },
    { value: 'budget', label: 'Budget Changes' },
];

export function ActivityLogTab() {
    const { showToast } = useToast();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        fetchLogs();
    }, [currentPage, actionFilter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/activity-logs?limit=100');
            if (response.ok) {
                const data = await response.json();
                let filteredLogs = data.logs || [];

                // Apply action filter
                if (actionFilter) {
                    filteredLogs = filteredLogs.filter((log: ActivityLog) =>
                        log.action.includes(actionFilter)
                    );
                }

                // Apply search filter
                if (searchTerm) {
                    filteredLogs = filteredLogs.filter((log: ActivityLog) =>
                        log.description.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }

                // Calculate pagination
                setTotalItems(filteredLogs.length);
                setTotalPages(Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));

                // Apply pagination
                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                const paginatedLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                setLogs(paginatedLogs);
            }
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchLogs();
    };

    const clearAllLogs = async () => {
        if (!confirm('Are you sure you want to clear all activity logs? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api/activity-logs', { method: 'DELETE' });
            if (response.ok) {
                setLogs([]);
                setTotalItems(0);
                setTotalPages(1);
                showToast('success', 'Activity logs cleared successfully');
            }
        } catch (error) {
            console.error('Failed to clear activity logs:', error);
            showToast('error', 'Failed to clear activity logs');
        }
    };

    const getActionIcon = (action: string) => {
        const iconClass = "w-5 h-5";

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

    const getActionBadgeColor = (action: string) => {
        if (action.includes('added')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        if (action.includes('updated')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        if (action.includes('deleted')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        if (action.includes('terminated')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
        if (action.includes('budget')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    };

    const formatActionLabel = (action: string) => {
        return action.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const getTimeAgo = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return 'Just now';
        }
    };

    const formatFullDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy - hh:mm a');
        } catch {
            return dateString;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary-600" />
                        Activity History
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Track all your actions and changes in the app
                    </p>
                </div>
                {totalItems > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllLogs}
                        icon={<Trash2 size={16} />}
                        className="text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 items-center">
                <div className="w-full md:flex-1">
                    <Input
                        placeholder="Search activities..."
                        leftIcon={<Search size={18} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full"
                    />
                </div>
                <div className="flex w-full md:w-auto gap-2">
                    <div className="w-44">
                        <Select
                            value={actionFilter}
                            onChange={(value) => {
                                setActionFilter(value);
                                setCurrentPage(1);
                            }}
                            options={ACTION_TYPES}
                        />
                    </div>
                    <Button onClick={handleSearch} size="sm" icon={<Filter size={16} />}>
                        Filter
                    </Button>
                </div>
            </div>

            {/* Activity List */}
            <Card>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="py-12 text-center">
                        <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                            No Activities Found
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {searchTerm || actionFilter
                                ? 'No activities match your search criteria.'
                                : 'Your activity history is empty.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                            {getActionIcon(log.action)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                                                    {formatActionLabel(log.action)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-900 dark:text-white">
                                                {log.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                <Calendar size={12} />
                                                <span>{formatFullDate(log.createdAt)}</span>
                                                <span>•</span>
                                                <span>{getTimeAgo(log.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Showing <span className="font-medium">{logs.length}</span> of <span className="font-medium">{totalItems}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        icon={<ChevronLeft size={16} />}
                                    >
                                        Prev
                                    </Button>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white px-2">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        icon={<ChevronRight size={16} />}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
}
