import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

// Helper to get user via Supabase token
async function getUser(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

// GET /api/user/profile - Get user profile
export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: profile?.full_name || user.user_metadata?.full_name || 'User',
                createdAt: user.created_at,
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/user/profile - Update user profile and settings
export async function PUT(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { fullName } = body;

        const { data: updatedProfile, error: profileError } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', user.id)
            .select()
            .single();

        if (profileError) throw profileError;

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: updatedProfile.full_name,
                createdAt: user.created_at,
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/user/profile - Delete user account
export async function DELETE(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const userId = user.id;
        const supabaseService = getServiceSupabase();

        // 1. Manually delete all data to ensure a clean slate for future re-registration
        console.log(`Starting cleanup for user: ${userId}`);

        // Use Promise.all for parallel deletion of data tables
        const tableCleanup = [
            supabaseService.from('transactions').delete().eq('user_id', userId),
            supabaseService.from('stocks').delete().eq('user_id', userId),
            supabaseService.from('budgets').delete().eq('user_id', userId),
            supabaseService.from('categories').delete().eq('user_id', userId),
            supabaseService.from('activity_logs').delete().eq('user_id', userId),
            supabaseService.from('profiles').delete().eq('id', userId),
        ];

        const results = await Promise.all(tableCleanup);

        // Log errors but continue (some tables might be empty or not use this userId format)
        results.forEach((res, index) => {
            if (res.error) {
                console.warn(`Cleanup warning in table index ${index}:`, res.error.message);
            }
        });

        // 2. Delete the user from Supabase Auth
        const { error: authError } = await supabaseService.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Auth deletion error:', authError);
            throw authError;
        }

        const response = NextResponse.json({ message: 'Account deleted successfully' });

        // 3. Clear auth token
        response.cookies.delete('token');

        return response;
    } catch (error: any) {
        console.error('Delete account error:', error);
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
