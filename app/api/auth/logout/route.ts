import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logActivity, ActivityActions } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    // Attempt to get user before clearing cookie
    const token = request.cookies.get('token')?.value;
    let userId = null;

    if (token) {
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
    }

    const response = NextResponse.json(
        { message: 'Logged out successfully' },
        { status: 200 }
    );

    // Clear the auth cookie
    response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });



    return response;
}
