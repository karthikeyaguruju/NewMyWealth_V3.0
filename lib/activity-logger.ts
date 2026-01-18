// Activity logging utility
// This helper can be used in API routes to log user activities

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface ActivityLogData {
    userId: string;
    action: string;
    description: string;
    icon?: 'success' | 'warning' | 'info' | 'error';
    metadata?: Record<string, any>;
}

/**
 * Create an activity log entry
 * @param data Activity log data
 */
export async function logActivity(data: ActivityLogData): Promise<void> {
    try {
        await prisma.activityLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                description: data.description,
                icon: data.icon || 'info',
                metadata: data.metadata ?? Prisma.JsonNull,
            },
        });
    } catch (error) {
        // Log error but don't throw - activity logging should not break main functionality
        console.error('Failed to log activity:', error);
    }
}

// Pre-defined activity actions
export const ActivityActions = {
    TRANSACTION_ADDED: 'transaction_added',
    TRANSACTION_UPDATED: 'transaction_updated',
    TRANSACTION_DELETED: 'transaction_deleted',
    INVESTMENT_TERMINATED: 'investment_terminated',
    BUDGET_SET: 'budget_set',
    BUDGET_UPDATED: 'budget_updated',
    BUDGET_DELETED: 'budget_deleted',
    CATEGORY_ADDED: 'category_added',
    INVESTMENT_ADDED: 'investment_added',
    INVESTMENT_UPDATED: 'investment_updated',
    INVESTMENT_DELETED: 'investment_deleted',
    PROFILE_UPDATED: 'profile_updated',
    LOGIN: 'login',
    LOGOUT: 'logout',
} as const;
