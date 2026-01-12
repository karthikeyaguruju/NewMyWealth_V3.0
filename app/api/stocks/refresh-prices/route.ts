import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/db';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '0b660c484dmsh36da1690e37f3a2p19a993jsn9f650c04dd24';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'yahoo-finance15.p.rapidapi.com';

async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // 1. Get all user's stocks using Prisma
        const stocks = await prisma.stock.findMany({
            where: { userId: user.id },
            select: { id: true, symbol: true }
        });

        if (!stocks || stocks.length === 0) {
            return NextResponse.json({ message: 'No stocks to update' }, { status: 200 });
        }

        // 2. Format symbols for Yahoo Finance
        const symbols = stocks.map(s => {
            const sym = s.symbol.trim().toUpperCase();

            // If user already specified the exchange, respect it
            if (sym.endsWith('.NS') || sym.endsWith('.BO')) {
                return sym;
            }

            // Otherwise, apply heuristic for Indian stocks (NS for NSE, BO for BSE)
            const isNumeric = /^\d+$/.test(sym);
            return isNumeric ? `${sym}.BO` : `${sym}.NS`;
        }).join(',');

        // 3. Fetch live prices from Yahoo Finance via RapidAPI
        const url = `https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/quotes?ticker=${symbols}`;
        const response = await fetch(url, {
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Stocks Refresh] RapidAPI Error:', errorText);
            throw new Error('Failed to fetch prices from live market API');
        }

        const data = await response.json();
        const priceData = data.body || [];

        // Create a map of symbol to price
        const priceMap: Record<string, number> = {};
        priceData.forEach((item: any) => {
            // Store with full ticker (e.g. RELIANCE.NS) and base ticker (RELIANCE)
            const symbol = item.symbol;
            const baseSymbol = symbol.replace('.NS', '').replace('.BO', '');
            priceMap[symbol] = item.regularMarketPrice;
            priceMap[baseSymbol] = item.regularMarketPrice;
        });

        // 4. Update each stock with the current price using Prisma
        // We use Promise.all to run updates in parallel
        await Promise.all(stocks.map(async (stock) => {
            const price = priceMap[stock.symbol] ||
                priceMap[`${stock.symbol}.NS`] ||
                priceMap[`${stock.symbol}.BO`];

            if (price) {
                return prisma.stock.update({
                    where: { id: stock.id },
                    data: { currentPrice: parseFloat(price.toString()) }
                });
            }
        }));

        // 5. Fetch and return updated stocks list
        const updatedStocks = await prisma.stock.findMany({
            where: { userId: user.id },
            orderBy: { date: 'desc' }
        });

        const mappedStocks = updatedStocks.map(s => ({
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
            message: 'Prices updated successfully',
            stocks: mappedStocks,
            pricesUpdated: Object.keys(priceMap).length,
        }, { status: 200 });

    } catch (error: any) {
        console.error('[Stocks Refresh] Global Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to refresh prices' }, { status: 500 });
    }
}
