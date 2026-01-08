import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/dashboard';

    if (code) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && session) {
            const response = NextResponse.redirect(new URL(next, request.url));

            // Set the token cookie for our middleware/API
            response.cookies.set('token', session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: session.expires_in,
                path: '/',
            });

            return response;
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', request.url));
}
