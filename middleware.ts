import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Public routes
    const isPublicRoute = pathname === '/login' || pathname === '/signup';

    // API routes don't need middleware redirect (they handle auth themselves)
    if (pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // If user is not authenticated and trying to access protected route
    if (!token && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If user is authenticated and trying to access login/signup
    if (token && isPublicRoute) {
        const decoded = verifyToken(token);
        if (decoded) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
