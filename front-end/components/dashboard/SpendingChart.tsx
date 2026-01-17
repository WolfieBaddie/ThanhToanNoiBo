
import React, { useState } from 'react';

export const SpendingChart: React.FC = () => {
  const [period, setPeriod] = useState('Week');
  
  // Simulated data heights for the chart
  const data = [40, 65, 30, 80, 55, 90, 45, 70, 50, 60, 35, 75, 50, 85, 60, 45, 70, 55, 80, 65];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 sm:p-8 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-full min-h-[300px]">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Biểu đồ chi tiêu</h3>
            <div className="bg-slate-50 dark:bg-slate-700 p-1 rounded-xl flex text-xs font-bold">
                <button 
                    onClick={() => setPeriod('Week')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${period === 'Week' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Tuần
                </button>
                <button 
                    onClick={() => setPeriod('Month')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${period === 'Month' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Tháng
                </button>
            </div>
        </div>

        <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2 pt-4 px-2">
            {data.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-full bg-slate-50 dark:bg-slate-700/50 rounded-t-sm sm:rounded-t-md relative h-[180px] flex items-end overflow-hidden group-hover:bg-slate-100 transition-colors">
                        <div 
                            style={{height: `${h}%`}} 
                            className={`w-full transition-all duration-1000 ease-out relative ${i === 15 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-600'}`}
                        >
                            {/* Hover Tooltip */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                                {h * 10}.000đ
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-4 px-1 uppercase tracking-wider">
            <span>01 Feb</span>
            <span>08 Feb</span>
            <span>15 Feb</span>
            <span>22 Feb</span>
        </div>
    </div>
  );
};
