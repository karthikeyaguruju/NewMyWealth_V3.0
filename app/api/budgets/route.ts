import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { startOfMonth, endOfMonth, format } from 'date-fns';

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    return decoded?.userId || null;
}

// GET /api/budgets - Get budgets with spending progress
export async function GET(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const monthParam = searchParams.get('month'); // Format: YYYY-MM

        const currentMonth = monthParam || format(new Date(), 'yyyy-MM');

        // Get budgets for the specified month
        const budgets = await prisma.budget.findMany({
            where: {
                userId,
                month: currentMonth,
            },
        });

        // Calculate spending for each budget
        const budgetsWithProgress = await Promise.all(budgets.map(async (budget) => {
            const startDate = `${currentMonth}-01`;
            // Calculate end date properly
            const [year, month] = currentMonth.split('-').map(Number);
            const endDateObj = endOfMonth(new Date(year, month - 1));
            const endDate = format(endDateObj, 'yyyy-MM-dd');

            const expenses = await prisma.transaction.aggregate({
                where: {
                    userId,
                    type: 'expense',
                    category: budget.category,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                _sum: {
                    amount: true,
                },
            });

            return {
                ...budget,
                spent: expenses._sum.amount || 0,
            };
        }));

        return NextResponse.json(budgetsWithProgress);
    } catch (error) {
        console.error('Get budgets error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/budgets - Create a new budget
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { category, amount, month } = body;

        if (!category || !amount || !month) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if budget already exists
        const existingBudget = await prisma.budget.findFirst({
            where: {
                userId,
                category,
                month,
            },
        });

        if (existingBudget) {
            // Update existing instead of failing
            const updatedBudget = await prisma.budget.update({
                where: { id: existingBudget.id },
                data: { amount: parseFloat(amount) },
            });
            return NextResponse.json(updatedBudget);
        }

        const budget = await prisma.budget.create({
            data: {
                userId,
                category,
                amount: parseFloat(amount),
                month,
            },
        });

        return NextResponse.json(budget, { status: 201 });
    } catch (error) {
        console.error('Create budget error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
