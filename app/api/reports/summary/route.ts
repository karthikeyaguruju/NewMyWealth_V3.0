export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/db';

/** Extract user from Supabase token */
async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        console.error('[Reports Summary] Auth error:', error);
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

        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
        const year = parseInt(searchParams.get('year') || (new Date().getFullYear()).toString());

        // Calculate date range for the month
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

        // Fetch all transactions for the month using Prisma
        const transactions = await prisma.transaction.findMany({
            where: {
                userId: user.id,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                categoryRel: true
            }
        });

        // Initialize summary
        const summary = {
            totalIncome: 0,
            totalExpenses: 0,
            totalInvestments: 0,
            netSavings: 0,
            categoryBreakdown: {} as Record<string, number>,
            transactionCount: transactions.length,
            topTransactions: [] as any[]
        };

        transactions.forEach(t => {
            const amount = t.amount;
            const type = t.type.toLowerCase();

            if (type === 'income') {
                summary.totalIncome += amount;
            } else if (type === 'expense') {
                summary.totalExpenses += amount;
                const catName = t.categoryRel?.name || t.category || 'Uncategorized';
                summary.categoryBreakdown[catName] = (summary.categoryBreakdown[catName] || 0) + amount;
            } else if (type === 'investment') {
                summary.totalInvestments += amount;
            }
        });

        summary.netSavings = summary.totalIncome - summary.totalExpenses;

        // --- NEW FUTURISTIC FEATURES ---

        // 1. Financial Efficiency Score (0-100)
        const savingsRate = summary.totalIncome > 0 ? (summary.netSavings / summary.totalIncome) * 100 : 0;
        const efficiencyScore = Math.min(100, Math.max(0, savingsRate * 1.5));

        // 2. Wealth Forecast
        const monthlyContribution = summary.netSavings;
        const projected1Year = monthlyContribution * 12 * 1.04;
        const projected5Years = monthlyContribution * 60 * 1.25;

        // 3. AI Insights
        let primaryInsight = "Your financial health is stable.";
        if (savingsRate > 30) {
            primaryInsight = "Excellent! You are saving over 30% of your income. You are on the fast track to financial freedom.";
        } else if (savingsRate < 10 && summary.totalIncome > 0) {
            primaryInsight = "Warning: Your savings rate is low. Try to reduce discretionary expenses to build a safety net.";
        }

        const futuristData = {
            efficiencyScore: Math.round(efficiencyScore),
            projections: {
                oneYear: Math.round(projected1Year),
                fiveYears: Math.round(projected5Years),
            },
            aiInsights: [
                primaryInsight,
                summary.totalInvestments > 0 ? "Your investment diversification looks healthy." : "No investments recorded this month. Consider starting an SIP.",
                summary.totalExpenses > summary.totalIncome ? "Critical: Expenses exceeded income this month." : "Success: You lived within your means."
            ]
        };

        // 4. Detailed Transaction List for the Reports Table
        const allTransactions = transactions
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .map(t => ({
                id: t.id,
                amount: t.amount,
                date: t.date.toISOString(),
                notes: t.notes || 'No description',
                type: t.type,
                status: t.type.toLowerCase() === 'income' ? 'Credit' : 'Debit',
                category: t.categoryRel?.name || t.category || 'Uncategorized',
                categoryGroup: t.categoryRel?.categoryGroup || t.categoryGroup || 'General',
                subCategory: t.subCategory || null,
            }));

        return NextResponse.json({ ...summary, allTransactions, ...futuristData });
    } catch (error) {
        console.error('[Reports Summary API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
