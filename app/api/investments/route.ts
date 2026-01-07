// Investments API route
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

/** Extract user from Supabase token */
async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

// GET /api/investments - Get investment analytics
export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        const userId = user.id;
        const supabaseService = getServiceSupabase();

        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        // Get all investment transactions and stocks
        const { data: allInvestments, error: invError } = await supabaseService
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('type', 'investment')
            .order('date', { ascending: true });

        const { data: allStocks, error: stockError } = await supabaseService
            .from('stocks')
            .select('*')
            .eq('user_id', userId);

        if (invError || stockError) {
            console.error('Database error:', invError || stockError);
            throw invError || stockError;
        }

        const stocks = allStocks || [];
        // Filter out terminated investments
        const investments = (allInvestments || []).filter(t => t.status !== 'terminated');

        // Group by category
        const byCategory: Record<string, number> = {};
        investments.forEach((t) => {
            byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        });

        // Group raw stock transactions by symbol to get active holdings
        const stockHoldings = stocks.reduce((acc: any, stock: any) => {
            const symbol = stock.symbol.toUpperCase();
            if (!acc[symbol]) {
                acc[symbol] = { quantity: 0, totalInvested: 0 };
            }

            if (stock.type === 'BUY') {
                acc[symbol].quantity += stock.quantity;
                acc[symbol].totalInvested += (stock.quantity * stock.buy_price);
            } else {
                acc[symbol].quantity -= stock.quantity;
                const avgCost = acc[symbol].totalInvested / (acc[symbol].quantity + stock.quantity);
                acc[symbol].totalInvested -= (stock.quantity * (avgCost || 0));
            }
            return acc;
        }, {});

        let totalStockInvested = 0;
        Object.values(stockHoldings).forEach((holding: any) => {
            if (holding.quantity > 0) {
                totalStockInvested += holding.totalInvested;
            }
        });

        if (totalStockInvested > 0) {
            byCategory['Equity Stocks'] = (byCategory['Equity Stocks'] || 0) + totalStockInvested;
        }

        // Total invested (Transactions + Stocks)
        const totalInvested = Object.values(byCategory).reduce((sum, amt) => sum + amt, 0);

        const categoryBreakdown = Object.entries(byCategory).map(([category, amount]) => ({
            category,
            amount,
        }));

        // Investment allocation for chart
        const allocation = Object.entries(byCategory).map(([name, value]) => ({
            name,
            value,
        }));

        // Unified data for trends (Investments + Stock Transactions)
        const unifiedTransactions = [
            ...investments.map(t => ({ date: new Date(t.date), amount: t.amount })),
            ...stocks.map(s => ({
                date: new Date(s.date || s.created_at),
                amount: s.type === 'BUY' ? (s.quantity * s.buy_price) : -(s.quantity * (s.sell_price || s.buy_price))
            }))
        ];

        // Generate trend data based on historyMonths
        const historyMonths = searchParams.get('historyMonths') ? parseInt(searchParams.get('historyMonths')!) : 6;
        const monthlyData: any[] = [];
        const today = new Date();

        // Calculate this month's and last month's totals for growth
        const thisMonthStart = startOfMonth(today);
        const lastMonthDate = subMonths(today, 1);
        const lastMonthStart = startOfMonth(lastMonthDate);
        const lastMonthEnd = endOfMonth(lastMonthDate);

        const thisMonthTotal = unifiedTransactions
            .filter(t => t.date >= thisMonthStart)
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthTotal = unifiedTransactions
            .filter(t => t.date >= lastMonthStart && t.date <= lastMonthEnd)
            .reduce((sum, t) => sum + t.amount, 0);

        const monthlyGrowth = lastMonthTotal > 0
            ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
            : 0;

        // Get all unique categories
        const allCategories = Object.keys(byCategory);

        for (let i = historyMonths - 1; i >= 0; i--) {
            const monthDate = subMonths(today, i);
            const monthStart = startOfMonth(monthDate);
            const monthEnd = endOfMonth(monthDate);
            monthEnd.setHours(23, 59, 59, 999);
            const monthLabel = format(monthDate, 'MMM yyyy');

            // Get investment transactions for this month grouped by category
            const monthInvestments = investments.filter((t) => {
                const txDate = new Date(t.date);
                return txDate >= monthStart && txDate <= monthEnd;
            });

            // Get stock purchases for this month
            const monthStocks = stocks.filter((s: any) => {
                if (!s.date && !s.created_at) return false;
                const stockDate = new Date(s.date || s.created_at);
                return stockDate >= monthStart && stockDate <= monthEnd && s.type === 'BUY';
            });
            const stocksAmount = monthStocks.reduce((sum: number, s: any) => sum + (s.quantity * s.buy_price), 0);

            // Build category breakdown for this month
            const monthCategoryBreakdown: Record<string, number> = {};
            monthInvestments.forEach((t) => {
                monthCategoryBreakdown[t.category] = (monthCategoryBreakdown[t.category] || 0) + t.amount;
            });
            if (stocksAmount > 0) {
                monthCategoryBreakdown['Equity Stocks'] = (monthCategoryBreakdown['Equity Stocks'] || 0) + stocksAmount;
            }

            const totalAmount = Object.values(monthCategoryBreakdown).reduce((sum, amt) => sum + amt, 0);
            const count = monthInvestments.length + monthStocks.length;

            monthlyData.push({
                month: monthLabel,
                amount: Math.max(0, totalAmount),
                count,
                // Include category-wise amounts for stacked/grouped charts
                ...monthCategoryBreakdown,
            });
        }

        return NextResponse.json({
            totalInvested,
            categoryCount: Object.keys(byCategory).length,
            monthlyGrowth,
            categoryBreakdown,
            allocation,
            monthlyData,
            categories: allCategories, // Send category list for chart legend
        }, { status: 200 });
    } catch (error) {
        console.error('Get investments error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
