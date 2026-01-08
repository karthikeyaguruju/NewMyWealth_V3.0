'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Sparkles, Shield, Key } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import { SwipeButton } from '@/components/ui/SwipeButton';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        // We need to verify that the user has a valid recovery session
        const checkSession = async () => {
            const url = new URL(window.location.href);
            const code = url.searchParams.get('code');

            if (code) {
                // Exchange code for session (PKCE)
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) {
                    showToast('error', 'Invalid or expired reset link.');
                    router.push('/forgot-password');
                    return;
                }
                // We'll call our internal callback to set cookies
                await fetch('/api/auth/callback?code=' + code + '&next=/reset-password');
            }

            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                showToast('error', 'Session expired or invalid link. Please request a new reset link.');
                router.push('/forgot-password');
            } else {
                setVerifying(false);
            }
        };

        checkSession();
    }, [router, showToast]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (password.length < 6) {
            showToast('error', 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            showToast('error', 'Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Update password directly via Supabase client as well to be sure
            const { error: supabaseError } = await supabase.auth.updateUser({ password });

            if (supabaseError) {
                showToast('error', supabaseError.message);
                setLoading(false);
                return;
            }

            // Also call our API to ensure cookies etc are cleaned if needed
            // But actually Supabase update is enough. We should probably set the token cookie here too.
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // We'll call a helper to set the cookie
                await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: session.user.email,
                        password: password, // This is just for the API to have something, but we already updated it
                        isReset: true // Custom flag if we want to bypass normal login logic
                    }),
                });
            }

            showToast('success', 'Your access key has been updated!');
            router.push('/login');
        } catch (err) {
            showToast('error', 'An error occurred. Please try again.');
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex bg-white dark:bg-slate-950 transition-colors duration-500 overflow-hidden font-inter relative">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-600/10 dark:bg-primary-500/5 rounded-full blur-[120px] animate-float" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 dark:bg-emerald-500/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 relative z-10 bg-slate-50/30 dark:bg-transparent">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full max-w-[420px]"
                >
                    <div className="mb-8 text-center">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-white dark:bg-slate-900 glass shadow-lg rounded-xl flex items-center justify-center">
                                <Sparkles className="text-primary-600 dark:text-primary-400" size={24} />
                            </div>
                            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">My Wealth</span>
                        </div>
                    </div>

                    <div className="glass-card p-6 sm:p-10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-600/5 rounded-full -ml-12 -mt-12 blur-2xl pointer-events-none" />

                        <div className="relative z-10">
                            <div className="mb-8 text-center">
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                                    New Access
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 font-medium tracking-tight text-sm">
                                    Define your new secure access key.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-3.5">
                                    <Input
                                        type="password"
                                        label="New Password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        leftIcon={<Key size={18} className="text-gray-400" />}
                                        required
                                        className="rounded-[16px] border-gray-100 dark:border-white/5 focus:ring-primary-600"
                                    />

                                    <Input
                                        type="password"
                                        label="Confirm Password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        leftIcon={<Shield size={18} className="text-gray-400" />}
                                        required
                                        className="rounded-[16px] border-gray-100 dark:border-white/5 focus:ring-primary-600"
                                    />
                                </div>

                                <div className="pt-4">
                                    <SwipeButton
                                        text="Swipe to Update"
                                        loadingText="Confirming..."
                                        isLoading={loading}
                                        onComplete={() => handleSubmit()}
                                        disabled={!password || !confirmPassword || loading}
                                        className="h-14 rounded-[18px]"
                                    />
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <Lock size={12} className="text-emerald-500" />
                            <span>Vault Secure</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-gray-200 dark:bg-slate-800" />
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Encrypted Reset
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
