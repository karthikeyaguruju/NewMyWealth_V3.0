import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { transactionSchema } from '@/lib/validations';

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    return decoded?.userId || null;
}

// PUT /api/transactions/[id] - Update transaction
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getUserId(request);

        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Check if transaction exists and belongs to user
        const existingTransaction = await prisma.transaction.findFirst({
            where: { id, userId },
        });

        if (!existingTransaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // Validate input
        const validatedData = transactionSchema.parse(body);

        const transaction = await prisma.transaction.update({
            where: { id },
            data: validatedData,
        });

        return NextResponse.json({ transaction }, { status: 200 });
    } catch (error: any) {
        console.error('Update transaction error:', error);

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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getUserId(request);

        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id } = await params;

        // Check if transaction exists and belongs to user
        const transaction = await prisma.transaction.findFirst({
            where: { id, userId },
        });

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        await prisma.transaction.delete({ where: { id } });

        return NextResponse.json({ message: 'Transaction deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Delete transaction error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
