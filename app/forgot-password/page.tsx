'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Sparkles, Shield, ArrowLeft, Send } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import { SwipeButton } from '@/components/ui/SwipeButton';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPasswordPage() {
    const { showToast } = useToast();
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!email) {
            showToast('error', 'Please enter your email');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                showToast('error', data.error || 'Request failed');
                setLoading(false);
                return;
            }

            setIsSubmitted(true);
            showToast('success', 'Reset link sent to your email!');
        } catch (err) {
            showToast('error', 'An error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full flex bg-white dark:bg-slate-950 transition-colors duration-500 overflow-hidden font-inter relative">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-600/10 dark:bg-primary-500/5 rounded-full blur-[120px] animate-float" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 dark:bg-purple-500/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />
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
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-600/5 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />

                        <div className="relative z-10">
                            <AnimatePresence mode="wait">
                                {!isSubmitted ? (
                                    <motion.div
                                        key="forgot-form"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="mb-8 text-center">
                                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                                                Reset Key
                                            </h1>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium tracking-tight text-sm">
                                                Enter your email to receive a magic recovery link.
                                            </p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <Input
                                                type="email"
                                                label="Recovery Email"
                                                placeholder="name@gmail.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                leftIcon={<Mail size={18} className="text-gray-400" />}
                                                required
                                                className="rounded-[16px] border-gray-100 dark:border-white/5 focus:ring-primary-600"
                                            />

                                            <SwipeButton
                                                text="Swipe to Send Link"
                                                loadingText="Transmitting..."
                                                isLoading={loading}
                                                onComplete={() => handleSubmit()}
                                                disabled={!email || loading}
                                                className="h-14 rounded-[18px]"
                                            />
                                        </form>

                                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 text-center">
                                            <Link
                                                href="/login"
                                                className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-black hover:underline underline-offset-4 decoration-2 text-sm"
                                            >
                                                <ArrowLeft size={16} />
                                                Return to Login
                                            </Link>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="success-message"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, type: "spring" }}
                                        className="text-center py-8"
                                    >
                                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Send className="text-emerald-600 dark:text-emerald-400" size={40} />
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Transmission Sent</h2>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-[280px] mx-auto leading-relaxed">
                                            A magic link is en route to <span className="text-primary-600 dark:text-primary-400 font-bold">{email}</span>. Use it to recover your access.
                                        </p>
                                        <Link
                                            href="/login"
                                            className="inline-flex items-center justify-center gap-2 px-8 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-600/20 active:scale-95"
                                        >
                                            Return to Login
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <Shield size={12} className="text-emerald-500" />
                            <span>Encrypted Link</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-gray-200 dark:bg-slate-800" />
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Protocol v4.1
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
