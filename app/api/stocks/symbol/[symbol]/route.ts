import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    try {
        const decoded = await verifyToken(token);
        return decoded?.userId || null;
    } catch (error) {
        return null;
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { symbol: string } }
) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { symbol } = params;

        // Delete all stocks with this symbol for this user
        const result = await prisma.stock.deleteMany({
            where: {
                userId,
                symbol: symbol.toUpperCase(),
            },
        });

        return NextResponse.json({
            message: `Deleted ${result.count} transactions for ${symbol}`,
            count: result.count
        }, { status: 200 });
    } catch (error) {
        console.error('Delete by symbol error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
