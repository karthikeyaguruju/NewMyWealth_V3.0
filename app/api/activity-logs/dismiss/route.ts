
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return null;
        return user.id;
    } catch (error) {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'IDs array is required' }, { status: 400 });
        }

        // Update logs to be dismissed (don't show in notification bell)
        await (prisma.activityLog as any).updateMany({
            where: {
                id: { in: ids },
                userId: userId
            },
            data: {
                isDismissed: true
            }
        });

        return NextResponse.json({ message: 'Notifications dismissed' }, { status: 200 });
    } catch (error) {
        console.error('Dismiss activity logs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
