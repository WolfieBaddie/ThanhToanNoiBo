import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface AdminDateRangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (from: Date, to: Date) => void;
    initialFrom?: string;
    initialTo?: string;
}

export const AdminDateRangeModal: React.FC<AdminDateRangeModalProps> = ({
                                                                            isOpen,
                                                                            onClose,
                                                                            onApply,
                                                                            initialFrom,
                                                                            initialTo
                                                                        }) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // --- LOGIC GIỮ NGUYÊN ---
    useEffect(() => {
        if (isOpen) {
            if (initialFrom) setFromDate(new Date(initialFrom));
            if (initialTo) setToDate(new Date(initialTo));
            else if (initialFrom) setViewDate(new Date(initialFrom));
            else setViewDate(new Date());
        }
    }, [isOpen, initialFrom, initialTo]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => {
        let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const handleDateClick = (day: number) => {
        const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        clickedDate.setHours(0, 0, 0, 0);

        if (!fromDate || (fromDate && toDate)) {
            setFromDate(clickedDate);
            setToDate(null);
        } else {
            if (clickedDate < fromDate) {
                setFromDate(clickedDate);
            } else {
                setToDate(clickedDate);
            }
        }
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const handleQuickSelect = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days + 1);
        setFromDate(start);
        setToDate(end);
        setViewDate(start);
    };

    const handleApply = () => {
        if (fromDate && toDate) {
            onApply(fromDate, toDate);
            onClose();
        } else if (fromDate) {
            onApply(fromDate, fromDate);
            onClose();
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '--/--/----';
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    // --- RENDER LOGIC VỚI UI MỚI (DARK THEME) ---
    const days = [];
    const totalDays = daysInMonth(viewDate);
    const startOffset = firstDayOfMonth(viewDate);

    for (let i = 0; i < startOffset; i++) {
        days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    for (let i = 1; i <= totalDays; i++) {
        const currentDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
        currentDate.setHours(0, 0, 0, 0);

        let isSelected = false;
        let isRange = false;
        let isStart = false;
        let isEnd = false;

        if (fromDate && currentDate.getTime() === fromDate.getTime()) {
            isSelected = true;
            isStart = true;
        }
        if (toDate && currentDate.getTime() === toDate.getTime()) {
            isSelected = true;
            isEnd = true;
        }
        if (fromDate && toDate && currentDate > fromDate && currentDate < toDate) {
            isRange = true;
        }

        days.push(
            <button
                key={i}
                onClick={() => handleDateClick(i)}
                className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all relative z-10
          ${isSelected
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' // Selected: Màu tím Admin
                    : ''}
          ${isRange
                    ? 'bg-purple-500/20 text-purple-200 rounded-none w-full !mx-0' // Range: Tím nhạt
                    : 'hover:bg-white/10 text-white/80'}
          ${isStart && toDate ? 'rounded-r-none pr-1' : ''}
          ${isEnd && fromDate ? 'rounded-l-none pl-1' : ''}
        `}
            >
                {i}
                {/* Background connector cho Range */}
                {(isStart && toDate) && <div className="absolute top-0 right-0 w-1/2 h-full bg-purple-500/20 -z-10" />}
                {(isEnd && fromDate) && <div className="absolute top-0 left-0 w-1/2 h-full bg-purple-500/20 -z-10" />}
            </button>
        );
    }

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            // Style: Nền đen xám (#1a1a1a), viền trắng mờ
            className="absolute top-full right-0 mt-2 z-50 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl w-[320px] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
            {/* Header Dates */}
            <div className="px-5 pt-5 pb-3 flex justify-between items-center border-b border-white/5">
                <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1">From</p>
                    <p className="text-base font-bold text-white">{formatDate(fromDate)}</p>
                </div>
                <div className="h-8 w-[1px] bg-white/10"></div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1">To</p>
                    <p className="text-base font-bold text-white">{formatDate(toDate)}</p>
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3 bg-white/5 p-1.5 rounded-xl border border-white/5">
                    <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2 font-bold text-sm text-white">
                        <CalendarIcon size={14} className="text-purple-400" />
                        <span>{viewDate.getMonth() + 1}/{viewDate.getFullYear()}</span>
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 mb-2 text-center">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                        <span key={d} className="text-[10px] font-bold text-white/30 uppercase">{d}</span>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-y-1 place-items-center">
                    {days}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 pt-3 border-t border-white/10 bg-white/5">
                {/* Quick Select */}
                <div className="flex justify-between gap-2 mb-3">
                    {[7, 15, 30].map(d => (
                        <button
                            key={d}
                            onClick={() => handleQuickSelect(d)}
                            className="flex-1 py-1.5 rounded-lg border border-white/10 text-white/60 text-[10px] font-bold hover:bg-white/10 hover:text-white transition-colors"
                        >
                            {d} Days
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleApply}
                    disabled={!fromDate}
                    // Button: Gradient Purple-Blue giống Admin
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-purple-500/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    Apply Filter
                </button>
            </div>
        </div>
    );
};