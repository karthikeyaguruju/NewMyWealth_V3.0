'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface CategoryFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    categoryGroup: 'Income' | 'Expense' | 'Investment';
}

export function CategoryForm({ isOpen, onClose, onSuccess, categoryGroup }: CategoryFormProps) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryGroup, name }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Failed to create category');
                setLoading(false);
                return;
            }

            onSuccess();
            onClose();
            setName('');
        } catch (err) {
            setError('An error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Add ${categoryGroup} Category`} size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <Input
                    label="Category Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`Enter ${categoryGroup.toLowerCase()} category name`}
                    required
                />

                <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button type="submit" loading={loading} className="flex-1">
                        Add Category
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
