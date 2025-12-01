'use client';

import React, { createContext, useContext, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
    showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const showToast = useCallback((type: ToastType, message: string) => {
        const options = {
            duration: 4000,
            className: '!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-white !shadow-xl !border-l-4',
        };

        switch (type) {
            case 'success':
                toast.success(message, { ...options, className: `${options.className} !border-green-500` });
                break;
            case 'error':
                toast.error(message, { ...options, className: `${options.className} !border-red-500` });
                break;
            case 'info':
                toast(message, { ...options, icon: 'ℹ️', className: `${options.className} !border-blue-500` });
                break;
            default:
                toast(message, options);
        }
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toaster
                position="bottom-center"
                toastOptions={{
                    // Define default options
                    style: {
                        background: '#fff',
                        color: '#333',
                    },
                }}
            />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
