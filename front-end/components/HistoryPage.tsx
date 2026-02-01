import React, { useState } from 'react';
import { Filter, ChevronRight, Search, Calendar, RefreshCw, ChevronLeft } from 'lucide-react';

// COMPONENTS
import { HistoryHeader } from './history/HistoryHeader';
import { HistoryTable } from './history/HistoryTable';
import { TransactionDetailModal } from '@/components/merchant/TransactionDetailModal';
import { DateRangeModal } from "@/components/ui/DateRangeModal";

// HOOKS & TYPES
import { useTransactions } from '@/hooks/useTransaction';

export interface UiTransaction {
    id: string;
    title: string;
    subTitle?: string;
    displayDate: string;
    date: string;
    ref: string;
    status: string;
    amount: number;
    type: 'in' | 'out';
    image?: string;
    displayAmount: string;
    isRedemption: boolean;
}

const HistoryPage: React.FC = () => {
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const {
        data,
        loading,
        totalItems,
        totalPages,
        filters,
        setFilters,
        setPage,
        setDateFilter,
        refetch
    } = useTransactions({ page: 0, size: 10 });
    const handleClearFilters = () => { setFilters({ page: 0, size: 10 }); };
    const handleViewDetail = (id: string) => { setSelectedTxId(id); };

    const handleDateApply = (from: Date, to: Date) => {
        setDateFilter(from, to);
        setIsDateModalOpen(false);
    };

    // --- LOGIC PHÂN TRANG THÔNG MINH ---
    const renderPagination = () => {
        const currentPage = (filters.page || 0) + 1;
        const range: (number | string)[] = [];

        // Thuật toán hiển thị: Luôn hiện trang đầu, trang cuối, và các trang quanh current
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) range.push(i);
        } else {
            range.push(1);
            if (currentPage > 3) range.push('...');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (i > 1 && i < totalPages) range.push(i);
            }

            if (currentPage < totalPages - 2) range.push('...');
            if (totalPages > 1) range.push(totalPages);
        }

        return range.map((page, index) => (
            <button
                key={index}
                onClick={() => typeof page === 'number' && setPage(page - 1)}
                disabled={page === '...'}
                className={`min-w-[36px] h-9 px-3 rounded-xl text-sm font-bold transition-all
                    ${page === currentPage
                    ? 'bg-slate-900 text-white shadow-md dark:bg-indigo-600'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700'}
                    ${page === '...' ? 'cursor-default hover:bg-transparent' : ''}
                `}
            >
                {page}
            </button>
        ));
    };

    console.log(data);

    const uiTransactions: UiTransaction[] = data.map((t: any) => {
        let displayTitle = "Giao dịch hệ thống";
        let displayImage = undefined;
        let subTitle = t.description;

        if (t.transactionType === 'BUY_VOUCHER') {
            displayTitle = t.description;
            subTitle = 'Mua Gói dịch vụ/Voucher';
        }
        else if (t.partnerInfo) {
            displayTitle = t.partnerInfo.partnerName;
            displayImage = t.partnerInfo.partnerImage;
        } else {
            switch (t.transactionType) {
                case 'DEPOSIT': displayTitle = 'Nạp tiền vào ví'; break;
                case 'WITHDRAW': displayTitle = 'Rút tiền về ngân hàng'; break;
                case 'REFUND': displayTitle = 'Hoàn tiền'; break;
                case 'TRANSFER': displayTitle = 'Chuyển tiền'; break;
                case 'REDEMPTION': displayTitle = 'Sử dụng Voucher'; break;
                default: displayTitle = 'Giao dịch khác';
            }
        }

        const isRedemption = t.transactionType === 'REDEMPTION';
        const isPositive = t.direction === 'IN';
        let displayAmountStr = "";

        if (isRedemption) {
            if (!t.partnerInfo) subTitle = 'Đổi Voucher/Quà tặng';
            const quantity = t.quantity || 1;
            displayAmountStr = `${quantity} Vé`;
        } else {
            const xuValue = Math.abs(t.amount);
            displayAmountStr = new Intl.NumberFormat('vi-VN').format(xuValue) + "đ";
        }

        const prefix = isPositive ? '+' : '-';
        const finalDisplayAmount = `${prefix}${displayAmountStr}`;

        return {
            id: t.transactionId,
            title: displayTitle,
            subTitle: subTitle,
            displayDate: new Date(t.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }),
            date: t.createdAt,
            ref: t.transactionRef,
            status: t.status,
            amount: t.amount,
            type: isPositive ? 'in' : 'out',
            image: displayImage,
            displayAmount: finalDisplayAmount,
            isRedemption: isRedemption
        };
    });

    const hasFilter = !!(filters.fromDate);

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 pb-24 font-sans space-y-6">
            <HistoryHeader />

            <TransactionDetailModal
                isOpen={!!selectedTxId}
                onClose={() => setSelectedTxId(null)}
                transactionId={selectedTxId}
                isUserView={true}
            />

            {/* --- TOOLBAR --- */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex-1 w-full flex items-center gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setIsDateModalOpen(!isDateModalOpen)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all font-bold text-sm whitespace-nowrap
                            ${filters.fromDate
                                ? 'bg-slate-900 border-slate-900 text-white dark:bg-indigo-600 dark:border-indigo-600'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                            }`}
                        >
                            <Calendar size={18} />
                            <span>{filters.fromDate ? `${filters.fromDate} - ${filters.toDate || '...'}` : 'Thời gian'}</span>
                        </button>

                        <DateRangeModal
                            isOpen={isDateModalOpen}
                            onClose={() => setIsDateModalOpen(false)}
                            onApply={handleDateApply}
                            initialFrom={filters.fromDate}
                            initialTo={filters.toDate}
                        />
                    </div>

                    {hasFilter && (
                        <button onClick={handleClearFilters} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-100 dark:bg-red-900/20 dark:border-red-900/30" title="Xóa bộ lọc">
                            <Filter size={18} />
                        </button>
                    )}
                </div>

                <button onClick={() => refetch()} className="p-2 border rounded-xl hover:bg-slate-50 transition-colors dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700">
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* --- TABLE AREA --- */}
            <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[400px] relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center backdrop-blur-sm dark:bg-slate-900/60">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                )}

                {uiTransactions.length > 0 ? (
                    <div className="flex flex-col h-full">
                        <HistoryTable
                            transactions={uiTransactions}
                            onViewDetail={handleViewDetail}
                            onClearFilters={handleClearFilters}
                        />

                        {/* --- PAGINATION (NÂNG CẤP) --- */}
                        {totalPages > 0 && (
                            <div className="flex justify-center py-6 border-t border-slate-100 dark:border-slate-700 mt-auto">
                                <div className="bg-white dark:bg-slate-700 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-sm flex items-center gap-1">
                                    <button
                                        onClick={() => setPage(Math.max(0, (filters.page || 0) - 1))}
                                        disabled={filters.page === 0}
                                        className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-500 dark:text-slate-300"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>

                                    {/* Render danh sách số trang */}
                                    <div className="flex items-center gap-1 px-2 hidden sm:flex">
                                        {renderPagination()}
                                    </div>

                                    {/* Mobile: Chỉ hiện text đơn giản */}
                                    <span className="sm:hidden text-sm font-bold text-slate-600 dark:text-slate-300 px-4">
                                        Trang {(filters.page || 0) + 1} / {totalPages}
                                    </span>

                                    <button
                                        onClick={() => setPage(Math.min(totalPages - 1, (filters.page || 0) + 1))}
                                        disabled={(filters.page || 0) >= totalPages - 1}
                                        className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-500 dark:text-slate-300"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    !loading && (
                        <div className="text-center py-20 text-slate-500 dark:text-slate-400">
                            Không tìm thấy giao dịch nào.
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default HistoryPage;