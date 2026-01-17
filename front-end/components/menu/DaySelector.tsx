
import React from 'react';
import { Day } from './types';


interface DaySelectorProps {
  activeDay: string;
  onDayChange: (id: string) => void;
  days: Day[];
}

export const DaySelector: React.FC<DaySelectorProps> = ({ activeDay, onDayChange, days }) => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-bold text-slate-700 dark:text-slate-300 ml-1">Lịch phục vụ tuần này</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {days.map((day) => (
          <button
            key={day.id}
            onClick={() => onDayChange(day.id)}
            className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-2xl transition-all border-2 shrink-0 ${
              activeDay === day.id 
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900' 
                : 'border-transparent bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <span className="text-xs font-medium uppercase tracking-wider opacity-80">{day.label}</span>
            <span className="text-lg font-bold">{day.date}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
