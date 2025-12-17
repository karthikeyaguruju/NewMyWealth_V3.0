'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { User, Bell, Shield, Trash2, Save, AlertTriangle, FolderOpen, Clock } from 'lucide-react';
import { CategoryManager } from '@/components/CategoryManager';
import { BudgetSettings } from '@/components/Settings/BudgetSettings';
import { ActivityLogTab } from '@/components/Settings/ActivityLogTab';
import { cn } from '@/lib/utils';

type Tab = 'profile' | 'budget' | 'categories' | 'activity';

// Wrapper component to handle Suspense for useSearchParams
export default function ProfilePage() {
    return (
        <Suspense fallback={
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </DashboardLayout>
        }>
            <ProfilePageContent />
        </Suspense>
    );
}

function ProfilePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile State
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        enableBudgetAlerts: false,
        monthlyBudget: '',
    });

    // Password State
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Handle tab from URL query parameter
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['profile', 'budget', 'categories', 'activity'].includes(tab)) {
            setActiveTab(tab as Tab);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                setProfile({
                    fullName: data.user.fullName,
                    email: data.user.email,
                    enableBudgetAlerts: data.user.enableBudgetAlerts || false,
                    monthlyBudget: data.user.monthlyBudget?.toString() || '',
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...profile,
                    monthlyBudget: profile.monthlyBudget || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update profile');
            }

            setMessage({ type: 'success', text: 'Settings updated successfully' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/user/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update password');
            }

            setMessage({ type: 'success', text: 'Password updated successfully' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

        try {
            const response = await fetch('/api/user/profile', { method: 'DELETE' });
            if (response.ok) {
                router.push('/login');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Failed to delete account:', error);
        }
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

    const tabs = [
        { id: 'profile', label: 'Profile Settings', icon: User },
        { id: 'budget', label: 'Budget Tracker', icon: Bell },
        { id: 'categories', label: 'Categories', icon: FolderOpen },
        { id: 'activity', label: 'Activity Log', icon: Clock },
    ];

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>

                {/* Tab Navigation */}
                <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as Tab);
                                    router.push(`/profile?tab=${tab.id}`, { scroll: false });
                                }}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                                    activeTab === tab.id
                                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                )}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {message.text && (
                    <div className={`p-4 rounded-lg ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="space-y-6 animate-fade-in">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <User className="text-primary-500" />
                                    <CardTitle>Profile Information</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Full Name"
                                            value={profile.fullName}
                                            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="Email Address"
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-70"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" loading={saving} icon={<Save size={16} />}>
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Shield className="text-green-500" />
                                    <CardTitle>Security</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <Input
                                        label="Current Password"
                                        type="password"
                                        value={passwords.currentPassword}
                                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                        required
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="New Password"
                                            type="password"
                                            value={passwords.newPassword}
                                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="Confirm New Password"
                                            type="password"
                                            value={passwords.confirmPassword}
                                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" loading={saving} icon={<Save size={16} />}>
                                            Update Password
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="border border-red-200 dark:border-red-900/50 rounded-xl overflow-hidden">
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 border-b border-red-200 dark:border-red-900/50 flex items-center gap-2">
                                <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                                <h3 className="font-semibold text-red-900 dark:text-red-200">Danger Zone</h3>
                            </div>
                            <div className="p-6 bg-white dark:bg-gray-900">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">Delete Account</h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Permanently delete your account and all associated data. This action cannot be undone.
                                        </p>
                                    </div>
                                    <Button
                                        variant="danger"
                                        onClick={handleDeleteAccount}
                                        icon={<Trash2 size={16} />}
                                    >
                                        Delete Account
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Budget Tracker Tab */}
                {activeTab === 'budget' && (
                    <div className="animate-fade-in">
                        <BudgetSettings />
                    </div>
                )}

                {/* Categories Tab */}
                {activeTab === 'categories' && (
                    <div className="animate-fade-in">
                        <CategoryManager />
                    </div>
                )}

                {/* Activity Log Tab */}
                {activeTab === 'activity' && (
                    <div className="animate-fade-in">
                        <ActivityLogTab />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
