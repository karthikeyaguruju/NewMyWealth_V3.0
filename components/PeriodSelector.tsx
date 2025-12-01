'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface PeriodSelectorProps {
    onPeriodChange: (startDate: string, endDate: string) => void;
}

type PeriodType = 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear' | 'custom';

export function PeriodSelector({ onPeriodChange }: PeriodSelectorProps) {
    const [selectedPeriod, setSelectedPeriod] = React.useState<PeriodType>('thisMonth');

    const handlePeriodClick = (period: PeriodType) => {
        setSelectedPeriod(period);

        const today = new Date();
        let startDate: string;
        let endDate: string;

        switch (period) {
            case 'thisMonth':
                startDate = format(startOfMonth(today), 'yyyy-MM-dd');
                endDate = format(endOfMonth(today), 'yyyy-MM-dd');
                break;
            case 'lastMonth':
                const lastMonth = subMonths(today, 1);
                startDate = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
                endDate = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
                break;
            case 'last3Months':
                startDate = format(startOfMonth(subMonths(today, 2)), 'yyyy-MM-dd');
                endDate = format(endOfMonth(today), 'yyyy-MM-dd');
                break;
            case 'thisYear':
                startDate = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd');
                endDate = format(today, 'yyyy-MM-dd');
                break;
            default:
                return;
        }

        onPeriodChange(startDate, endDate);
    };

    const periods: { key: PeriodType; label: string }[] = [
        { key: 'thisMonth', label: 'This Month' },
        { key: 'lastMonth', label: 'Last Month' },
        { key: 'last3Months', label: 'Last 3 Months' },
        { key: 'thisYear', label: 'This Year' },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            <Calendar className="text-gray-500 dark:text-gray-400 mr-2" size={20} />
            {periods.map((period) => (
                <button
                    key={period.key}
                    onClick={() => handlePeriodClick(period.key)}
                    className={cn(
                        'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                        selectedPeriod === period.key
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    )}
                >
                    {period.label}
                </button>
            ))}
        </div>
    );
}
