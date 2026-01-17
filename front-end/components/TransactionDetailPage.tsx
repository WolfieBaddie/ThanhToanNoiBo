
import React from 'react';
import { TransactionHeader } from './transaction/TransactionHeader';
import { TransactionSummary } from './transaction/TransactionSummary';
import { TransactionInfoList } from './transaction/TransactionInfoList';
import { TransactionMetaInfo } from './transaction/TransactionMetaInfo';
import { TransactionActions } from './transaction/TransactionActions';

interface TransactionDetailPageProps {
  onBack: () => void;
  transactionId?: number | null;
}

export const TransactionDetailPage: React.FC<TransactionDetailPageProps> = ({ onBack, transactionId }) => {
  // Mock data fetching based on ID
  const transaction = {
    id: transactionId || 123456,
    amount: -35000,
    type: 'out',
    title: 'Thanh toán Cơm trưa (Combo 1)',
    location: 'Căng tin Khu A - Quầy 2',
    time: '11:30 - 20/05/2024',
    status: 'Thành công',
    ref: 'TRX-882910-2024',
    method: 'Ví Swallet',
    balanceAfter: 1215000
  };

  const isPositive = transaction.amount > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <TransactionHeader onBack={onBack} />

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative">
        
        {/* Decorative Top */}
        <div className={`h-2 w-full ${isPositive ? 'bg-zen-lime' : 'bg-slate-900'}`}></div>

        <TransactionSummary amount={transaction.amount} status={transaction.status} />

        <div className="p-8 space-y-6">
            <TransactionInfoList 
                title={transaction.title}
                location={transaction.location}
                time={transaction.time}
                method={transaction.method}
            />

            <div className="h-px bg-slate-100 dark:bg-slate-700 border-t border-dashed"></div>

            <TransactionMetaInfo 
                refCode={transaction.ref}
                balanceAfter={transaction.balanceAfter}
            />
        </div>

        <TransactionActions />
      </div>

      <div className="mt-8 text-center">
         <button className="text-slate-400 text-sm hover:text-slate-900 dark:hover:text-white hover:underline transition-colors">
            Báo cáo vấn đề về giao dịch này?
         </button>
      </div>
    </div>
  );
};
