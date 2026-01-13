export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/db';

// Helper to get user from token
async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
        console.error('[Categories API] Auth Error:', error);
        return null;
    }
    return user;
}

// GET /api/categories - Get all categories for user (with auto-seed if empty)
export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const categoryGroup = searchParams.get('categoryGroup');

        // 1. Ensure profile exists - Using Prisma
        let profile;
        try {
            profile = await prisma.user.findUnique({
                where: { id: user.id }
            });
        } catch (dbError: any) {
            console.error('[Categories API] Prisma User Lookup Error:', dbError);
            // This is likely a DATABASE_URL or connection issue on Vercel
            return NextResponse.json({
                error: 'Database connection error',
                details: dbError.message,
                code: 'DB_CONNECTION_ERROR'
            }, { status: 500 });
        }

        if (!profile) {
            console.log(`[Categories API] Creating missing profile for ${user.id}`);
            try {
                await prisma.user.create({
                    data: {
                        id: user.id,
                        email: user.email || '',
                        fullName: user.user_metadata?.full_name || 'User',
                        passwordHash: 'managed_by_supabase_auth'
                    }
                });
            } catch (createError: any) {
                console.error('[Categories API] Profile Creation Error:', createError);
            }
        }

        // 2. Fetch or Seed Categories
        let categories = [];
        try {
            categories = await prisma.category.findMany({
                where: {
                    userId: user.id,
                    ...(categoryGroup ? { categoryGroup } : {})
                },
                orderBy: [
                    { isDefault: 'desc' },
                    { name: 'asc' }
                ]
            });
        } catch (fetchError: any) {
            console.error('[Categories API] Fetch Categories Error:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
        }

        // 3. AUTO-SEED: If the user has 0 categories total, seed default ones
        const totalCount = await prisma.category.count({
            where: { userId: user.id }
        });

        if (totalCount === 0) {
            console.log(`[Categories API] Zero categories for ${user.id}. Seeding defaults...`);

            const defaultCategories = [
                // Income
                { name: 'Salary', categoryGroup: 'Income', isDefault: true, userId: user.id },
                { name: 'Freelancing', categoryGroup: 'Income', isDefault: true, userId: user.id },
                { name: 'Investment Returns', categoryGroup: 'Income', isDefault: true, userId: user.id },
                { name: 'Rental Income', categoryGroup: 'Income', isDefault: true, userId: user.id },
                { name: 'Business', categoryGroup: 'Income', isDefault: true, userId: user.id },

                // Expense
                { name: 'Entertainment', categoryGroup: 'Expense', isDefault: true, userId: user.id },
                { name: 'Groceries', categoryGroup: 'Expense', isDefault: true, userId: user.id },
                { name: 'Healthcare', categoryGroup: 'Expense', isDefault: true, userId: user.id },
                { name: 'Food', categoryGroup: 'Expense', isDefault: true, userId: user.id },
                { name: 'Rent', categoryGroup: 'Expense', isDefault: true, userId: user.id },
                { name: 'Transportation', categoryGroup: 'Expense', isDefault: true, userId: user.id },
                { name: 'Utilities', categoryGroup: 'Expense', isDefault: true, userId: user.id },
                { name: 'Insurance', categoryGroup: 'Expense', isDefault: true, userId: user.id },
                { name: 'Investment Out', categoryGroup: 'Expense', isDefault: true, userId: user.id },
                { name: 'Education', categoryGroup: 'Expense', isDefault: true, userId: user.id },
                { name: 'Travel', categoryGroup: 'Expense', isDefault: true, userId: user.id },

                // Investment
                { name: 'Stocks', categoryGroup: 'Investment', isDefault: true, userId: user.id },
                { name: 'Mutual Funds', categoryGroup: 'Investment', isDefault: true, userId: user.id },
                { name: 'Real Estate', categoryGroup: 'Investment', isDefault: true, userId: user.id },
                { name: 'Crypto', categoryGroup: 'Investment', isDefault: true, userId: user.id },
                { name: 'Gold', categoryGroup: 'Investment', isDefault: true, userId: user.id },
                { name: 'Bonds', categoryGroup: 'Investment', isDefault: true, userId: user.id },
                { name: 'Fixed Deposits', categoryGroup: 'Investment', isDefault: true, userId: user.id },
                { name: 'PPF', categoryGroup: 'Investment', isDefault: true, userId: user.id },
            ];

            // Use createMany for efficiency (Postgres supports this)
            await prisma.category.createMany({
                data: defaultCategories,
                skipDuplicates: true
            });

            // Re-fetch after seeding (respecting filter)
            categories = await prisma.category.findMany({
                where: {
                    userId: user.id,
                    ...(categoryGroup ? { categoryGroup } : {})
                },
                orderBy: [
                    { isDefault: 'desc' },
                    { name: 'asc' }
                ]
            });
        }

        return NextResponse.json({ categories }, { status: 200 });

    } catch (error: any) {
        console.error('[Categories API] Global Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        let { categoryGroup, name } = body;

        if (!categoryGroup || !name) {
            return NextResponse.json(
                { error: 'Category group and name are required' },
                { status: 400 }
            );
        }

        // Ensure user profile exists before creating category
        try {
            await prisma.user.upsert({
                where: { id: user.id },
                update: {},
                create: {
                    id: user.id,
                    email: user.email || '',
                    fullName: user.user_metadata?.full_name || 'User',
                    passwordHash: 'managed_by_supabase_auth'
                }
            });
        } catch (upsertError: any) {
            console.error('[Categories API] User Upsert Error:', upsertError);
            // Non-blocking for now, but logged
        }

        // Normalize capitalization
        const normalizedGroup = categoryGroup.charAt(0).toUpperCase() + categoryGroup.slice(1).toLowerCase();
        const validGroups = ['Income', 'Expense', 'Investment'];
        const finalGroup = validGroups.includes(normalizedGroup) ? normalizedGroup : categoryGroup;

        const category = await prisma.category.create({
            data: {
                userId: user.id,
                categoryGroup: finalGroup,
                name: name,
                isDefault: false,
            }
        });

        return NextResponse.json({ category }, { status: 201 });
    } catch (error: any) {
        console.error('[Categories API] POST Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
