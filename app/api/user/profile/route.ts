import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    return decoded?.userId || null;
}

// PUT /api/user/profile - Update user profile and settings
export async function PUT(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { fullName, email, enableBudgetAlerts, monthlyBudget } = body;

        // Validation could be added here (e.g., email format)

        // Check if email is being changed and if it's already taken
        if (email) {
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });
            if (existingUser && existingUser.id !== userId) {
                return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                fullName,
                email,
                enableBudgetAlerts,
                monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                enableBudgetAlerts: true,
                monthlyBudget: true,
            },
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/user/profile - Delete user account
export async function DELETE(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        const response = NextResponse.json({ message: 'Account deleted successfully' });
        response.cookies.delete('token'); // Clear auth cookie
        return response;
    } catch (error) {
        console.error('Delete account error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
