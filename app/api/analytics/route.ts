import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    return decoded?.userId || null;
}

// GET /api/analytics - Get dashboard analytics
export async function GET(request: NextRequest) {
    try {
        const userId = await getUserId(request);

        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Get all transactions in date range
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                ...(startDate && endDate && {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                }),
            },
        });

        // Calculate totals
        const totalIncome = transactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = transactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalInvestments = transactions
            .filter((t) => t.type === 'investment')
            .reduce((sum, t) => sum + t.amount, 0);

        const netSavings = totalIncome - totalExpenses;

        // This month's data
        const thisMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
        const thisMonthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

        const thisMonthTransactions = transactions.filter(
            (t) => t.date >= thisMonthStart && t.date <= thisMonthEnd
        );

        const thisMonthIncome = thisMonthTransactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const thisMonthExpenses = thisMonthTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const thisMonthInvestments = thisMonthTransactions
            .filter((t) => t.type === 'investment')
            .reduce((sum, t) => sum + t.amount, 0);

        // Last month's data for growth calculation
        const lastMonthDate = subMonths(new Date(), 1);
        const lastMonthStart = format(startOfMonth(lastMonthDate), 'yyyy-MM-dd');
        const lastMonthEnd = format(endOfMonth(lastMonthDate), 'yyyy-MM-dd');

        const lastMonthTransactions = transactions.filter(
            (t) => t.date >= lastMonthStart && t.date <= lastMonthEnd
        );

        const lastMonthIncome = lastMonthTransactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthExpenses = lastMonthTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthInvestments = lastMonthTransactions
            .filter((t) => t.type === 'investment')
            .reduce((sum, t) => sum + t.amount, 0);

        const incomeGrowth = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
        const expenseGrowth = lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
        const investmentGrowth = lastMonthInvestments > 0 ? ((thisMonthInvestments - lastMonthInvestments) / lastMonthInvestments) * 100 : 0;

        // Savings rate
        const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

        // Monthly aggregated data for charts
        const historyMonths = searchParams.get('historyMonths') ? parseInt(searchParams.get('historyMonths')!) : 6;
        const monthlyData: any[] = [];
        for (let i = historyMonths - 1; i >= 0; i--) {
            const monthDate = subMonths(new Date(), i);
            const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
            const monthEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');
            const monthLabel = format(monthDate, 'MMM yyyy');

            const monthTransactions = transactions.filter(
                (t) => t.date >= monthStart && t.date <= monthEnd
            );

            const income = monthTransactions
                .filter((t) => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const expense = monthTransactions
                .filter((t) => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const investment = monthTransactions
                .filter((t) => t.type === 'investment')
                .reduce((sum, t) => sum + t.amount, 0);

            monthlyData.push({
                month: monthLabel,
                income,
                expense,
                investment,
                savings: income - expense,
            });
        }

        // Income breakdown by category
        const incomeByCategory: Record<string, number> = {};
        transactions
            .filter((t) => t.type === 'income')
            .forEach((t) => {
                incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
            });

        const incomeBreakdown = Object.entries(incomeByCategory).map(([name, value]) => ({
            name,
            value,
        }));

        // Expense breakdown by category
        const expenseByCategory: Record<string, number> = {};
        transactions
            .filter((t) => t.type === 'expense')
            .forEach((t) => {
                expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
            });

        const expenseBreakdown = Object.entries(expenseByCategory).map(([name, value]) => ({
            name,
            value,
        }));

        // Investment allocation
        const investmentByCategory: Record<string, number> = {};
        transactions
            .filter((t) => t.type === 'investment')
            .forEach((t) => {
                investmentByCategory[t.category] = (investmentByCategory[t.category] || 0) + t.amount;
            });

        const investmentAllocation = Object.entries(investmentByCategory).map(([name, value]) => ({
            name,
            value,
        }));

        return NextResponse.json({
            metrics: {
                totalIncome,
                totalExpenses,
                netSavings,
                totalInvestments,
                thisMonthIncome,
                thisMonthExpenses,
                savingsRate: Math.round(savingsRate * 100) / 100,
                incomeGrowth,
                expenseGrowth,
                investmentGrowth,
            },
            monthlyData,
            incomeBreakdown,
            expenseBreakdown,
            investmentAllocation,
        }, { status: 200 });
    } catch (error) {
        console.error('Get analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
