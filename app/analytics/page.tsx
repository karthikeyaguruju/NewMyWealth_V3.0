'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { MetricCard } from '@/components/MetricCard';
import { startOfMonth, endOfMonth, format, subMonths, subYears } from 'date-fns';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts';
import {
    TrendingDown,
    TrendingUp,
} from 'lucide-react';

interface AnalyticsData {
    metrics: {
        totalIncome: number;
        totalExpenses: number;
        netSavings: number;
        totalInvestments: number;
        thisMonthIncome: number;
        thisMonthExpenses: number;
        savingsRate: number;
        incomeGrowth: number;
        expenseGrowth: number;
        investmentGrowth: number;
    };
    monthlyData: any[];
    incomeBreakdown: any[];
    expenseBreakdown: any[];
    investmentAllocation: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

type TimeRange = '1M' | '3M' | '6M' | '1Y';

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState<TimeRange>('6M');
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            // Calculate dates based on time range
            const endDate = new Date();
            let startDate = new Date();
            let historyMonths = 6;

            switch (timeRange) {
                case '1M':
                    startDate = startOfMonth(endDate);
                    historyMonths = 1;
                    break;
                case '3M':
                    startDate = subMonths(endDate, 2); // Current + 2 prev = 3
                    historyMonths = 3;
                    break;
                case '6M':
                    startDate = subMonths(endDate, 5);
                    historyMonths = 6;
                    break;
                case '1Y':
                    startDate = subYears(endDate, 1);
                    historyMonths = 12;
                    break;
            }

            const formattedStartDate = format(startOfMonth(startDate), 'yyyy-MM-dd');
            const formattedEndDate = format(endOfMonth(endDate), 'yyyy-MM-dd');

            const response = await fetch(
                `/api/analytics?startDate=${formattedStartDate}&endDate=${formattedEndDate}&historyMonths=${historyMonths}`
            );
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !analytics) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    const metrics = analytics.metrics;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Detailed insights into your financial patterns</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg inline-flex">
                        {(['1M', '3M', '6M', '1Y'] as TimeRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${timeRange === range
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Finance Overview Chart */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        {timeRange === '1Y' ? '1-Year' : `${timeRange}-Month`} Trend
                    </h3>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    stroke="#6B7280"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#6B7280"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `₹${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                <Line
                                    type="monotone"
                                    dataKey="income"
                                    name="Income"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expense"
                                    name="Expense"
                                    stroke="#EF4444"
                                    strokeWidth={2}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="investment"
                                    name="Investment"
                                    stroke="#8B5CF6"
                                    strokeWidth={2}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Row: Income, Expenses, Investments */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Total Income */}
                    <div className="glass-card p-6 flex flex-col justify-between h-64">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Total Income</span>
                                <div className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${metrics.incomeGrowth >= 0 ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                                    {metrics.incomeGrowth >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                                    {Math.abs(metrics.incomeGrowth).toFixed(1)}%
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">
                                ₹{metrics.totalIncome.toLocaleString()}
                            </h2>
                        </div>
                        <div className="flex-1 flex items-center justify-center relative">
                            {metrics.totalIncome > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analytics.incomeBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={60}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {analytics.incomeBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-gray-400 text-sm">No income data</p>
                            )}
                        </div>
                    </div>

                    {/* Total Expenses */}
                    <div className="glass-card p-6 flex flex-col justify-between h-64">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Total Expenses</span>
                                <div className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${metrics.expenseGrowth <= 0 ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                                    {metrics.expenseGrowth <= 0 ? <TrendingDown size={14} className="mr-1" /> : <TrendingUp size={14} className="mr-1" />}
                                    {Math.abs(metrics.expenseGrowth).toFixed(1)}%
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">
                                ₹{metrics.totalExpenses.toLocaleString()}
                            </h2>
                        </div>
                        <div className="flex-1 flex items-center justify-center relative">
                            {metrics.totalExpenses > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analytics.expenseBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={60}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {analytics.expenseBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-gray-400 text-sm">No expense data</p>
                            )}
                        </div>
                    </div>

                    {/* Total Investments */}
                    <div className="glass-card p-6 flex flex-col justify-between h-64">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Total Investments</span>
                                <div className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${metrics.investmentGrowth >= 0 ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                                    {metrics.investmentGrowth >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                                    {Math.abs(metrics.investmentGrowth).toFixed(1)}%
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                ₹{metrics.totalInvestments.toLocaleString()}
                            </h2>
                        </div>
                        <div className="flex-1 flex items-center justify-center relative">
                            {metrics.totalInvestments > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analytics.investmentAllocation}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={60}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {analytics.investmentAllocation.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-gray-400 text-sm">No investment data</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Second Row: Savings & Savings Rate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                        <span className="text-gray-500 dark:text-gray-400 font-medium block mb-2">Total Savings</span>
                        <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">
                            ₹{metrics.netSavings.toLocaleString()}
                        </h2>
                    </div>
                    <div className="glass-card p-6">
                        <span className="text-gray-500 dark:text-gray-400 font-medium block mb-2">Savings Rate</span>
                        <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {metrics.savingsRate.toFixed(1)}%
                        </h2>
                    </div>
                </div>

                {/* Growth Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Income Growth</span>
                            <div className={`p-2 rounded-full ${metrics.incomeGrowth >= 0 ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'}`}>
                                {metrics.incomeGrowth >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className={`text-2xl font-bold ${metrics.incomeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Math.abs(metrics.incomeGrowth).toFixed(1)}%
                            </h3>
                            <span className="text-sm text-gray-500">vs last month</span>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Expense Growth</span>
                            <div className={`p-2 rounded-full ${metrics.expenseGrowth <= 0 ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'}`}>
                                {metrics.expenseGrowth <= 0 ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className={`text-2xl font-bold ${metrics.expenseGrowth <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Math.abs(metrics.expenseGrowth).toFixed(1)}%
                            </h3>
                            <span className="text-sm text-gray-500">vs last month</span>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Investment Growth</span>
                            <div className={`p-2 rounded-full ${metrics.investmentGrowth >= 0 ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'}`}>
                                {metrics.investmentGrowth >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className={`text-2xl font-bold ${metrics.investmentGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Math.abs(metrics.investmentGrowth).toFixed(1)}%
                            </h3>
                            <span className="text-sm text-gray-500">vs last month</span>
                        </div>
                    </div>
                </div>

                {/* Existing Detailed Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Expense Breakdown */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                            Expense Breakdown
                        </h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.expenseBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {analytics.expenseBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => `₹${value.toLocaleString()}`}
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Investment Allocation */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                            Investment Allocation
                        </h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.investmentAllocation}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {analytics.investmentAllocation.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => `₹${value.toLocaleString()}`}
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
