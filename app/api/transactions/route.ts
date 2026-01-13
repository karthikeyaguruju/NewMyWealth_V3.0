// Transactions API routes - Refactored to use Prisma
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/db';
import { transactionSchema } from '@/lib/validations';

/** Extract user from Supabase token */
async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        console.error('[Transactions API] Auth error:', error);
        return null;
    }
    return user;
}

/** GET /api/transactions – list with filters, sorting, pagination */
export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const category = searchParams.get('category'); // This can be name or ID, but frontend mostly sends it for filtering
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        const minAmount = searchParams.get('minAmount');
        const maxAmount = searchParams.get('maxAmount');
        const description = searchParams.get('description');
        const sortBy = searchParams.get('sortBy') || 'date';
        const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // Build Prisma where clause
        const where: any = {
            userId: user.id
        };

        if (type) where.type = type.toLowerCase();

        if (category) {
            where.OR = [
                { category: { contains: category, mode: 'insensitive' } },
                { categoryRel: { name: { contains: category, mode: 'insensitive' } } }
            ];
        }

        if (startDateStr || endDateStr) {
            where.date = {};
            if (startDateStr) where.date.gte = new Date(startDateStr);
            if (endDateStr) where.date.lte = new Date(endDateStr);
        }

        if (minAmount || maxAmount) {
            where.amount = {};
            if (minAmount) where.amount.gte = parseFloat(minAmount);
            if (maxAmount) where.amount.lte = parseFloat(maxAmount);
        }

        if (description) {
            where.notes = { contains: description, mode: 'insensitive' };
        }

        // Fetch counts and data using Prisma
        const [totalCount, transactions] = await Promise.all([
            prisma.transaction.count({ where }),
            prisma.transaction.findMany({
                where,
                include: {
                    categoryRel: true
                },
                orderBy: {
                    [sortBy]: order
                },
                skip,
                take: limit
            })
        ]);

        // Map Prisma results to frontend format
        const mappedTransactions = transactions.map(t => ({
            id: t.id,
            amount: t.amount,
            date: t.date.toISOString(),
            type: t.type,
            notes: t.notes,
            category: t.categoryRel?.name || t.category || 'Uncategorized',
            categoryId: t.categoryId,
            categoryGroup: t.categoryGroup,
            status: t.status,
            description: t.notes || ''
        }));

        return NextResponse.json({
            transactions: mappedTransactions,
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                page,
                limit
            },
        }, { status: 200 });
    } catch (error: any) {
        console.error('[Transactions API] GET Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

/** POST /api/transactions – create a new transaction */
export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = transactionSchema.parse(body);

        // Date handling
        const [year, month, day] = validatedData.date.split('-').map(Number);
        const dateObject = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

        // Create transaction using Prisma
        const transaction = await prisma.transaction.create({
            data: {
                userId: user.id,
                type: validatedData.type.toLowerCase(),
                amount: validatedData.amount,
                date: dateObject,
                notes: validatedData.notes,
                categoryId: validatedData.categoryId || null,
                // Optional: sync category info
                category: validatedData.category || null,
                categoryGroup: validatedData.categoryGroup || null,
            },
            include: {
                categoryRel: true
            }
        });

        return NextResponse.json({
            transaction: {
                ...transaction,
                date: transaction.date.toISOString(),
                category: transaction.categoryRel?.name || transaction.category || 'Uncategorized'
            }
        }, { status: 201 });
    } catch (error: any) {
        console.error('[Transactions API] POST Error:', error);
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
