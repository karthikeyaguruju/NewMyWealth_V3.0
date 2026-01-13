export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/db';
import { stockSchema } from '@/lib/validations';

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

        await prisma.stock.delete({
            where: {
                id: params.id,
                userId: user.id
            }
        });

        return NextResponse.json({ message: 'Stock deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('[Stocks ID API] DELETE Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
