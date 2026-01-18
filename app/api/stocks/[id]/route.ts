export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/db';
import { stockSchema } from '@/lib/validations';
import { logActivity, ActivityActions } from '@/lib/activity-logger';

async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
        console.error('[Stocks ID API] Auth error:', error);
        return null;
    }
    return user;
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = stockSchema.parse(body);

        // Get existing stock for logging
        const existingStock = await prisma.stock.findUnique({
            where: { id: params.id, userId: user.id }
        });

        if (!existingStock) {
            return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
        }

        const stock = await prisma.stock.update({
            where: {
                id: params.id,
                userId: user.id
            },
            data: {
                symbol: validatedData.symbol.toUpperCase(),
                name: validatedData.name,
                quantity: parseFloat(validatedData.quantity.toString()),
                buyPrice: parseFloat(validatedData.buyPrice.toString()),
                broker: validatedData.broker,
                type: validatedData.type.toUpperCase(),
                date: validatedData.date ? new Date(validatedData.date) : undefined,
            }
        });

        // Log activity
        await logActivity({
            userId: user.id,
            action: ActivityActions.INVESTMENT_UPDATED,
            description: `Updated ${stock.type} investment: ${stock.name} (${stock.symbol})`,
            icon: 'info',
            metadata: {
                stockId: stock.id,
                symbol: stock.symbol,
                name: stock.name,
                type: stock.type,
                previousData: {
                    symbol: existingStock.symbol,
                    quantity: existingStock.quantity,
                    buyPrice: existingStock.buyPrice
                }
            }
        });

        return NextResponse.json({ stock }, { status: 200 });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        console.error('[Stocks ID API] PUT Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get stock data before deleting for logging
        const stock = await prisma.stock.findUnique({
            where: { id: params.id, userId: user.id }
        });

        if (!stock) {
            return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
        }

        await prisma.stock.delete({
            where: {
                id: params.id,
                userId: user.id
            }
        });

        // Log activity
        await logActivity({
            userId: user.id,
            action: ActivityActions.INVESTMENT_DELETED,
            description: `Deleted ${stock.type} investment: ${stock.name} (${stock.symbol})`,
            icon: 'error',
            metadata: {
                stockId: stock.id,
                symbol: stock.symbol,
                name: stock.name,
                type: stock.type
            }
        });

        return NextResponse.json({ message: 'Stock deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('[Stocks ID API] DELETE Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
