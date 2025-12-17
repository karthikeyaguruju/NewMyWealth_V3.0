// Activity Logs API route
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    const decoded = await verifyToken(token);
    return decoded?.userId || null;
}

// GET /api/activity-logs - Get recent activity logs for the user
export async function GET(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        const logs = await prisma.activityLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return NextResponse.json({ logs }, { status: 200 });
    } catch (error) {
        console.error('Get activity logs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/activity-logs - Create a new activity log
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { action, description, icon, metadata } = body;

        if (!action || !description) {
            return NextResponse.json({ error: 'Action and description are required' }, { status: 400 });
        }

        const log = await prisma.activityLog.create({
            data: {
                userId,
                action,
                description,
                icon: icon || 'info',
                metadata: metadata || null,
            },
        });

        return NextResponse.json({ log }, { status: 201 });
    } catch (error) {
        console.error('Create activity log error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/activity-logs - Clear all activity logs for the user
export async function DELETE(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        await prisma.activityLog.deleteMany({
            where: { userId },
        });

        return NextResponse.json({ message: 'Activity logs cleared' }, { status: 200 });
    } catch (error) {
        console.error('Clear activity logs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
