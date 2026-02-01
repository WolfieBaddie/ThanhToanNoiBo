import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransaction';
import { formatCurrency } from '@/utils/format';
import { useNavigate } from 'react-router-dom'; // [MỚI] Import để điều hướng

interface RecentTransactionsTableProps {
    onNavigate?: (t: string) => void; // Có thể giữ hoặc bỏ, giờ mình dùng navigate trực tiếp
    onViewDetail?: (id: string) => void;
}

export const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({ onNavigate, onViewDetail }) => {
    const navigate = useNavigate(); // [MỚI] Khởi tạo hook điều hướng

    // Gọi Hook lấy 5 giao dịch mới nhất
    const { data, loading } = useTransactions({ page: 0, size: 5 });

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 sm:p-8 border border-slate-100 dark:border-slate-700 shadow-sm h-full flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Giao dịch gần đây</h3>
                <button
                    onClick={() => navigate('/history')} // [SỬA] Điều hướng trực tiếp sang /history
                    className="text-xs font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1 transition-colors"
                >
                    Xem tất cả
                </button>
            </div>

            <div className="flex-1 overflow-x-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="animate-spin text-indigo-600" size={24} />
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
                        <p>Chưa có giao dịch nào</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                        {data.map((tx) => {
                            const isPositive = tx.direction === 'IN';
                            const displayDate = new Date(tx.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                            const displayTime = new Date(tx.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                            // Logic hiển thị tiêu đề phụ
                            const subTitle = tx.partnerInfo ? tx.partnerInfo.partnerName : (tx.description || tx.transactionType);

                            return (
                                <tr
                                    key={tx.transactionId}
                                    onClick={() => onViewDetail && onViewDetail(tx.transactionId)}
                                    className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                                >
                                    <td className="py-4 pr-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${isPositive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                {isPositive ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[180px]">
                                                    {tx.title || "Giao dịch"}
                                                </p>
                                                <p className="text-xs font-medium text-slate-400 truncate max-w-[120px]">
                                                    {subTitle}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right whitespace-nowrap">
                                        <p className="text-xs font-bold text-slate-500">{displayDate}</p>
                                        <p className="text-[10px] text-slate-400">{displayTime}</p>
                                    </td>
                                    <td className="py-4 pl-4 text-right">
                                         <span className={`text-sm font-bold ${isPositive ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                             {isPositive ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                                         </span>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};