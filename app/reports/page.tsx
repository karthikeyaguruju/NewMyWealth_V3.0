'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    ArrowUpCircle,
    ArrowDownCircle,
    TrendingUp,
    Calendar,
    Mail,
    ChevronLeft,
    ChevronRight,
    PieChart,
    Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReportSummary {
    totalIncome: number;
    totalExpenses: number;
    totalInvestments: number;
    netSavings: number;
    categoryBreakdown: Record<string, number>;
    transactionCount: number;
    topTransactions: any[];
}

export default function ReportsPage() {
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [date, setDate] = useState(new Date(2026, 0, 1)); // Default to January 2026

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const res = await fetch(`/api/reports/summary?month=${month}&year=${year}`);
            const data = await res.json();
            setSummary(data);
        } catch (error) {
            console.error('Failed to fetch summary:', error);
            toast.error('Failed to load summary');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [date]);

    const handleSendEmail = async () => {
        if (!summary) return;
        setSending(true);
        try {
            const res = await fetch('/api/reports/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    summary,
                    monthName: date.toLocaleString('default', { month: 'long' }),
                    year: date.getFullYear()
                })
            });
            if (res.ok) {
                toast.success('Report sent to your email!');
            } else {
                throw new Error('Failed to send');
            }
        } catch (error) {
            toast.error('Failed to send email');
        } finally {
            setSending(false);
        }
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() + offset);
        setDate(newDate);
    };

    return (
        <DashboardLayout>
            <main className="max-w-7xl mx-auto pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <FileText className="text-blue-600" size={32} />
                            Financial Reports
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
                            Detailed analysis of your monthly performance
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 bg-white dark:bg-white/5 p-1.5 rounded-2xl border border-gray-100 dark:border-white/10"
                    >
                        <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} className="rounded-xl">
                            <ChevronLeft size={20} />
                        </Button>
                        <div className="px-4 py-2 text-center min-w-[150px]">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} className="rounded-xl">
                            <ChevronRight size={20} />
                        </Button>
                    </motion.div>
                </div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center h-64"
                        >
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </motion.div>
                    ) : summary && (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <StatCard
                                    label="Total Income"
                                    value={summary.totalIncome}
                                    icon={ArrowUpCircle}
                                    color="text-emerald-500"
                                    bg="bg-emerald-500/10"
                                />
                                <StatCard
                                    label="Total Expenses"
                                    value={summary.totalExpenses}
                                    icon={ArrowDownCircle}
                                    color="text-rose-500"
                                    bg="bg-rose-500/10"
                                />
                                <StatCard
                                    label="Investments"
                                    value={summary.totalInvestments}
                                    icon={TrendingUp}
                                    color="text-blue-500"
                                    bg="bg-blue-500/10"
                                />
                                <StatCard
                                    label="Net Savings"
                                    value={summary.netSavings}
                                    icon={PieChart}
                                    color="text-violet-500"
                                    bg="bg-violet-500/10"
                                />
                            </div>

                            {/* Main Analysis Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Category Breakdown */}
                                <Card className="p-6 overflow-hidden relative group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
                                        Category Breakdown
                                        <PieChart className="text-gray-400" size={20} />
                                    </h3>
                                    <div className="space-y-4 relative">
                                        {Object.entries(summary.categoryBreakdown).length > 0 ? (
                                            Object.entries(summary.categoryBreakdown)
                                                .sort(([, a], [, b]) => b - a)
                                                .map(([name, amount], index) => {
                                                    const percentage = (amount / summary.totalExpenses) * 100;
                                                    return (
                                                        <div key={name} className="space-y-1.5">
                                                            <div className="flex justify-between text-sm font-semibold">
                                                                <span className="text-gray-600 dark:text-gray-400">{name}</span>
                                                                <span className="text-gray-900 dark:text-white">${amount.toLocaleString()}</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${percentage}%` }}
                                                                    transition={{ duration: 1, delay: index * 0.1 }}
                                                                    className="h-full bg-blue-600 rounded-full"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        ) : (
                                            <p className="text-gray-500 text-center py-8">No expense data available for this month</p>
                                        )}
                                    </div>
                                </Card>

                                {/* Actions & Insights */}
                                <div className="space-y-6">
                                    <Card className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-2xl shadow-blue-600/20 overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <TrendingUp size={120} />
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Growth Report</h3>
                                            <p className="opacity-90 font-medium mb-8 max-w-xs text-sm leading-relaxed">
                                                Your financial performance for {date.toLocaleString('default', { month: 'long' })} is processed. Deliver it to your inbox now.
                                            </p>

                                            <div className="flex flex-wrap gap-4">
                                                <Button
                                                    onClick={handleSendEmail}
                                                    disabled={sending}
                                                    className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-6 rounded-2xl font-bold shadow-xl flex items-center gap-3 transition-transform active:scale-95 disabled:opacity-50"
                                                >
                                                    {sending ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700" />
                                                            Delivering...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Mail size={18} />
                                                            Email Report
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Quick Insight */}
                                    <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 p-6 rounded-3xl">
                                        <h4 className="text-[12px] font-black uppercase tracking-widest text-blue-600 mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                            Financial Insight
                                        </h4>
                                        <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                                            {summary.netSavings > 0
                                                ? `Great job! You saved $${summary.netSavings.toLocaleString()} this month. Your wealth is expanding.`
                                                : summary.netSavings < 0
                                                    ? `Attention: Your spending exceeded your income by $${Math.abs(summary.netSavings).toLocaleString()}. Consider reviewing your top categories.`
                                                    : "Your income and expenses are perfectly balanced this month."
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </DashboardLayout>
    );
}

function StatCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <Card className="p-6 hover:shadow-xl transition-all duration-300 border-gray-100 dark:border-white/5 group">
            <div className="flex items-center justify-between mb-3">
                <div className={`${bg} p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-500`}>
                    <Icon className={color} size={22} />
                </div>
            </div>
            <h4 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">{label}</h4>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                ${value.toLocaleString()}
            </p>
        </Card>
    );
}
