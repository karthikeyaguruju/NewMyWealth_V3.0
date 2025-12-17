// Migration API to update existing users' categories
// This endpoint will:
// 1. Add "Fixed Deposits" to Investment category for all users who don't have it
// 2. Rename "Investments" to "Investment Returns" in Income category for all users

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// GET /api/admin/migrate-categories - Run the migration
export async function GET(request: NextRequest) {
    try {
        // Optional: Verify the user is authenticated (for security)
        const token = request.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded?.userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Get all users
        const users = await prisma.user.findMany({
            select: { id: true },
        });

        let fixedDepositsAdded = 0;
        let investmentsRenamed = 0;
        let errors: string[] = [];

        for (const user of users) {
            try {
                // 1. Add "Fixed Deposits" to Investment category if it doesn't exist
                const existingFixedDeposits = await prisma.category.findFirst({
                    where: {
                        userId: user.id,
                        name: 'Fixed Deposits',
                        categoryGroup: 'Investment',
                    },
                });

                if (!existingFixedDeposits) {
                    await prisma.category.create({
                        data: {
                            name: 'Fixed Deposits',
                            categoryGroup: 'Investment',
                            isDefault: true,
                            userId: user.id,
                        },
                    });
                    fixedDepositsAdded++;
                }

                // 2. Rename "Investments" to "Investment Returns" in Income category
                const existingInvestments = await prisma.category.findFirst({
                    where: {
                        userId: user.id,
                        name: 'Investments',
                        categoryGroup: 'Income',
                    },
                });

                if (existingInvestments) {
                    // Check if "Investment Returns" already exists
                    const existingInvestmentReturns = await prisma.category.findFirst({
                        where: {
                            userId: user.id,
                            name: 'Investment Returns',
                            categoryGroup: 'Income',
                        },
                    });

                    if (!existingInvestmentReturns) {
                        // Rename "Investments" to "Investment Returns"
                        await prisma.category.update({
                            where: { id: existingInvestments.id },
                            data: { name: 'Investment Returns' },
                        });
                        investmentsRenamed++;
                    }
                }
            } catch (userError: any) {
                errors.push(`User ${user.id}: ${userError.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Migration completed successfully',
            stats: {
                totalUsers: users.length,
                fixedDepositsAdded,
                investmentsRenamed,
                errors: errors.length,
            },
            errors: errors.length > 0 ? errors : undefined,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({
            error: 'Migration failed',
            details: error.message
        }, { status: 500 });
    }
}
