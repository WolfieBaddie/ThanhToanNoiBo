import React from 'react';
import { ChevronRight, TrendingUp, Utensils } from 'lucide-react';

export interface Transaction {
    id: number;
    title: string;
    time: string;
    date: string;
    amount: number;
    type: 'in' | 'out';
    status: string;
}

interface TransactionsProps {
    transactions: Transaction[];
    onViewAll: () => void;
}

export const RecentTransactionsTable: React.FC<TransactionsProps> = ({ transactions, onViewAll }) => {
    return (
        <div className="bg-dark-surface rounded-2xl border border-dark-border overflow-hidden">
            <div className="p-6 border-b border-dark-border flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Giao dịch gần đây</h3>
                <button
                    onClick={onViewAll}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
                >
                    Xem tất cả <ChevronRight size={14} />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-dark-bg/50 text-slate-500 text-xs uppercase font-semibold">
                    <tr>
                        <th className="px-6 py-4 text-left">Giao dịch</th>
                        <th className="px-6 py-4 text-left">Thời gian</th>
                        <th className="px-6 py-4 text-left">Trạng thái</th>
                        <th className="px-6 py-4 text-right">Số tiền</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                    {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-dark-hover transition-colors cursor-pointer group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        tx.type === 'in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                                    }`}>
                                        {tx.type === 'in' ? <TrendingUp size={14} /> : <Utensils size={14} />}
                                    </div>
                                    <span className="text-sm font-medium text-slate-200 group-hover:text-white">{tx.title}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">
                                {tx.date} • {tx.time}
                            </td>
                            <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md border ${
                      tx.status === 'Success'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {tx.status}
                  </span>
                            </td>
                            <td className={`px-6 py-4 text-right font-bold text-sm ${
                                tx.type === 'in' ? 'text-emerald-400' : 'text-slate-200'
                            }`}>
                                {tx.type === 'in' ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}đ
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};