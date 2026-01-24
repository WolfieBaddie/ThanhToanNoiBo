
import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TransactionHeaderProps {
  onBack: () => void;
}

export const TransactionHeader: React.FC<TransactionHeaderProps> = ({ onBack }) => {
  return (
    <div className="flex items-center gap-4 mb-8">
      <button
        onClick={onBack}
        className="p-3 bg-white dark:bg-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700 shadow-sm"
      >
        <ArrowLeft size={20} className="text-slate-900 dark:text-white" />
      </button>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chi tiết giao dịch</h1>
    </div>
  );
};
