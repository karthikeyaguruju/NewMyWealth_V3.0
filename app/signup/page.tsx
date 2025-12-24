'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, UserPlus, Wallet, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/contexts/ToastContext';
import { SwipeButton } from '@/components/ui/SwipeButton';
import { motion } from 'framer-motion';

export default function SignupPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setErrors({});
        setLoading(true);

        const newErrors: Record<string, string> = {};
        if (!formData.fullName) newErrors.fullName = 'Required';
        if (!formData.email) newErrors.email = 'Required';
        if (formData.password.length < 6) newErrors.password = 'Min 6 chars';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Mismatch";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) {
                const errorMessage = data.error || 'Signup failed';
                setErrors({ general: errorMessage });
                showToast('error', errorMessage);
                setLoading(false);
                return;
            }
            showToast('success', 'Account created! Please log in.');
            router.push('/login');
        } catch (err) {
            const errorMessage = 'An error occurred. Please try again.';
            setErrors({ general: errorMessage });
            showToast('error', errorMessage);
            setLoading(false);
        }
    };

    const isFormValid = formData.fullName && formData.email && formData.password && formData.confirmPassword && (formData.password === formData.confirmPassword) && formData.password.length >= 6;

    return (
        <div className="min-h-screen md:h-screen w-full flex flex-col md:flex-row bg-white dark:bg-slate-950 transition-colors duration-300 md:overflow-hidden font-inter">
            {/* Left Side: How It Works */}
            <div className="hidden md:flex flex-1 bg-slate-950 relative overflow-hidden items-center justify-center border-r border-white/5 p-8 lg:p-12">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-full h-full bg-emerald-500/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-full h-full bg-blue-500/10 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 max-w-md w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Wallet className="text-slate-950" size={24} />
                            </div>
                            <span className="text-xl font-black text-white tracking-widest uppercase italic">MyWealth</span>
                        </div>

                        <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-8">
                            How It <span className="text-emerald-500">Works</span>
                        </h2>

                        <div className="space-y-5">
                            {steps.map((step, index) => (
                                <motion.div
                                    key={step.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="flex gap-4 items-start group"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                                        {step.number}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-bold text-white mb-0.5 group-hover:text-emerald-400 transition-colors">{step.title}</h3>
                                        <p className="text-slate-400 text-xs leading-relaxed">{step.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-10 flex items-center gap-3 text-emerald-400/40 text-[10px] font-bold tracking-widest uppercase">
                            <CheckCircle2 size={14} />
                            <span>Safe & Encrypted</span>
                            <div className="w-1 h-1 rounded-full bg-slate-800" />
                            <span>Financial Freedom</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Signup Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-10 bg-slate-50 dark:bg-slate-950 overflow-y-auto md:overflow-hidden relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-[440px] flex flex-col items-center"
                >
                    <Card className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-xl rounded-[32px] p-6 sm:p-8 flex flex-col">
                        <div className="text-center mb-6">
                            <div className="md:hidden flex items-center justify-center gap-2.5 mb-6 text-emerald-500 font-bold text-xl uppercase tracking-tighter">
                                <Wallet size={24} />
                                <span>MYWEALTH</span>
                            </div>

                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 mb-3 shadow-md shadow-emerald-500/10">
                                <UserPlus className="text-white" size={24} />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-0.5">
                                Join Us
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                                Create your account
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            {errors.general && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
                                >
                                    <div className="w-1 h-1 rounded-full bg-red-500" />
                                    {errors.general}
                                </motion.div>
                            )}

                            <Input
                                type="text"
                                label="Full Name"
                                placeholder="Your name"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                leftIcon={<User size={18} />}
                                error={errors.fullName}
                                required
                            />

                            <Input
                                type="email"
                                label="Email Address"
                                placeholder="name@domain.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                leftIcon={<Mail size={18} />}
                                error={errors.email}
                                required
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input
                                    type="password"
                                    label="Password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    leftIcon={<Lock size={18} />}
                                    error={errors.password}
                                    required
                                />

                                <Input
                                    type="password"
                                    label="Confirm"
                                    placeholder="Confirm"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    leftIcon={<Lock size={18} />}
                                    error={errors.confirmPassword}
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <SwipeButton
                                    text="Swipe to Join"
                                    loadingText="..."
                                    isLoading={loading}
                                    onComplete={() => handleSubmit()}
                                    disabled={!isFormValid}
                                    className="scale-95 origin-center"
                                />
                            </div>
                        </form>

                        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/5 text-center">
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                Already have an account?{' '}
                                <Link
                                    href="/login"
                                    className="text-emerald-600 dark:text-emerald-400 font-black hover:underline underline-offset-4 decoration-2"
                                >
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </Card>

                    <p className="mt-6 text-center text-slate-400 dark:text-slate-600 text-[10px] uppercase tracking-widest font-bold">
                        © {new Date().getFullYear()} MyWealth • Secure System
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

const steps = [
    {
        number: "01",
        title: "Sign In Securely",
        description: "Access your dashboard with bank-grade encryption."
    },
    {
        number: "02",
        title: "Add Transactions",
        description: "Log your income, expenses, and investments."
    },
    {
        number: "03",
        title: "Analyze & Improve",
        description: "Review real-time insights and grow your wealth."
    }
];
