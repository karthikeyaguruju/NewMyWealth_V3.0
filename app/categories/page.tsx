'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { CategoryForm } from '@/components/CategoryForm';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, Trash2 } from 'lucide-react';

interface Category {
    id: string;
    categoryGroup: string;
    name: string;
    isDefault: boolean;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<'Income' | 'Expense' | 'Investment'>('Income');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, isDefault: boolean) => {
        if (isDefault) {
            alert('Cannot delete default categories');
            return;
        }

        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Failed to delete category');
                return;
            }

            fetchCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
        }
    };

    const handleAddClick = (group: 'Income' | 'Expense' | 'Investment') => {
        setSelectedGroup(group);
        setIsFormOpen(true);
    };

    const groupedCategories = {
        Income: categories.filter((c) => c.categoryGroup === 'Income'),
        Expense: categories.filter((c) => c.categoryGroup === 'Expense'),
        Investment: categories.filter((c) => c.categoryGroup === 'Investment'),
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Manage Categories
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {Object.entries(groupedCategories).map(([group, cats]) => (
                        <Card key={group}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>{group} Categories</CardTitle>
                                    <Button
                                        size="sm"
                                        icon={<Plus size={16} />}
                                        onClick={() => handleAddClick(group as 'Income' | 'Expense' | 'Investment')}
                                    >
                                        Add
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {cats.map((category) => (
                                        <div
                                            key={category.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-900 dark:text-white font-medium">
                                                    {category.name}
                                                </span>
                                                {category.isDefault && (
                                                    <Badge variant="default">Default</Badge>
                                                )}
                                            </div>
                                            {!category.isDefault && (
                                                <button
                                                    onClick={() => handleDelete(category.id, category.isDefault)}
                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                >
                                                    <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {cats.length === 0 && (
                                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                                            No categories yet
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <CategoryForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={() => {
                        fetchCategories();
                        setIsFormOpen(false);
                    }}
                    categoryGroup={selectedGroup}
                />
            </div>
        </DashboardLayout>
    );
}
