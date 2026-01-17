
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface TransactionSummaryProps {
  amount: number;
  status: string;
}

export const TransactionSummary: React.FC<TransactionSummaryProps> = ({ amount, status }) => {
  const isPositive = amount > 0;
  return (
    <div className="p-8 flex flex-col items-center text-center border-b border-slate-100 dark:border-slate-700 border-dashed">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isPositive ? 'bg-primary/20 text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'}`}>
        <CheckCircle2 size={32} strokeWidth={3} className={isPositive ? 'text-green-600' : ''} />
      </div>
      <h2 className={`text-4xl font-extrabold tracking-tight mb-2 ${isPositive ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
        {isPositive ? '+' : ''}{amount.toLocaleString('vi-VN')}đ
      </h2>
      <p className="text-slate-500 font-medium">{status}</p>
    </div>
  );
};
