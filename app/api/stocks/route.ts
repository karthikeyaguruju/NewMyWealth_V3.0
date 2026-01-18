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
        console.error('[Stocks API] Auth error:', error);
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

        const searchParams = request.nextUrl.searchParams;
        const page = searchParams.get('page');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search');
        const type = searchParams.get('type');

        const where: any = {
            userId: user.id
        };

        if (search) {
            where.OR = [
                { symbol: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (type && type !== 'all') {
            where.type = type.toUpperCase();
        }

        const skip = page ? (parseInt(page) - 1) * limit : undefined;
        const take = page ? limit : undefined;

        const [total, stocks] = await Promise.all([
            prisma.stock.count({ where }),
            prisma.stock.findMany({
                where,
                orderBy: { date: 'desc' },
                skip,
                take
            })
        ]);

        // Map Prisma models to frontend camelCase
        const mappedStocks = (stocks || []).map(s => ({
            id: s.id,
            userId: s.userId,
            symbol: s.symbol,
            name: s.name,
            quantity: Number(s.quantity),
            buyPrice: Number(s.buyPrice),
            sellPrice: s.sellPrice ? Number(s.sellPrice) : null,
            currentPrice: s.currentPrice ? Number(s.currentPrice) : null,
            broker: s.broker,
            type: s.type,
            date: s.date,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            totalValue: Number(s.quantity) * Number(s.buyPrice)
        }));

        return NextResponse.json({
            stocks: mappedStocks,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page ? parseInt(page) : 1,
                limit
            }
        });
    } catch (error) {
        console.error('[Stocks API] GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = stockSchema.parse(body);

        const stock = await prisma.stock.create({
            data: {
                userId: user.id,
                symbol: validatedData.symbol.toUpperCase(),
                name: validatedData.name,
                quantity: parseFloat(validatedData.quantity.toString()),
                buyPrice: parseFloat(validatedData.buyPrice.toString()),
                broker: validatedData.broker,
                type: validatedData.type.toUpperCase(),
                date: validatedData.date ? new Date(validatedData.date) : new Date()
            }
        });

        // Log activity
        await logActivity({
            userId: user.id,
            action: ActivityActions.INVESTMENT_ADDED,
            description: `Added new ${stock.type} investment: ${stock.name} (${stock.symbol})`,
            icon: 'success',
            metadata: {
                stockId: stock.id,
                symbol: stock.symbol,
                name: stock.name,
                type: stock.type,
                quantity: stock.quantity,
                buyPrice: stock.buyPrice
            }
        });

        return NextResponse.json({ stock, averaged: false }, { status: 201 });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        console.error('[Stocks API] POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
