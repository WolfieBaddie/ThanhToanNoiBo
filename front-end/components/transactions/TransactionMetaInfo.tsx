import React from 'react';
import { Copy, FileText } from 'lucide-react';

interface TransactionMetaInfoProps {
    refCode: string;
    description?: string;
}

export const TransactionMetaInfo: React.FC<TransactionMetaInfoProps> = ({ refCode, description }) => {
    return (
        <div className="space-y-4">
            {/* Transaction Ref */}
            <div className="flex justify-between items-center">
        <span className="text-slate-500 text-sm font-medium flex items-center gap-2">
            <FileText size={16} /> Mã tham chiếu
        </span>
                <div className="flex items-center gap-2 group cursor-pointer">
          <span className="text-slate-900 dark:text-white font-mono text-sm font-bold bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            {refCode}
          </span>
                    <Copy size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
            </div>

            {/* Description dài (nếu có và khác với title đã hiện ở trên) */}
            {description && (
                <div className="text-xs text-slate-400 mt-2 italic text-center">
                    "{description}"
                </div>
            )}
        </div>
    );
};