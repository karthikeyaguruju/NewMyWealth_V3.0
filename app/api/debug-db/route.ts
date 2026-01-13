import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const results: any = {
        timestamp: new Date().toISOString(),
        env: {
            hasDatabaseUrl: !!process.env.DATABASE_URL,
            hasNextPublicSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasNextPublicSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            nodeEnv: process.env.NODE_ENV,
        },
        prisma: { status: 'testing...' },
        supabase: { status: 'testing...' }
    };

    // 1. Test Prisma
    try {
        const userCount = await prisma.user.count();
        results.prisma = { status: 'healthy', userCount };
    } catch (error: any) {
        results.prisma = {
            status: 'error',
            message: error.message,
            code: error.code,
            meta: error.meta
        };
    }

    // 2. Test Supabase
    try {
        const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        if (error) throw error;
        results.supabase = { status: 'healthy', profileCount: count };
    } catch (error: any) {
        results.supabase = {
            status: 'error',
            message: error.message
        };
    }

    // 3. Check for specific common issues
    const diagnostics = [];
    if (results.prisma.status === 'error') {
        if (results.prisma.message?.includes('P1001')) {
            diagnostics.push("Prisma cannot reach the database. Check if your DATABASE_URL is correct and the database is active.");
        }
        if (results.prisma.message?.includes('P2021')) {
            diagnostics.push("Table does not exist. Did you run 'npx prisma db push' on your production database?");
        }
    }

    return NextResponse.json({ ...results, diagnostics });
}
