export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { password } = body;

        if (!password || password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Update the user's password using the current session
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Update password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
