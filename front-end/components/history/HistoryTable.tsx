import React from 'react';
import {formatCurrency} from "@/utils/format.ts";
import { ArrowDownLeft, ArrowUpRight, Search, Ticket, Wallet } from 'lucide-react';

// 1. Cập nhật Interface để nhận diện loại giao dịch
export interface Transaction {
    id: string;
    title: string;
    displayDate: string;
    ref: string;
    status: string;
    amount: number;
    type: 'in' | 'out';
    transactionType?: string; // Thêm trường này để check 'BUY_VOUCHER'
}

interface HistoryTableProps {
    transactions: Transaction[];
    onViewDetail?: (id: string) => void;
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
                {transactions && transactions.length > 0 ? (
                    transactions.map((item) => {
                        const isVoucher = item.transactionType === 'BUY_VOUCHER';

                        return (
                            <tr
                                key={item.id}
                                onClick={() => onViewDetail && onViewDetail(item.id)}
                                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer"
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {/* Icon: IN (Nạp tiền) vs OUT (Mua sắm) */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                                            ${item.type === 'in'
                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400' // Đổi màu nền icon cho loại OUT
                                        }`}>
                                            {item.type === 'in' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-brand-black dark:group-hover:text-white transition-colors">
                                                {item.title}
                                            </span>
                                            {/* Hiển thị thêm label nhỏ nếu là mua voucher */}
                                            {isVoucher && <span className="text-xs text-slate-400">Trừ vào ví xu</span>}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{item.displayDate}</td>
                                <td className="p-4 font-mono text-slate-400 text-xs">{item.ref}</td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                    ${item.status === 'Thành công' || item.status === 'COMPLETED'
                                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : item.status === 'Đang xử lý'
                                            ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                    }`}>
                                    {item.status === 'COMPLETED' ? 'Thành công' : item.status}
                                </span>
                                </td>

                                {/* Cột Số tiền: Xử lý màu sắc và đơn vị */}
                                <td className={`p-4 text-right font-bold whitespace-nowrap 
                                    ${item.type === 'in'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-600 dark:text-red-400' // Màu đỏ cho giao dịch trừ tiền/xu
                                }`}>
                                    {formatCurrency(item.amount, item.transactionType)}
                                </td>
                            </tr>
                        );
                    })
                ) : (
                    <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-2">
                                    <Search size={32} className="text-slate-300 dark:text-slate-500" />
                                </div>
                                <p className="font-medium text-slate-600 dark:text-slate-400">Không tìm thấy giao dịch nào</p>
                                <button onClick={onClearFilters} className="mt-2 text-brand-black dark:text-white font-bold hover:underline">
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