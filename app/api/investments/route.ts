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
        console.error('[Investments API] Auth error:', error);
        return null;
    }
    return user;
}

// GET /api/investments - Get investment analytics using Prisma
export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        const userId = user.id;

        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get('startDate');

        // 1. Fetch transactions and stocks via Prisma
        const [allInvestments, allStocks] = await Promise.all([
            prisma.transaction.findMany({
                where: {
                    userId,
                    type: 'investment',
                    status: { not: 'terminated' }
                },
                include: {
                    categoryRel: true
                },
                orderBy: { date: 'asc' }
            }),
            prisma.stock.findMany({
                where: { userId }
            })
        ]);

        // 2. Aggregate category breakdown
        const byCategory: Record<string, number> = {};
        allInvestments.forEach((t) => {
            const catName = t.categoryRel?.name || t.category || 'Uncategorized';
            byCategory[catName] = (byCategory[catName] || 0) + t.amount;
        });

        // 3. Process Stock holdings (EQUITY)
        const stockHoldings = allStocks.reduce((acc: any, stock: any) => {
            const symbol = stock.symbol.toUpperCase();
            if (!acc[symbol]) {
                acc[symbol] = { quantity: 0, totalInvested: 0 };
            }

            if (stock.type === 'BUY') {
                acc[symbol].quantity += stock.quantity;
                acc[symbol].totalInvested += (stock.quantity * stock.buyPrice);
            } else {
                // If it's a SELL, we reduce quantity and proportional cost basis
                const prevQuantity = acc[symbol].quantity;
                if (prevQuantity > 0) {
                    const avgCost = acc[symbol].totalInvested / prevQuantity;
                    acc[symbol].quantity -= stock.quantity;
                    acc[symbol].totalInvested -= (stock.quantity * avgCost);
                }
            }
            return acc;
        }, {});

        let totalStockInvested = 0;
        Object.values(stockHoldings).forEach((holding: any) => {
            if (holding.quantity > 0) {
                totalStockInvested += Math.max(0, holding.totalInvested);
            }
        });

        if (totalStockInvested > 0) {
            byCategory['Equity Stocks'] = (byCategory['Equity Stocks'] || 0) + totalStockInvested;
        }

        // 4. Summaries
        const totalInvested = Object.values(byCategory).reduce((sum, amt) => sum + amt, 0);
        const categoryBreakdown = Object.entries(byCategory).map(([category, amount]) => ({
            category,
            amount: Math.max(0, amount),
        }));
        const allocation = categoryBreakdown.map(item => ({
            name: item.category,
            value: item.amount
        }));

        // 5. Monthly History
        const unifiedTransactions = [
            ...allInvestments.map(t => ({ date: t.date, amount: t.amount })),
            ...allStocks.map(s => ({
                date: s.date || s.createdAt,
                amount: s.type === 'BUY' ? (s.quantity * s.buyPrice) : -(s.quantity * (s.sellPrice || s.buyPrice))
            }))
        ];

        const today = new Date();
        let historyMonths = searchParams.get('historyMonths') ? parseInt(searchParams.get('historyMonths')!) : 6;
        if (startDateStr === 'all' || searchParams.get('historyMonths') === 'ALL') {
            if (unifiedTransactions.length > 0) {
                const oldestTx = unifiedTransactions.reduce((oldest, tx) =>
                    tx.date < oldest ? tx.date : oldest, new Date());
                const monthsDiff = (today.getUTCFullYear() - oldestTx.getUTCFullYear()) * 12 + (today.getUTCMonth() - oldestTx.getUTCMonth());
                historyMonths = Math.max(monthsDiff + 1, 12);
            } else {
                historyMonths = 12;
            }
        }

        const monthlyData: any[] = [];
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

        const monthlyGrowth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

        for (let i = historyMonths - 1; i >= 0; i--) {
            const mDate = subMonths(today, i);
            const mStart = startOfMonth(mDate);
            const mEnd = endOfMonth(mDate);
            const mLabel = format(mDate, 'MMM yyyy');

            const mInvestments = allInvestments.filter(t => t.date >= mStart && t.date <= mEnd);
            const mStocks = allStocks.filter(s => {
                const sDate = s.date || s.createdAt;
                return sDate >= mStart && sDate <= mEnd && s.type === 'BUY';
            });

            const mCategoryBreakdown: Record<string, number> = {};
            mInvestments.forEach(t => {
                const catName = t.categoryRel?.name || t.category || 'Uncategorized';
                mCategoryBreakdown[catName] = (mCategoryBreakdown[catName] || 0) + t.amount;
            });
            const sAmount = mStocks.reduce((sum, s) => sum + (s.quantity * s.buyPrice), 0);
            if (sAmount > 0) mCategoryBreakdown['Equity Stocks'] = (mCategoryBreakdown['Equity Stocks'] || 0) + sAmount;

            monthlyData.push({
                month: mLabel,
                amount: Object.values(mCategoryBreakdown).reduce((sum, amt) => sum + amt, 0),
                count: mInvestments.length + mStocks.length,
                ...mCategoryBreakdown
            });
        }

        return NextResponse.json({
            totalInvested,
            categoryCount: categoryBreakdown.length,
            monthlyGrowth,
            categoryBreakdown,
            allocation,
            monthlyData,
            categories: Object.keys(byCategory)
        }, { status: 200 });

    } catch (error) {
        console.error('[Investments API] GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
