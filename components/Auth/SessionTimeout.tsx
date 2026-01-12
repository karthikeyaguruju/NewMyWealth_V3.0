'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';

const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Monitors user inactivity and automatically logs out after 10 minutes.
 * Activity includes mouse movement, clicks, key presses, scrolls, and touch events.
 */
export function SessionTimeout() {
    const router = useRouter();
    const { showToast } = useToast();
    const lastActivityRef = useRef<number>(Date.now());

    const handleLogout = useCallback(async () => {
        try {
            // Call the logout API to clear cookies
            await fetch('/api/auth/logout', { method: 'POST' });

            // Notify user and redirect
            showToast('info', 'Session expired due to inactivity. Please log in again.');
            router.push('/login');
        } catch (error) {
            console.error('Auto-logout failed:', error);
            // Forced redirect even if API call fails
            router.push('/login');
        }
    }, [router, showToast]);

    useEffect(() => {
        const resetTimer = () => {
            lastActivityRef.current = Date.now();
        };

        // Events to monitor for user activity
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'mousedown',
            'click'
        ];

        // Add event listeners to detect activity
        events.forEach(event => {
            window.addEventListener(event, resetTimer, { passive: true });
        });

        // Check for inactivity every 30 seconds
        const interval = setInterval(() => {
            const now = Date.now();
            if (now - lastActivityRef.current > TIMEOUT_DURATION) {
                handleLogout();
            }
        }, 30000);

        // Cleanup on unmount
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
            clearInterval(interval);
        };
    }, [handleLogout]);

    return null; // Silent component
}
