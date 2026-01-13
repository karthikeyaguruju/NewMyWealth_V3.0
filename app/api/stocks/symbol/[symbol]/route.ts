export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';

/** Extract user from Supabase token */
async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        console.error('[Stocks Symbol API] Auth error:', error);
        return null;
    }
    return user;
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { symbol: string } }
) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { symbol } = params;

        // Delete all stocks with this symbol for this user
        const result = await prisma.stock.deleteMany({
            where: {
                userId: user.id,
                symbol: symbol.toUpperCase(),
            },
        });

        return NextResponse.json({
            message: `Deleted ${result.count} transactions for ${symbol}`,
            count: result.count
        }, { status: 200 });
    } catch (error) {
        console.error('[Stocks Symbol API] DELETE Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
