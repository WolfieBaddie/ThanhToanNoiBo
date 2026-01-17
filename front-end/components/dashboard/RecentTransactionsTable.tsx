
import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Utensils } from 'lucide-react';

interface RecentTransactionsTableProps {
  onNavigate: (t: string) => void;
  onViewDetail?: (id: number) => void;
}

export const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({ onNavigate, onViewDetail }) => {
  const recentTransactions = [
    { id: 1, title: 'Nạp tiền Momo', time: '10:30 AM', date: 'Hôm nay', amount: 500000, type: 'in', status: 'Completed' },
    { id: 2, title: 'Cơm trưa (Combo 1)', time: '11:45 AM', date: 'Hôm qua', amount: -35000, type: 'out', status: 'Completed' },
    { id: 3, title: 'Sữa tươi Vinamilk', time: '09:15 AM', date: 'Hôm qua', amount: -12000, type: 'out', status: 'Pending' },
    { id: 4, title: 'Bánh mì sandwich', time: '04:00 PM', date: '20/05', amount: -15000, type: 'out', status: 'Completed' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 sm:p-8 border border-slate-100 dark:border-slate-700 shadow-sm h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Giao dịch gần đây</h3>
            <button 
                onClick={() => onNavigate('history')} 
                className="text-xs font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1"
            >
                Xem tất cả
            </button>
        </div>
        
        <div className="flex-1 overflow-x-auto">
             <table className="w-full text-left border-collapse">
                 <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                     {recentTransactions.map((tx) => (
                         <tr 
                            key={tx.id} 
                            onClick={() => onViewDetail && onViewDetail(tx.id)}
                            className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                        >
                             <td className="py-4 pr-4">
                                 <div className="flex items-center gap-4">
                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${tx.type === 'in' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                                         {tx.type === 'in' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                     </div>
                                     <div>
                                         <p className="font-bold text-sm text-slate-900 dark:text-white">{tx.title}</p>
                                         <p className="text-xs font-medium text-slate-400">{tx.status}</p>
                                     </div>
                                 </div>
                             </td>
                             <td className="py-4 px-4 text-xs font-bold text-slate-400 text-right whitespace-nowrap">
                                 {tx.date}
                             </td>
                             <td className="py-4 pl-4 text-right">
                                 <span className={`text-sm font-bold ${tx.type === 'in' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                     {tx.type === 'in' ? '+' : ''}{tx.amount.toLocaleString()}đ
                                 </span>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
        </div>
    </div>
  );
};
