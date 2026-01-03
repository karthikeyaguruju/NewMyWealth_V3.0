'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { StockForm } from '@/components/Stocks/StockForm';
import { StockTable } from '@/components/Stocks/StockTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, LineChart, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export default function StocksPage() {
    const { showToast } = useToast();
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStock, setEditingStock] = useState<any>(null);

    useEffect(() => {
        fetchStocks();
    }, []);

    const fetchStocks = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/stocks');
            const data = await response.json();
            setStocks(data.stocks || []);
        } catch (error) {
            console.error('Failed to fetch stocks:', error);
            showToast('error', 'Failed to fetch stocks');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this stock?')) return;
        try {
            const response = await fetch(`/api/stocks/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete');
            showToast('success', 'Stock deleted successfully');
            fetchStocks();
        } catch (error) {
            showToast('error', 'Failed to delete stock');
        }
    };

    const handleEdit = (stock: any) => {
        setEditingStock(stock);
        setIsFormOpen(true);
    };

    const handleSuccess = () => {
        fetchStocks();
    };

    const totalPortfolioValue = stocks.reduce((sum: number, stock: any) => sum + (stock.quantity * stock.buyPrice), 0);
    const totalInvestments = stocks.length;

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-7xl mx-auto pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/20">
                            <LineChart size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Stocks Portfolio</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Manage and track your equity investments</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingStock(null);
                            setIsFormOpen(true);
                        }}
                        size="lg"
                        className="rounded-2xl shadow-lg shadow-blue-600/20"
                        icon={<Plus size={20} />}
                    >
                        Add New Stock
                    </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-600/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Total Portfolio Value</p>
                                <h2 className="text-3xl font-black">₹{totalPortfolioValue.toLocaleString()}</h2>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white dark:bg-[#0a0f1d] border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Active Stocks</p>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white">{totalInvestments}</h2>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white dark:bg-[#0a0f1d] border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Investment Type</p>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white">Equity</h2>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Stocks Table */}
                <div className="glass-card overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Current Holdings
                        </h3>
                    </div>
                    <StockTable
                        stocks={stocks}
                        loading={loading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </div>
            </div>

            <StockForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={handleSuccess}
                stock={editingStock}
            />
        </DashboardLayout>
    );
}
