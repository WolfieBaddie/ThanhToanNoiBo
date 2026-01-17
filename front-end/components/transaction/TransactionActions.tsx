
import React from 'react';
import { Share2, Download } from 'lucide-react';
import { Button } from '../ui/Button';

export const TransactionActions: React.FC = () => {
  return (
    <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 grid grid-cols-2 gap-4">
      <Button variant="outline" className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
        <Share2 size={18} /> Chia sẻ
      </Button>
      <Button variant="outline" className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
        <Download size={18} /> Hóa đơn
      </Button>
    </div>
  );
};
