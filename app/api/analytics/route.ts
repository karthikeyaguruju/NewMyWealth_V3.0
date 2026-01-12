export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

/** Extract user from Supabase token */
async function getUser(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.error('[Analytics API] Auth error:', error);
    return null;
  }
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = user.id;

    // Fetch all transactions and stocks using Prisma
    const [allTx, allStocks] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        include: { categoryRel: true }
      }),
      prisma.stock.findMany({
        where: { userId }
      })
    ]);

    // Date boundaries
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const endOfThisMonth = endOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));

    // Filter transactions by current month
    const thisMonthTx = allTx.filter(t => t.date >= startOfThisMonth && t.date <= endOfThisMonth);
    const lastMonthTx = allTx.filter(t => t.date >= startOfLastMonth && t.date < startOfThisMonth);
    const thisMonthStocks = allStocks.filter(s => {
      const d = s.date || s.createdAt;
      return d >= startOfThisMonth && d <= endOfThisMonth;
    });

    // THIS MONTH metrics
    const thisMonthIncome = thisMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const thisMonthExpenses = thisMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const thisMonthInvestmentsTx = thisMonthTx.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0);
    const thisMonthStocksValue = thisMonthStocks.reduce((s, stock) => s + (stock.quantity * stock.buyPrice), 0);
    const thisMonthInvestments = thisMonthInvestmentsTx + thisMonthStocksValue;

    // LAST MONTH metrics
    const lastMonthIncome = lastMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const lastMonthExpenses = lastMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    // Growth calculations
    const incomeGrowth = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
    const expenseGrowth = lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;

    // ALL TIME metrics
    const totalIncome = allTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalInvestmentsTx = allTx.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0);
    const totalStocksValue = allStocks.reduce((s, stock) => s + (stock.quantity * stock.buyPrice), 0);
    const totalInvestments = totalInvestmentsTx + totalStocksValue;

    // Category Breakdowns
    const getBreakdown = (type: string, txList: any[] = allTx) => {
      const counts: Record<string, number> = {};
      txList.filter(t => t.type === type).forEach(t => {
        const name = t.categoryRel?.name || t.category || 'Uncategorized';
        counts[name] = (counts[name] || 0) + t.amount;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value: Math.max(0, value) }));
    };

    const thisMonthIncomeBreakdown = getBreakdown('income', thisMonthTx);
    const thisMonthExpenseBreakdown = getBreakdown('expense', thisMonthTx);
    const thisMonthInvestmentBreakdown = getBreakdown('investment', thisMonthTx);

    // Recent transactions
    const recentTransactions = allTx
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        category: t.categoryRel?.name || t.category || 'Uncategorized',
        description: t.notes || '',
        date: t.date.toISOString()
      }));

    // Generate chart data
    const { searchParams } = new URL(request.url);
    const granularity = searchParams.get('granularity') || 'month';
    const historyMonths = parseInt(searchParams.get('historyMonths') || '6');
    const daysParam = parseInt(searchParams.get('days') || '30');
    const chartData = [];

    if (granularity === 'day') {
      const numDays = daysParam;
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() - i);
        d.setUTCHours(0, 0, 0, 0);
        const nextDay = new Date(d);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);

        const dayTx = allTx.filter(t => t.date >= d && t.date < nextDay);
        chartData.push({
          label: format(d, 'dd MMM'),
          income: dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
          investment: dayTx.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0),
        });
      }
    } else {
      const numMonths = historyMonths;
      for (let i = numMonths - 1; i >= 0; i--) {
        const d = subMonths(now, i);
        const mStart = startOfMonth(d);
        const mEnd = endOfMonth(d);
        const mTx = allTx.filter(t => t.date >= mStart && t.date <= mEnd);

        chartData.push({
          label: format(d, 'MMM yyyy'),
          income: mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
          investment: mTx.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0),
        });
      }
    }

    return NextResponse.json({
      thisMonth: {
        income: thisMonthIncome,
        expenses: thisMonthExpenses,
        investments: thisMonthInvestments,
        netSavings: thisMonthIncome - thisMonthExpenses,
        savingsRate: thisMonthIncome > 0 ? ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100 : 0,
        incomeGrowth,
        expenseGrowth,
        incomeBreakdown: thisMonthIncomeBreakdown,
        expenseBreakdown: thisMonthExpenseBreakdown,
        investmentBreakdown: thisMonthInvestmentBreakdown,
        transactionCount: thisMonthTx.length,
        stockCount: thisMonthStocks.length,
      },
      recentTransactions,
      metrics: {
        totalIncome,
        totalExpenses,
        netSavings: totalIncome - totalExpenses,
        totalInvestments,
        thisMonthIncome,
        thisMonthExpenses,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
        incomeGrowth,
        expenseGrowth,
        investmentGrowth: 0,
      },
      monthlyData: chartData,
      incomeBreakdown: getBreakdown('income'),
      expenseBreakdown: getBreakdown('expense'),
      investmentAllocation: getBreakdown('investment'),
    });
  } catch (error) {
    console.error('[Analytics API] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
