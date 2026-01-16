import React from 'react';
import { Wifi, Copy, CreditCard } from 'lucide-react';
import {formatCurrency} from "@/utils/format.ts";
interface WalletCardProps {
  balance: number;
  studentName: string;
  studentId: string;
  className?: string;
}

export const WalletCard: React.FC<WalletCardProps> = ({ balance, studentName, studentId, className = '' }) => {
  return (
    <div className={`relative overflow-hidden rounded-[24px] bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 text-white p-6 sm:p-8 shadow-2xl shadow-indigo-500/30 ${className}`}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full min-h-[180px]">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-indigo-100 text-sm font-medium mb-1">Số dư khả dụng</p>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {formatCurrency(balance)} <span className="text-2xl text-indigo-200"></span>
            </h3>
          </div>
          <div className="w-12 h-8 rounded border border-white/20 relative flex items-center justify-center bg-white/5 backdrop-blur-sm">
             <div className="w-8 h-5 border border-white/40 rounded-sm"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-3 bg-yellow-400/80 rounded-[2px]"></div>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-mono text-lg text-indigo-100 tracking-wider">
                {studentId}
              </p>
              <button className="text-indigo-200 hover:text-white transition-colors">
                <Copy size={14} />
              </button>
            </div>
            <p className="text-sm font-medium uppercase tracking-wide opacity-90">{studentName}</p>
          </div>
          <Wifi className="text-white/50 rotate-90" size={28} />
        </div>
      </div>
    </div>
  );
};