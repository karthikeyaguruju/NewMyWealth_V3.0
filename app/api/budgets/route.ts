export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/db';
import { logActivity, ActivityActions } from '@/lib/activity-logger';
import { format, startOfMonth, endOfMonth } from 'date-fns';

async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

// GET /api/budgets - Get budgets with spending progress using Prisma
export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const monthParam = searchParams.get('month'); // YYYY-MM
        const currentMonth = monthParam || format(new Date(), 'yyyy-MM');

        // Parse month dates for spending lookup
        const [year, month] = currentMonth.split('-').map(Number);
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = endOfMonth(startDate);

        // 1. Get budgets for this user and month via Prisma
        const budgets = await prisma.budget.findMany({
            where: {
                userId: user.id,
                month: currentMonth
            },
            include: {
                category: true
            }
        });

        // 2. Get all expenses for this user in this month to calculate progress
        const transactions = await prisma.transaction.findMany({
            where: {
                userId: user.id,
                type: 'expense',
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                amount: true,
                categoryId: true
            }
        });

        // 3. Combine data
        const budgetsWithProgress = budgets.map(budget => {
            const spent = transactions
                .filter(t => t.categoryId === budget.categoryId)
                .reduce((sum, t) => sum + Number(t.amount), 0);

            return {
                id: budget.id,
                amount: budget.amount,
                month: budget.month,
                categoryId: budget.categoryId,
                category: budget.category?.name || 'Unknown',
                spent
            };
        });

        return NextResponse.json(budgetsWithProgress);
    } catch (error) {
        console.error('[Budgets API] GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/budgets - Create/Update a budget using Prisma
export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { category: categoryName, amount, month } = body;

        // Find the category ID by name
        const category = await prisma.category.findFirst({
            where: {
                userId: user.id,
                name: categoryName
            }
        });

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Upsert the budget using Prisma
        const budget = await prisma.budget.upsert({
            where: {
                userId_categoryId_month: {
                    userId: user.id,
                    categoryId: category.id,
                    month: month
                }
            },
            update: {
                amount: parseFloat(amount)
            },
            create: {
                userId: user.id,
                categoryId: category.id,
                amount: parseFloat(amount),
                month: month
            },
            include: {
                category: true
            }
        });

        // Log activity
        await logActivity({
            userId: user.id,
            action: ActivityActions.BUDGET_SET,
            description: `Set budget of ${budget.amount} for ${budget.category?.name || categoryName} in ${budget.month}`,
            icon: 'info',
            metadata: {
                budgetId: budget.id,
                amount: budget.amount,
                category: budget.category?.name || categoryName,
                month: budget.month
            }
        });

        return NextResponse.json({
            ...budget,
            category: budget.category?.name || categoryName
        }, { status: 201 });

    } catch (error) {
        console.error('[Budgets API] POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
