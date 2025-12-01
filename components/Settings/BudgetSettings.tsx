'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';

interface Category {
    id: string;
    name: string;
    categoryGroup: string;
}

interface Budget {
    id: string;
    category: string;
    amount: number;
    spent: number;
    month: string;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function BudgetSettings() {
    const { showToast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [selectedCategory, setSelectedCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCategories();
        fetchBudgets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMonth, selectedYear]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories?categoryGroup=Expense');
            const data = await res.json();
            if (data.categories && Array.isArray(data.categories)) {
                setCategories(data.categories);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error('Failed to fetch categories', error);
            setCategories([]);
        }
    };

    const fetchBudgets = async () => {
        try {
            setLoading(true);
            const monthStr = `${selectedYear}-${String(parseInt(selectedMonth) + 1).padStart(2, '0')}`;
            const res = await fetch(`/api/budgets?month=${monthStr}`);

            if (!res.ok) throw new Error('Failed to fetch budgets');

            const data = await res.json();
            if (Array.isArray(data)) {
                setBudgets(data);
            } else {
                setBudgets([]);
            }
        } catch (error) {
            console.error('Failed to fetch budgets', error);
            showToast('error', 'Failed to fetch budgets');
            setBudgets([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory || !amount) return;

        setSaving(true);
        try {
            const monthStr = `${selectedYear}-${String(parseInt(selectedMonth) + 1).padStart(2, '0')}`;

            const res = await fetch('/api/budgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: selectedCategory,
                    amount: parseFloat(amount),
                    month: monthStr
                }),
            });

            if (res.ok) {
                showToast('success', editingId ? 'Budget updated successfully' : 'Budget created successfully');
                fetchBudgets();
                setAmount('');
                setSelectedCategory('');
                setEditingId(null);
            } else {
                showToast('error', 'Failed to save budget');
            }
        } catch (error) {
            console.error('Failed to save budget', error);
            showToast('error', 'Failed to save budget');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this budget?')) return;
        try {
            const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('success', 'Budget deleted successfully');
                fetchBudgets();
            } else {
                showToast('error', 'Failed to delete budget');
            }
        } catch (error) {
            console.error('Failed to delete budget', error);
            showToast('error', 'Failed to delete budget');
        }
    };

    const handleEdit = (budget: Budget) => {
        setSelectedCategory(budget.category);
        setAmount(budget.amount.toString());
        setEditingId(budget.id);
        // Scroll to top of the component
        const element = document.getElementById('budget-form');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    const getProgressColor = (spent: number, total: number) => {
        const percentage = (spent / total) * 100;
        if (percentage >= 100) return 'bg-red-500';
        if (percentage >= 80) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const categoryOptions = categories.map(cat => ({
        value: cat.name,
        label: cat.name
    }));

    const monthOptions = MONTHS.map((m, i) => ({
        value: i.toString(),
        label: m
    }));

    return (
        <div className="space-y-8">
            {/* Set Budget Form */}
            <div id="budget-form" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {editingId ? 'Edit Budget Limit' : 'Set Budget Limit'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Create monthly budget limits for expense categories
                </p>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                        label="Category"
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        options={categoryOptions}
                        placeholder="Select category"
                        disabled={!!editingId}
                    />

                    <Input
                        label="Budget Limit"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        min="0"
                        step="0.01"
                    />

                    <Select
                        label="Month"
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                        options={monthOptions}
                    />

                    <Input
                        label="Year"
                        type="number"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        min="2020"
                        max="2030"
                    />

                    <div className="md:col-span-2 flex items-center gap-4 pt-2">
                        <Button
                            type="submit"
                            loading={saving}
                            icon={editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                        >
                            {editingId ? 'Update Budget' : 'Create Budget'}
                        </Button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId(null);
                                    setAmount('');
                                    setSelectedCategory('');
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Your Budgets List */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Budgets</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Track your spending against budget limits for {MONTHS[parseInt(selectedMonth)]} {selectedYear}
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : budgets.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
                        No budgets set for this month.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {budgets.map((budget) => {
                            const percentage = Math.min((budget.spent / budget.amount) * 100, 100);
                            const isExceeded = budget.spent > budget.amount;

                            return (
                                <div key={budget.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-md">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                                {budget.category}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {MONTHS[parseInt(selectedMonth)]} {selectedYear}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(budget)}
                                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(budget.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className={isExceeded ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}>
                                                Spent: {formatCurrency(budget.spent)}
                                            </span>
                                            <span className="text-gray-500">
                                                Limit: {formatCurrency(budget.amount)}
                                            </span>
                                        </div>

                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(budget.spent, budget.amount)}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>

                                        <div className="flex justify-between items-center text-xs">
                                            <span className={`${isExceeded ? 'text-red-600 font-medium' : 'text-gray-500'} flex items-center gap-1`}>
                                                {isExceeded && <AlertTriangle size={12} />}
                                                {isExceeded
                                                    ? `Exceeded by ${formatCurrency(budget.spent - budget.amount)}`
                                                    : `${formatCurrency(budget.amount - budget.spent)} remaining`
                                                }
                                            </span>
                                            <span className="text-gray-500">{percentage.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
