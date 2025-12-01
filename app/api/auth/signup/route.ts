import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { signupSchema } from '@/lib/validations';

// Default categories for new users
const DEFAULT_CATEGORIES = [
    // Income
    { categoryGroup: 'Income', name: 'Salary', isDefault: true },
    { categoryGroup: 'Income', name: 'Freelancing', isDefault: true },
    { categoryGroup: 'Income', name: 'Side Hustle', isDefault: true },
    { categoryGroup: 'Income', name: 'Tuition', isDefault: true },
    // Expense
    { categoryGroup: 'Expense', name: 'Rents', isDefault: true },
    { categoryGroup: 'Expense', name: 'Insurance', isDefault: true },
    { categoryGroup: 'Expense', name: 'Mobile Recharge', isDefault: true },
    { categoryGroup: 'Expense', name: 'Food/Grocery', isDefault: true },
    { categoryGroup: 'Expense', name: 'Fun', isDefault: true },
    { categoryGroup: 'Expense', name: 'Beauty', isDefault: true },
    { categoryGroup: 'Expense', name: 'Bike EMI', isDefault: true },
    { categoryGroup: 'Expense', name: 'Phone EMI', isDefault: true },
    { categoryGroup: 'Expense', name: 'Miscellaneous', isDefault: true },
    { categoryGroup: 'Expense', name: 'Children', isDefault: true },
    { categoryGroup: 'Expense', name: 'Investment', isDefault: true },
    // Investment
    { categoryGroup: 'Investment', name: 'Stocks', isDefault: true },
    { categoryGroup: 'Investment', name: 'Mutual Funds', isDefault: true },
    { categoryGroup: 'Investment', name: 'Fixed Deposit', isDefault: true },
    { categoryGroup: 'Investment', name: 'PPF', isDefault: true },
    { categoryGroup: 'Investment', name: 'NPS', isDefault: true },
    { categoryGroup: 'Investment', name: 'Bonds', isDefault: true },
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validatedData = signupSchema.parse(body);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(validatedData.password);

        // Create user
        const user = await prisma.user.create({
            data: {
                fullName: validatedData.fullName,
                email: validatedData.email,
                passwordHash,
            },
        });

        // Create default categories for the user
        await prisma.category.createMany({
            data: DEFAULT_CATEGORIES.map((cat) => ({
                userId: user.id,
                ...cat,
            })),
        });

        return NextResponse.json(
            { message: 'User created successfully', userId: user.id },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Signup error:', error);

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
