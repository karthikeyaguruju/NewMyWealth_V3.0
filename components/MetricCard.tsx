import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MetricCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    trend?: number;
    format?: 'currency' | 'percentage' | 'number';
    colorScheme?: 'primary' | 'income' | 'expense' | 'investment';
}

export function MetricCard({
    title,
    value,
    icon: Icon,
    trend,
    format = 'currency',
    colorScheme = 'primary',
}: MetricCardProps) {
    const formatValue = () => {
        if (format === 'currency') {
            return formatCurrency(value);
        } else if (format === 'percentage') {
            return `${value.toFixed(2)}%`;
        } else {
            return value.toLocaleString();
        }
    };

    const colorSchemes = {
        primary: 'from-primary-500 to-primary-700',
        income: 'from-income-500 to-income-600',
        expense: 'from-expense-500 to-expense-600',
        investment: 'from-investment-500 to-investment-600',
    };

    return (
        <Card hover className="relative overflow-hidden">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {formatValue()}
                    </p>
                    {trend !== undefined && (
                        <div className="flex items-center gap-1">
                            {trend >= 0 ? (
                                <TrendingUp size={16} className="text-green-500" />
                            ) : (
                                <TrendingDown size={16} className="text-red-500" />
                            )}
                            <span
                                className={cn(
                                    'text-sm font-medium',
                                    trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                )}
                            >
                                {Math.abs(trend).toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>
                <div
                    className={cn(
                        'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg',
                        colorSchemes[colorScheme]
                    )}
                >
                    <Icon className="text-white" size={24} />
                </div>
            </div>
        </Card>
    );
}
