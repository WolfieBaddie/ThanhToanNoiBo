
import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';
import { Transaction } from './types';


interface HistoryTableProps {
  transactions: Transaction[];
  onViewDetail?: (id: number) => void;
  onClearFilters: () => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ transactions, onViewDetail, onClearFilters }) => {
  return (
    <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    <th className="p-4 font-semibold whitespace-nowrap">Giao dịch</th>
                    <th className="p-4 font-semibold whitespace-nowrap">Thời gian</th>
                    <th className="p-4 font-semibold whitespace-nowrap">Mã GD</th>
                    <th className="p-4 font-semibold whitespace-nowrap">Trạng thái</th>
                    <th className="p-4 font-semibold text-right whitespace-nowrap">Số tiền</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                {transactions.length > 0 ? (
                  transactions.map((item) => (
                    <tr 
                        key={item.id} 
                        onClick={() => onViewDetail && onViewDetail(item.id)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer"
                    >
                        <td className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.type === 'in' ? 'bg-primary text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                    {item.type === 'in' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                </div>
                                <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.title}</span>
                            </div>
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{item.displayDate}</td>
                        <td className="p-4 font-mono text-slate-400 text-xs">{item.ref}</td>
                        <td className="p-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {item.status}
                            </span>
                        </td>
                        <td className={`p-4 text-right font-bold whitespace-nowrap ${item.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {item.type === 'in' ? '+' : ''}{item.amount.toLocaleString('vi-VN')}đ
                        </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">
                       <div className="flex flex-col items-center gap-2">
                          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-2">
                              <Search size={32} className="text-slate-300 dark:text-slate-500" />
                          </div>
                          <p className="font-medium text-slate-600 dark:text-slate-400">Không tìm thấy giao dịch nào</p>
                          <p className="text-sm text-slate-400 dark:text-slate-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                          <button onClick={onClearFilters} className="mt-2 text-slate-900 dark:text-white font-bold hover:underline">
                            Xóa toàn bộ lọc
                          </button>
                       </div>
                    </td>
                  </tr>
                )}
            </tbody>
        </table>
    </div>
  );
};
