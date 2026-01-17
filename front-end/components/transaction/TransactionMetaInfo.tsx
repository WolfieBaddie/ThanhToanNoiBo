
import React from 'react';
import { Copy } from 'lucide-react';

interface TransactionMetaInfoProps {
  refCode: string;
  balanceAfter: number;
}

export const TransactionMetaInfo: React.FC<TransactionMetaInfoProps> = ({ refCode, balanceAfter }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-slate-500 text-sm font-medium">Mã giao dịch</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-900 dark:text-white font-mono text-sm font-bold bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded">{refCode}</span>
          <Copy size={14} className="text-slate-400 cursor-pointer hover:text-slate-900" />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-slate-500 text-sm font-medium">Số dư sau GD</span>
        <span className="text-slate-900 dark:text-white font-bold">{balanceAfter.toLocaleString()}đ</span>
      </div>
    </div>
  );
};
