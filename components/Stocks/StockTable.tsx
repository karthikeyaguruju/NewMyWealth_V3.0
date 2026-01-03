'use client';

import React from 'react';
import { Pencil, Trash2, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';

interface Stock {
    id: string;
    symbol: string;
    name: string;
    quantity: number;
    buyPrice: number;
    sellPrice?: number | null;
    type: string;
    totalValue?: number | null;
}

interface StockTableProps {
    stocks: Stock[];
    onEdit: (stock: Stock) => void;
    onDelete: (id: string) => void;
    loading?: boolean;
}

export function StockTable({ stocks, onEdit, onDelete, loading }: StockTableProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (stocks.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="bg-gray-50 dark:bg-gray-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Layers className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No stocks added yet</h3>
                <p className="text-gray-500 dark:text-gray-400">
                    Add your stock investments to start tracking your portfolio.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 font-bold">
                        <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider w-16">#</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Stock</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Qty</th>
                        <th className="text-center py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Type</th>
                        <th className="text-right py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Buy Price</th>
                        <th className="text-right py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Sell Price</th>
                        <th className="text-right py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Total Value</th>
                        <th className="text-right py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {stocks.map((stock, idx) => {
                        const totalValue = stock.quantity * stock.buyPrice;
                        return (
                            <tr
                                key={stock.id}
                                className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    {(idx + 1).toString().padStart(2, '0')}
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 dark:text-white uppercase">{stock.symbol}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{stock.name}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-900 dark:text-white font-semibold">
                                    {stock.quantity}
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <Badge variant={stock.type === 'BUY' ? 'income' : 'expense'}>
                                        {stock.type}
                                    </Badge>
                                </td>
                                <td className="py-4 px-6 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                    {formatCurrency(stock.buyPrice)}
                                </td>
                                <td className="py-4 px-6 text-right text-sm font-semibold text-gray-500 dark:text-gray-400">
                                    {stock.sellPrice ? formatCurrency(stock.sellPrice) : '-'}
                                </td>
                                <td className="py-4 px-6 text-right text-sm font-black text-blue-600 dark:text-blue-400">
                                    {formatCurrency(totalValue)}
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(stock)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-primary-600 opacity-0 group-hover:opacity-100"
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(stock.id)}
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
