import { SignJWT, jwtVerify } from 'jose';
import { supabase } from './supabase';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');

export async function generateToken(userId: string): Promise<string> {
    return new SignJWT({ userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('10m')
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: string; exp?: number } | null> {
    try {
        // Try Supabase verification first (New system)
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
            return { userId: user.id };
        }

        // Fallback to custom JWT verification (Old system)
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as { userId: string; exp: number };
    } catch (error) {
        return null;
    }
}
