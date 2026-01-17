
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (from: Date, to: Date) => void;
  initialFrom?: string;
  initialTo?: string;
}

export const DateRangeModal: React.FC<DateRangeModalProps> = ({ 
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

  useEffect(() => {
    if (isOpen) {
      if (initialFrom) setFromDate(new Date(initialFrom));
      if (initialTo) setToDate(new Date(initialTo));
      else if (initialFrom) setViewDate(new Date(initialFrom));
      else setViewDate(new Date());
    }
  }, [isOpen, initialFrom, initialTo]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => {
    let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    clickedDate.setHours(0,0,0,0);

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

  // Render Logic
  const days = [];
  const totalDays = daysInMonth(viewDate);
  const startOffset = firstDayOfMonth(viewDate);

  for (let i = 0; i < startOffset; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
  }

  for (let i = 1; i <= totalDays; i++) {
    const currentDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
    currentDate.setHours(0,0,0,0);
    
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
        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all relative z-10
          ${isSelected ? 'bg-slate-900 text-white shadow-md shadow-slate-300' : ''}
          ${isRange ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 rounded-none w-full !mx-0' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}
          ${isStart && toDate ? 'rounded-r-none pr-1' : ''}
          ${isEnd && fromDate ? 'rounded-l-none pl-1' : ''}
        `}
      >
        {i}
        {(isStart && toDate) && <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-100 dark:bg-slate-700/50 -z-10" />}
        {(isEnd && fromDate) && <div className="absolute top-0 left-0 w-1/2 h-full bg-slate-100 dark:bg-slate-700/50 -z-10" />}
      </button>
    );
  }

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 w-[320px] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
        {/* Header Dates */}
        <div className="px-5 pt-5 pb-3 flex justify-between items-center bg-white dark:bg-slate-800">
          <div>
             <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Từ ngày</p>
             <p className="text-base font-bold text-slate-800 dark:text-white">{formatDate(fromDate)}</p>
          </div>
          <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-700"></div>
          <div className="text-right">
             <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Đến ngày</p>
             <p className="text-base font-bold text-slate-800 dark:text-white">{formatDate(toDate)}</p>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between mb-3 bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded-xl">
             <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-colors text-slate-600 dark:text-slate-300">
               <ChevronLeft size={16} />
             </button>
             <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-200">
               <CalendarIcon size={14} />
               <span>{viewDate.getMonth() + 1}/{viewDate.getFullYear()}</span>
             </div>
             <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-colors text-slate-600 dark:text-slate-300">
               <ChevronRight size={16} />
             </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 mb-2 text-center">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
              <span key={d} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{d}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1 place-items-center">
            {days}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 pt-2 border-t border-slate-50 dark:border-slate-700">
           {/* Quick Select */}
           <div className="flex justify-between gap-2 mb-3">
              {[7, 15, 30].map(d => (
                <button 
                  key={d}
                  onClick={() => handleQuickSelect(d)}
                  className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-[10px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {d} Ngày
                </button>
              ))}
           </div>

           <button 
             onClick={handleApply}
             disabled={!fromDate}
             className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-md shadow-slate-200 hover:bg-black active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
           >
             Chọn ngày
           </button>
        </div>
    </div>
  );
};
