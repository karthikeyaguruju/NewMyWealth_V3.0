import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Lazy-initialized Supabase clients to avoid build-time errors
 * when environment variables are not available.
 */
let supabaseClient: SupabaseClient | null = null;
let serviceSupabaseClient: SupabaseClient | null = null;

/**
 * Get the standard Supabase client (respects RLS).
 * Lazily initialized to work with Vercel builds.
 */
export const getSupabase = (): SupabaseClient => {
    if (supabaseClient) return supabaseClient;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL or Anon Key is missing');
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseClient;
};

/**
 * Get the service role Supabase client (bypasses RLS).
 * Only use on the server side.
 */
export const getServiceSupabase = (): SupabaseClient => {
    if (serviceSupabaseClient) return serviceSupabaseClient;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
    }

    serviceSupabaseClient = createClient(supabaseUrl, serviceRoleKey);
    return serviceSupabaseClient;
};

// For backwards compatibility - lazy getter
export const supabase = {
    get auth() {
        return getSupabase().auth;
    },
    from(table: string) {
        return getSupabase().from(table);
    }
} as SupabaseClient;


