'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, Transition } from '@headlessui/react';

interface DatePickerProps {
    label?: string;
    value: string | Date;
    onChange: (date: string) => void;
    error?: string;
    className?: string;
}

export function DatePicker({ label, value, onChange, error, className }: DatePickerProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date(value || new Date()));
    const dateValue = value ? new Date(value) : null;

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const startDay = getDay(startOfMonth(currentMonth));
    const emptyDays = Array(startDay).fill(null);

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const handleDateClick = (date: Date, close: () => void) => {
        onChange(format(date, 'yyyy-MM-dd'));
        close();
    };

    return (
        <div className={cn("w-full", className)}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                </label>
            )}
            <Popover className="relative">
                {({ open, close }) => (
                    <>
                        <Popover.Button
                            className={cn(
                                'flex items-center w-full px-4 py-2.5 rounded-lg border text-left transition-all duration-200',
                                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                'border-gray-300 dark:border-gray-600',
                                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                                error && 'border-red-500 focus:ring-red-500'
                            )}
                        >
                            <span className="flex-1">
                                {dateValue ? format(dateValue, 'dd-MM-yyyy') : 'Select date'}
                            </span>
                            <CalendarIcon className="h-5 w-5 text-gray-400" />
                        </Popover.Button>

                        <Transition
                            as={React.Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="opacity-0 translate-y-1"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-1"
                        >
                            <Popover.Panel className="absolute z-50 mt-2 left-0 right-0 sm:left-auto sm:right-auto sm:w-[320px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        type="button"
                                        onClick={handlePrevMonth}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    >
                                        <ChevronLeft className="h-5 w-5 text-gray-500" />
                                    </button>
                                    <h2 className="font-semibold text-gray-900 dark:text-white">
                                        {format(currentMonth, 'MMMM yyyy')}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={handleNextMonth}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    >
                                        <ChevronRight className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                        <div key={day} className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {emptyDays.map((_, i) => (
                                        <div key={`empty-${i}`} />
                                    ))}
                                    {daysInMonth.map((date) => {
                                        const isSelected = dateValue && isSameDay(date, dateValue);
                                        const isCurrentMonth = isSameMonth(date, currentMonth);
                                        const isTodayDate = isToday(date);

                                        return (
                                            <button
                                                key={date.toString()}
                                                type="button"
                                                onClick={() => handleDateClick(date, close)}
                                                className={cn(
                                                    'h-9 w-9 rounded-lg text-sm flex items-center justify-center transition-all',
                                                    isSelected
                                                        ? 'bg-primary-600 text-white font-semibold shadow-md'
                                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white',
                                                    isTodayDate && !isSelected && 'text-primary-600 font-bold bg-primary-50 dark:bg-primary-900/20',
                                                    !isCurrentMonth && 'text-gray-300 dark:text-gray-600'
                                                )}
                                            >
                                                {format(date, 'd')}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 flex justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onChange('');
                                            close();
                                        }}
                                        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDateClick(new Date(), close)}
                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        Today
                                    </button>
                                </div>
                            </Popover.Panel>
                        </Transition>
                    </>
                )}
            </Popover>
            {error && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
}
