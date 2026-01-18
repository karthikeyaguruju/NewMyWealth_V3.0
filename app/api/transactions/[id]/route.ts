export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { transactionSchema } from '@/lib/validations';
import { logActivity, ActivityActions } from '@/lib/activity-logger';

/** Extract user from Supabase token */
async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        console.error('[Transactions ID API] Auth error:', error);
        return null;
    }
    return user;
}

// PUT /api/transactions/[id] - Update transaction
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUser(request);

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();

        // Check if transaction exists and belongs to user
        const existingTransaction = await prisma.transaction.findFirst({
            where: { id, userId: user.id },
        });

        if (!existingTransaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // Validate input
        const validatedData = transactionSchema.parse(body);

        // Convert date string (YYYY-MM-DD) to proper Date object
        const [year, month, day] = validatedData.date.split('-').map(Number);
        const dateObject = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                type: validatedData.type.toLowerCase(),
                categoryGroup: validatedData.categoryGroup,
                category: validatedData.category,
                subCategory: validatedData.subCategory,
                amount: parseFloat(validatedData.amount.toString()),
                date: dateObject,
                notes: validatedData.notes,
                categoryId: validatedData.categoryId || null,
            },
            include: {
                categoryRel: true
            }
        });

        // Log activity
        await logActivity({
            userId: user.id,
            action: ActivityActions.TRANSACTION_UPDATED,
            description: `Updated ${transaction.type} transaction: ${transaction.amount} in ${transaction.categoryRel?.name || transaction.category || 'Uncategorized'}`,
            icon: 'info',
            metadata: {
                transactionId: transaction.id,
                amount: transaction.amount,
                type: transaction.type,
                category: transaction.categoryRel?.name || transaction.category,
                previousData: {
                    amount: existingTransaction.amount,
                    type: existingTransaction.type,
                    category: existingTransaction.category
                }
            }
        });

        return NextResponse.json({
            transaction: {
                ...transaction,
                date: transaction.date.toISOString(),
                category: transaction.categoryRel?.name || transaction.category || 'Uncategorized'
            }
        }, { status: 200 });
    } catch (error: any) {
        console.error('[Transactions ID API] PUT Error:', error);

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/transactions/[id] - Delete transaction
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUser(request);

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id } = params;

        // Check if transaction exists and belongs to user
        const transaction = await prisma.transaction.findFirst({
            where: { id, userId: user.id },
        });

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        await prisma.transaction.delete({ where: { id } });

        // Log activity
        await logActivity({
            userId: user.id,
            action: ActivityActions.TRANSACTION_DELETED,
            description: `Deleted ${transaction.type} transaction for ${transaction.amount}`,
            icon: 'error',
            metadata: {
                transactionId: transaction.id,
                amount: transaction.amount,
                type: transaction.type,
                category: transaction.category
            }
        });

        return NextResponse.json({ message: 'Transaction deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('[Transactions ID API] DELETE Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
