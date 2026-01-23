import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import {formatCurrency} from "@/utils/format.ts";

interface TransactionSummaryProps {
    amount: number;
    direction: string; // 'IN' | 'OUT'
    status: string;
}

export const TransactionSummary: React.FC<TransactionSummaryProps> = ({ amount, direction, status }) => {
    const isPositive = direction === 'IN';

    // Icon & Color dựa trên trạng thái (Logic hiển thị)
    let StatusIcon = CheckCircle2;
    let statusColor = 'text-green-600';
    let bgIcon = 'bg-emerald-100 dark:bg-emerald-900/30';

    if (status === 'Thất bại') {
        StatusIcon = XCircle;
        statusColor = 'text-red-600';
        bgIcon = 'bg-red-100';
    } else if (status === 'Đang xử lý') {
        StatusIcon = Clock;
        statusColor = 'text-orange-600';
        bgIcon = 'bg-orange-100';
    }

    return (
        <div className="p-8 flex flex-col items-center text-center border-b border-slate-100 dark:border-slate-700 border-dashed">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${bgIcon}`}>
                <StatusIcon size={32} strokeWidth={3} className={statusColor} />
            </div>

            <h2 className={`text-4xl font-extrabold tracking-tight mb-2 ${isPositive ? 'text-emerald-600' : 'text-red-500 dark:text-white'}`}>
                {formatCurrency(amount)}
            </h2>

            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status === 'Thành công' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600'}`}>
        {status}
      </span>
        </div>
    );
};