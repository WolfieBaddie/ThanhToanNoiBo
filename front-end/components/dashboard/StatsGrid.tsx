
import React from 'react';
import { WalletCard } from './WalletCard';
import { Target } from 'lucide-react';

interface StatsGridProps {
    onNavigate: (tab: string) => void;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ onNavigate }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Balance Card - Takes 2 cols on XL */}
        <div className="xl:col-span-2">
            <div className="relative group h-full">
                <WalletCard 
                    balance={1250000} 
                    studentName="NGUYEN VAN B" 
                    studentId="HS2024-0058"
                    onAction={(action) => {
                        if(action === 'send') onNavigate('wallet');
                        if(action === 'receive') onNavigate('menu');
                        if(action === 'history') onNavigate('history');
                    }}
                    className="h-full"
                />
            </div>
        </div>

        {/* Right Side Stats - Only Limit Card remains */}
        <div className="xl:col-span-1">
             <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 border border-slate-100 dark:border-slate-700 shadow-sm h-full flex flex-col justify-center relative overflow-hidden group hover:border-primary transition-colors">
                  <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                          <h4 className="font-bold text-slate-500 text-sm uppercase tracking-wider">Hạn mức ngày</h4>
                          <span className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white p-2 rounded-xl"><Target size={20} /></span>
                      </div>
                      
                      <div className="flex items-end gap-2 mb-4">
                          <span className="text-4xl font-extrabold text-slate-900 dark:text-white">15.000</span>
                          <span className="text-lg font-bold text-slate-400 mb-1">/ 50.000đ</span>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 mb-3 overflow-hidden">
                          <div className="bg-primary h-full rounded-full w-[30%]"></div>
                      </div>
                      <p className="text-xs text-slate-500 font-bold">Bạn đã dùng 30% hạn mức hôm nay.</p>
                  </div>
             </div>
        </div>
    </div>
  );
};
