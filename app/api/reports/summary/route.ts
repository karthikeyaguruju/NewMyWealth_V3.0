export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

/** Extract user from Supabase token */
async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        console.error('Supabase Auth error:', error);
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

        const supabaseService = getServiceSupabase();

        // Fetch all transactions for the month
        const { data: transactions, error } = await supabaseService
            .from('transactions')
            .select('*, categories(name, category_group)')
            .eq('user_id', user.id)
            .gte('date', startDate.toISOString())
            .lte('date', endDate.toISOString());

        if (error) throw error;

        // Initialize summary
        const summary = {
            totalIncome: 0,
            totalExpenses: 0,
            totalInvestments: 0,
            netSavings: 0,
            categoryBreakdown: {} as Record<string, number>,
            transactionCount: transactions?.length || 0,
            topTransactions: [] as any[]
        };

        (transactions || []).forEach(t => {
            const amount = parseFloat(t.amount);
            const type = t.type.toLowerCase();

            if (type === 'income') {
                summary.totalIncome += amount;
            } else if (type === 'expense') {
                summary.totalExpenses += amount;
                const catName = (t.categories as any)?.name || 'Uncategorized';
                summary.categoryBreakdown[catName] = (summary.categoryBreakdown[catName] || 0) + amount;
            } else if (type === 'investment') {
                summary.totalInvestments += amount;
            }
        });

        summary.netSavings = summary.totalIncome - summary.totalExpenses - summary.totalInvestments;

        // Sort top transactions by amount
        summary.topTransactions = [...(transactions || [])]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
            .map(t => ({
                id: t.id,
                amount: t.amount,
                date: t.date,
                notes: t.notes,
                type: t.type,
                category: (t.categories as any)?.name || 'Uncategorized'
            }));

        return NextResponse.json(summary);
    } catch (error) {
        console.error('Report summary error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
