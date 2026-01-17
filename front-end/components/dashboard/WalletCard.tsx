
import React from 'react';
import { ArrowRight, ArrowDownLeft, Utensils } from 'lucide-react';

interface WalletCardProps {
  balance: number;
  studentName: string;
  studentId: string;
  className?: string;
  onAction?: (action: string) => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ balance, studentName, studentId, className = '', onAction }) => {
  return (
    <div className={`relative overflow-hidden rounded-[32px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-8 border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md duration-500 ${className}`}>
      
      <div className="relative z-10 flex flex-col h-full justify-between min-h-[220px]">
        {/* Top Info */}
        <div className="flex justify-between items-start">
            <div className="flex flex-col">
                <span className="font-bold text-slate-500 text-sm mb-1">Tổng số dư khả dụng</span>
                <div className="flex items-baseline gap-1">
                     <h3 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {balance.toLocaleString('vi-VN')}
                    </h3>
                    <span className="text-2xl font-bold text-slate-400">₫</span>
                </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-[3px] border-slate-900 dark:border-white opacity-20"></div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
             <button 
                onClick={() => onAction && onAction('send')}
                className="flex-1 bg-slate-900 text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-colors"
             >
                 Nạp tiền <ArrowDownLeft size={16} />
             </button>

             <button 
                onClick={() => onAction && onAction('receive')}
                className="flex-1 bg-primary text-slate-900 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors"
             >
                 Đặt món <Utensils size={16} />
             </button>
        </div>
      </div>
    </div>
  );
};
