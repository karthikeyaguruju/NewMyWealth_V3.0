'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
    Download,
    Cpu,
    Zap,
    Trophy,
    Volume2,
    VolumeX,
    Sparkles,
    Target,
    Eye,
    Info,
    CreditCard,
    ArrowRightLeft,
    Banknote,
    Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
    id: string;
    amount: number;
    date: string;
    notes: string;
    type: string;
    status: 'Credit' | 'Debit';
    category: string;
    categoryGroup: string;
    subCategory: string | null;
}

interface ReportSummary {
    totalIncome: number;
    totalExpenses: number;
    totalInvestments: number;
    netSavings: number;
    categoryBreakdown: Record<string, number>;
    transactionCount: number;
    allTransactions: Transaction[];
    efficiencyScore: number;
    projections: {
        oneYear: number;
        fiveYears: number;
    };
    aiInsights: string[];
}

export default function ReportsPage() {
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [date, setDate] = useState(new Date(2026, 0, 1)); // Default to January 2026
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

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
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [date]);

    const handleSpeak = () => {
        if (!summary || !summary.aiInsights) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const textToSpeak = `Financial Report for ${date.toLocaleString('default', { month: 'long', year: 'numeric' })}. 
        Your efficiency score is ${summary.efficiencyScore} percent. 
        Insights: ${summary.aiInsights.join('. ')}`;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.9;
        utterance.onend = () => setIsSpeaking(false);
        speechRef.current = utterance;
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    const handleOpenDetails = (tx: Transaction) => {
        setSelectedTx(tx);
        setIsModalOpen(true);
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() + offset);
        setDate(newDate);
    };

    const handleDownloadPDF = () => {
        if (!summary) return;

        const doc = new jsPDF();
        const monthYear = format(date, 'MMMM yyyy');

        // Header
        doc.setFontSize(22);
        doc.setTextColor(37, 99, 235); // primary-600
        doc.text('Intelligence Report', 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Period: ${monthYear}`, 14, 30);
        doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 35);

        // Stats Summary
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text('Key Metrics', 14, 50);

        const stats = [
            ['Total Income', `INR ${summary.totalIncome.toLocaleString()}`],
            ['Total Expenses', `INR ${summary.totalExpenses.toLocaleString()}`],
            ['Investments', `INR ${summary.totalInvestments.toLocaleString()}`],
            ['Net Savings', `INR ${(summary.totalIncome - summary.totalExpenses).toLocaleString()}`],
            ['Efficiency Score', `${summary.efficiencyScore}%`]
        ];

        autoTable(doc, {
            startY: 55,
            head: [['Metric', 'Value']],
            body: stats,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
            styles: { fontSize: 10 },
        });

        // Transactions Table
        const currentY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(16);
        doc.text('Transaction Ledger', 14, currentY);

        const tableData = summary.allTransactions.map(tx => [
            format(new Date(tx.date), 'dd MMM yyyy'),
            tx.notes,
            tx.category,
            tx.status,
            `INR ${tx.amount.toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Date', 'Description', 'Category', 'Status', 'Amount']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [31, 41, 55], fontStyle: 'bold' },
            styles: { fontSize: 9 },
            columnStyles: {
                4: { halign: 'right' }
            }
        });

        doc.save(`MyWealth_Report_${monthYear.replace(' ', '_')}.pdf`);
        toast.success('Intelligence Report Downloaded!');
    };

    const handleSendEmail = async () => {
        if (!summary) return;
        setSending(true);
        const loadingToast = toast.loading('Dispatching your intelligence report...');
        try {
            const res = await fetch('/api/reports/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    summary,
                    monthName: format(date, 'MMMM'),
                    year: date.getFullYear()
                })
            });

            if (res.ok) {
                toast.success('Report dispatched to your email!', { id: loadingToast });
            } else {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to send email');
            }
        } catch (error: any) {
            console.error('Send email error:', error);
            toast.error(`Dispatch failed: ${error.message}`, { id: loadingToast });
        } finally {
            setSending(false);
        }
    };

    return (
        <DashboardLayout>
            <main className="max-w-7xl mx-auto pb-20 px-4">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-600 rounded-2xl shadow-lg shadow-primary-600/20">
                                <FileText className="text-white" size={28} />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                Intelligence <span className="text-gradient"> Reports</span>
                            </h1>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium mt-2">
                            Synthesized financial data, category descriptors, and full transaction history.
                        </p>
                    </motion.div>

                    <div className="flex flex-wrap items-center gap-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 bg-white dark:bg-white/5 p-1.5 rounded-[20px] border border-gray-100 dark:border-white/10 shadow-sm"
                        >
                            <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)} className="rounded-xl h-10 w-10 p-0">
                                <ChevronLeft size={20} />
                            </Button>
                            <div className="px-6 py-2 text-center min-w-[160px]">
                                <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
                                    {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => changeMonth(1)} className="rounded-xl h-10 w-10 p-0">
                                <ChevronRight size={20} />
                            </Button>
                        </motion.div>

                        <Button
                            onClick={handleSpeak}
                            className={`h-12 px-6 rounded-2xl font-black transition-all flex items-center gap-2 shadow-lg ${isSpeaking
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-violet-600 text-white hover:bg-violet-700 active:scale-95'
                                }`}
                        >
                            {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            {isSpeaking ? 'Mute AI' : 'Play Insights'}
                        </Button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                            <div className="relative h-16 w-16">
                                <div className="absolute inset-0 border-4 border-primary-100 dark:border-primary-900/20 rounded-full" />
                                <div className="absolute inset-0 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                            <p className="font-bold text-gray-400 tracking-widest uppercase text-xs">Generating Comprehensive Report...</p>
                        </div>
                    ) : summary && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-12"
                        >
                            {/* Category Descriptors Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <DescriptorCard
                                    title="Income Allocation"
                                    description="Primary revenue streams including Salary, Freelance, and Passive returns."
                                    icon={ArrowUpCircle}
                                    color="text-emerald-500"
                                />
                                <DescriptorCard
                                    title="Expense Overhead"
                                    description="Discretionary and fixed spending across Groceries, Utilities, and Lifestyle."
                                    icon={ArrowDownCircle}
                                    color="text-rose-500"
                                />
                                <DescriptorCard
                                    title="Investment Strategy"
                                    description="Wealth-building capital in Stocks, Mutual Funds, and Fixed Deposits."
                                    icon={TrendingUp}
                                    color="text-blue-500"
                                />
                            </div>

                            {/* Core Stats Section */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard label="Total Income" value={summary.totalIncome} icon={ArrowUpCircle} color="text-emerald-500" bg="bg-emerald-500/10" />
                                <StatCard label="Total Expenses" value={summary.totalExpenses} icon={ArrowDownCircle} color="text-rose-500" bg="bg-rose-500/10" />
                                <StatCard label="Investments" value={summary.totalInvestments} icon={Banknote} color="text-blue-500" bg="bg-blue-500/10" />
                                <StatCard label="Efficiency Score" value={summary.efficiencyScore} icon={Trophy} color="text-violet-500" bg="bg-violet-500/10" isPercent />
                            </div>

                            {/* AI Insights & Future Projections Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* AI Narrator Box - Fixed Light/Dark Mode Visibility */}
                                <Card className="p-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-0 shadow-2xl relative overflow-hidden group">
                                    <h3 className="text-xl font-black mb-6 uppercase tracking-wider flex items-center gap-3">
                                        <Sparkles className="text-primary-600 dark:text-primary-400" size={24} />
                                        AI Narrative Analysis
                                    </h3>
                                    <div className="space-y-4 relative z-10">
                                        {summary.aiInsights.map((insight, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.2 }}
                                                className="flex gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                            >
                                                <div className="mt-1 w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-500 flex-shrink-0 shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                                                <p className="text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-300">{insight}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </Card>

                                {/* Future Projections - Fixed Potential Visibility Issues */}
                                <Card className="p-8 border-0 shadow-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white relative overflow-hidden flex flex-col justify-center group">
                                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary-600/5 dark:bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

                                    <div className="relative z-10 space-y-8">
                                        <h3 className="text-xl font-black mb-2 uppercase tracking-wider flex items-center gap-3">
                                            <Target className="text-primary-600 dark:text-primary-400" size={24} />
                                            Future Valuation
                                        </h3>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">12-Month Projection</p>
                                                <p className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white">₹{summary.projections.oneYear.toLocaleString()}</p>
                                                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                    <Zap size={14} />
                                                    Growth Estimate
                                                </div>
                                            </div>

                                            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">60-Month Projection</p>
                                                <p className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white">₹{summary.projections.fiveYears.toLocaleString()}</p>
                                                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                    <TrendingUp size={14} />
                                                    Terminal Wealth
                                                </div>
                                            </div>
                                        </div>
                                    </div>


                                </Card>
                            </div>

                            {/* Transaction Intelligence Table */}
                            <Card className="border-0 shadow-2xl overflow-hidden bg-white dark:bg-gray-900">
                                <div className="p-8 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Transaction Ledger</h3>
                                        <p className="text-xs text-gray-500 mt-1 font-medium italic">Complete audit trail for the selected period.</p>
                                    </div>
                                    <div className="px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 flex items-center gap-2">
                                        <Activity size={16} className="text-primary-600" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                            {summary.transactionCount} Operations
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Date</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Description</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Category</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Amount</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                            {summary.allTransactions.length > 0 ? (
                                                summary.allTransactions.map((tx) => (
                                                    <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                                                        <td className="px-8 py-5 text-xs font-bold text-gray-500">
                                                            {format(new Date(tx.date), 'dd MMM yyyy')}
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className="text-sm font-black text-gray-900 dark:text-white truncate max-w-[200px]">
                                                                {tx.notes}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                                                {tx.category}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block ${tx.status === 'Credit'
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                                }`}>
                                                                {tx.status}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-right font-black text-gray-900 dark:text-white">
                                                            ₹{tx.amount.toLocaleString()}
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <button
                                                                onClick={() => handleOpenDetails(tx)}
                                                                className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/10 text-primary-600 hover:bg-primary-600 hover:text-white transition-all shadow-sm border border-primary-100 dark:border-primary-900/30 active:scale-95"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-20 text-center font-black uppercase text-[10px] tracking-[0.3em] text-gray-400">
                                                        Zero transactions recorded for this period
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-8 border-t border-gray-100 dark:border-white/10 flex flex-wrap gap-4 items-center justify-end bg-gray-50/50 dark:bg-white/5">
                                    <Button
                                        onClick={handleDownloadPDF}
                                        variant="outline"
                                        className="h-12 px-6 rounded-2xl font-black transition-all flex items-center gap-2 border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white active:scale-95"
                                    >
                                        <Download size={18} />
                                        Download at the PDF
                                    </Button>
                                    <Button
                                        onClick={handleSendEmail}
                                        disabled={sending}
                                        className="h-12 px-6 rounded-2xl font-black transition-all flex items-center gap-2 bg-primary-600 text-white hover:bg-primary-700 active:scale-95 shadow-lg shadow-primary-600/20 disabled:opacity-50"
                                    >
                                        {sending ? (
                                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Mail size={18} />
                                        )}
                                        Data will send into mail
                                    </Button>
                                </div>
                            </Card>

                            {/* Detailed Pop-up Modal */}
                            <Modal
                                isOpen={isModalOpen}
                                onClose={() => setIsModalOpen(false)}
                                title="Transaction Deep-Dive"
                            >
                                {selectedTx && (
                                    <div className="space-y-6 animate-fade-in py-2">
                                        <div className="flex items-center justify-between p-6 rounded-[28px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-inner">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-4 rounded-2xl ${selectedTx.status === 'Credit' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                                                    <Banknote className={selectedTx.status === 'Credit' ? 'text-emerald-600' : 'text-rose-600'} />
                                                </div>
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Asset Amount</h4>
                                                    <p className="text-2xl font-black text-gray-900 dark:text-white">₹{selectedTx.amount.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedTx.status === 'Credit'
                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                    : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                                    }`}>
                                                    {selectedTx.status}ed
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <DetailItem label="Execution Date" value={format(new Date(selectedTx.date), 'PPPP')} icon={Calendar} />
                                            <DetailItem label="Category Group" value={selectedTx.categoryGroup} icon={Info} />
                                            <DetailItem label="Specific Type" value={selectedTx.category} icon={Target} />
                                            <DetailItem label="Operation ID" value={`#${selectedTx.id.slice(-8).toUpperCase()}`} icon={Zap} />
                                        </div>

                                        <div className="p-6 rounded-[24px] bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/20">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-2 flex items-center gap-2">
                                                <Sparkles size={12} /> Notes & Metadata
                                            </h4>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 italic leading-relaxed">
                                                "{selectedTx.notes}"
                                            </p>
                                        </div>

                                        <div className="pt-2">
                                            <Button
                                                onClick={() => setIsModalOpen(false)}
                                                className="w-full h-14 rounded-2xl bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-black uppercase tracking-widest text-xs"
                                            >
                                                Close Intelligence Dossier
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Modal>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </DashboardLayout>
    );
}

function StatCard({ label, value, icon: Icon, color, bg, isPercent }: any) {
    return (
        <Card className="p-8 hover:shadow-2xl transition-all duration-500 border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900 group relative overflow-hidden">
            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className={`${bg} p-3 rounded-2xl transition-transform group-hover:scale-110 duration-500 w-fit`}>
                    <Icon className={color} size={24} />
                </div>
                <div>
                    <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</h4>
                    <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                        {isPercent ? `${value}%` : `₹${value.toLocaleString()}`}
                    </p>
                </div>
            </div>
        </Card>
    );
}

function DescriptorCard({ title, description, icon: Icon, color }: any) {
    return (
        <Card className="p-6 border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900 shadow-md flex items-start gap-4 hover:shadow-lg transition-all duration-500 animate-fade-in group">
            <div className={`p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 ${color} shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
            </div>
            <div>
                <h4 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white mb-1.5">{title}</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{description}</p>
            </div>
        </Card>
    );
}

function DetailItem({ label, value, icon: Icon }: any) {
    return (
        <div className="p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-2 mb-1.5">
                <Icon size={14} className="text-gray-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</span>
            </div>
            <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">{value}</p>
        </div>
    );
}
