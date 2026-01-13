export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const decoded = await verifyToken(token);
    return decoded?.userId || null;
}

// POST /api/transactions/[id]/terminate - Terminate an investment (FD/Bond)
export async function POST(
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
        const { maturityAmount } = body; // Optional: amount received at maturity (may include interest)

        // Find the investment transaction
        const investment = await prisma.transaction.findFirst({
            where: { id, userId, type: 'investment' },
        });

        if (!investment) {
            return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
        }

        // Check if already terminated
        if (investment.status === 'terminated') {
            return NextResponse.json({ error: 'Investment already terminated' }, { status: 400 });
        }

        // Check if it's a terminable category (Fixed Deposits or Bonds)
        const terminableCategories = ['Fixed Deposits', 'Bonds'];
        if (!investment.category || !terminableCategories.includes(investment.category)) {
            return NextResponse.json({
                error: 'Only Fixed Deposits and Bonds can be terminated'
            }, { status: 400 });
        }

        // Calculate the final amount (use maturityAmount if provided, otherwise use original amount)
        const finalAmount = maturityAmount && maturityAmount > 0 ? maturityAmount : investment.amount;

        // Use a transaction to ensure both operations succeed or fail together
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update the investment status to 'terminated'
            const updatedInvestment = await tx.transaction.update({
                where: { id },
                data: {
                    status: 'terminated',
                    notes: investment.notes
                        ? `${investment.notes} | Terminated on ${new Date().toLocaleDateString()}`
                        : `Terminated on ${new Date().toLocaleDateString()}`
                },
            });

            // 2. Create an income transaction for the maturity amount
            const incomeTransaction = await tx.transaction.create({
                data: {
                    userId,
                    type: 'income',
                    categoryGroup: 'Income',
                    category: 'Investment Returns',
                    amount: finalAmount,
                    date: new Date(),
                    notes: `Maturity from ${investment.category}: ${investment.notes || 'Investment matured'}`,
                    status: 'active',
                },
            });

            return { updatedInvestment, incomeTransaction };
        });

        return NextResponse.json({
            message: 'Investment terminated successfully',
            investment: result.updatedInvestment,
            incomeTransaction: result.incomeTransaction,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Terminate investment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
