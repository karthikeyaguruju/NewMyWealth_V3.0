'use client';

import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    error?: string;
    disabled?: boolean;
}

export function Select({
    label,
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    error,
    disabled = false,
}: SelectProps) {
    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                </label>
            )}
            <Listbox value={value} onChange={onChange} disabled={disabled}>
                <div className="relative">
                    <Listbox.Button
                        className={cn(
                            'relative w-full px-4 py-2.5 rounded-lg border text-left transition-all duration-200',
                            'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                            'border-gray-300 dark:border-gray-600',
                            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                            'disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed',
                            error && 'border-red-500 focus:ring-red-500'
                        )}
                    >
                        <span className={cn(!selectedOption && 'text-gray-400 dark:text-gray-500')}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        </span>
                    </Listbox.Button>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200 dark:border-gray-700">
                            {options.map((option) => (
                                <Listbox.Option
                                    key={option.value}
                                    value={option.value}
                                    className={({ active }) =>
                                        cn(
                                            'relative cursor-pointer select-none py-2 pl-10 pr-4',
                                            active ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-gray-100'
                                        )
                                    }
                                >
                                    {({ selected }) => (
                                        <>
                                            <span className={cn('block truncate', selected ? 'font-medium' : 'font-normal')}>
                                                {option.label}
                                            </span>
                                            {selected && (
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                                                    <Check className="h-4 w-4" aria-hidden="true" />
                                                </span>
                                            )}
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
            {error && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
}
