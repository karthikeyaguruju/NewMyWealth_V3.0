import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, leftIcon, rightIcon, className, type, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-[15px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {label}
                        {props.required && <span className="text-emerald-500 ml-1">*</span>}
                    </label>
                )}
                <div className="relative group">
                    {leftIcon && (
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        type={inputType}
                        className={cn(
                            'w-full px-4 py-3 rounded-xl border transition-all duration-300',
                            'bg-white dark:bg-slate-900/50 text-gray-900 dark:text-white',
                            'border-gray-200 dark:border-white/10',
                            'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
                            'placeholder:text-gray-400 dark:placeholder:text-gray-500 text-base',
                            'disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed',
                            error && 'border-red-500 focus:ring-red-500/20',
                            leftIcon && 'pl-10',
                            (rightIcon || isPassword) && 'pr-10',
                            className
                        )}
                        {...props}
                    />

                    {isPassword ? (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors focus:outline-none"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    ) : (
                        rightIcon && (
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                {rightIcon}
                            </div>
                        )
                    )}
                </div>
                {error && (
                    <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400 animate-fade-in">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
