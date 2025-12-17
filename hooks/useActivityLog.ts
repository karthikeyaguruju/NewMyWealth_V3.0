'use client';

import { useCallback } from 'react';

interface LogActivityParams {
    action: string;
    description: string;
    icon?: 'success' | 'warning' | 'info' | 'error';
    metadata?: Record<string, any>;
}

/**
 * Hook to log user activities from frontend components
 * Activities are sent to the API and stored in the database
 */
export function useActivityLog() {
    const logActivity = useCallback(async (params: LogActivityParams) => {
        try {
            await fetch('/api/activity-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });
        } catch (error) {
            // Silently fail - activity logging should not break main functionality
            console.error('Failed to log activity:', error);
        }
    }, []);

    // Pre-built activity loggers for common actions
    const logTransactionAdded = useCallback((amount: number, category: string, type: string) => {
        logActivity({
            action: 'transaction_added',
            description: `Added ${type} transaction: ₹${amount.toLocaleString()} for ${category}`,
            icon: 'success',
            metadata: { amount, category, type },
        });
    }, [logActivity]);

    const logTransactionUpdated = useCallback((amount: number, category: string) => {
        logActivity({
            action: 'transaction_updated',
            description: `Updated transaction: ₹${amount.toLocaleString()} for ${category}`,
            icon: 'info',
            metadata: { amount, category },
        });
    }, [logActivity]);

    const logTransactionDeleted = useCallback((amount: number, category: string) => {
        logActivity({
            action: 'transaction_deleted',
            description: `Deleted transaction: ₹${amount.toLocaleString()} from ${category}`,
            icon: 'warning',
            metadata: { amount, category },
        });
    }, [logActivity]);

    const logInvestmentTerminated = useCallback((amount: number, category: string, maturityAmount: number) => {
        logActivity({
            action: 'investment_terminated',
            description: `Terminated ${category}: ₹${maturityAmount.toLocaleString()} matured (original: ₹${amount.toLocaleString()})`,
            icon: 'success',
            metadata: { amount, category, maturityAmount },
        });
    }, [logActivity]);

    const logBudgetSet = useCallback((amount: number, category: string, month: string) => {
        logActivity({
            action: 'budget_set',
            description: `Set budget: ₹${amount.toLocaleString()} for ${category} in ${month}`,
            icon: 'info',
            metadata: { amount, category, month },
        });
    }, [logActivity]);

    return {
        logActivity,
        logTransactionAdded,
        logTransactionUpdated,
        logTransactionDeleted,
        logInvestmentTerminated,
        logBudgetSet,
    };
}
