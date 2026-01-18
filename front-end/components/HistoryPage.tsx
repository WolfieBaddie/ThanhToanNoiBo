import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HistoryHeader } from './history/HistoryHeader';
import { HistoryToolbar } from './history/HistoryToolbar';
import { HistoryTable } from './history/HistoryTable';
import { HistoryPagination } from './history/HistoryPagination';
import { useTransactions } from '@/hooks/useTransaction';
import { Transaction as ApiTransaction } from '@/types/transaction.type';

// Interface cho UI khớp với HistoryTable
interface UiTransaction {
    id: string;
    title: string;
    displayDate: string;
    date: string;
    ref: string;
    status: string;
    amount: number;
    type: 'in' | 'out';
}

// Helper: Dịch trạng thái sang tiếng Việt
const getStatusLabel = (status: string): string => {
    switch (status) {
        case 'COMPLETED': return 'Thành công';
        case 'PENDING': return 'Đang xử lý';
        case 'FAILED': return 'Thất bại';
        case 'CANCELLED': return 'Đã hủy';
        default: return status;
    }
};

const HistoryPage: React.FC = () => {
    const navigate = useNavigate();

    // 1. State UI
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<{ from: string, to: string }>({ from: '', to: '' });
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);

    // 2. Fetch Data Hook
    const {
        data: apiTransactions,
        loading,
        totalItems,
        totalPages,
        filters,
        setFilters,
        setPage
    } = useTransactions({ page: 0, size: 7 });

    // 3. Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prev => ({
                ...prev,
                page: 0,
                transactionRef: searchTerm || undefined // Map search term vào transactionRef
            }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, setFilters]);

    // 4. Handle Date Filter
    const handleDateRangeApply = (from: Date, to: Date) => {
        // Format yyyy-MM-dd cho API filter
        const fromStr = from.toISOString().split('T')[0];
        const toStr = to.toISOString().split('T')[0];

        setDateRange({ from: from.toISOString(), to: to.toISOString() });
        setFilters(prev => ({
            ...prev,
            page: 0,
            fromDate: fromStr,
            toDate: toStr
        }));
        setIsDateModalOpen(false);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setDateRange({ from: '', to: '' });
        setFilters({ page: 0, size: 7, fromDate: undefined, toDate: undefined, transactionRef: undefined });
    };

    // 5. MAPPING DATA (CẬP NHẬT)
    const uiTransactions: UiTransaction[] = apiTransactions.map((tx: ApiTransaction) => {
        const dateObj = new Date(tx.createdAt);

        // Xử lý Title: Ưu tiên Title từ API > Description > Fallback
        const displayTitle = tx.title
            ? tx.title
            : (tx.description || 'Giao dịch hệ thống');

        return {
            id: tx.transactionId,
            title: displayTitle,
            // Format: "10:30 - 20/05/2026"
            displayDate: `${dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${dateObj.toLocaleDateString('vi-VN')}`,
            date: tx.createdAt, // Giữ nguyên ISO string để sort nếu cần
            ref: tx.transactionRef,
            status: getStatusLabel(tx.status), // Dịch status
            amount: tx.amount, // Số tiền (API trả về dương, UI tự thêm dấu +/- dựa vào type)
            type: tx.direction === 'IN' ? 'in' : 'out' // Map direction
        };
    });

    // 6. Navigate Detail
    const handleViewDetail = (id: string | number) => {
        navigate(`/transactions/${id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <HistoryHeader />
                <HistoryToolbar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    dateRange={dateRange}
                    onClearDate={() => {
                        setDateRange({ from: '', to: '' });
                        setFilters(prev => ({ ...prev, fromDate: undefined, toDate: undefined }));
                    }}
                    isDateModalOpen={isDateModalOpen}
                    onToggleDateModal={() => setIsDateModalOpen(!isDateModalOpen)}
                    onDateRangeApply={handleDateRangeApply}
                />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[400px] transition-colors relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 z-10 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                )}

                <HistoryTable
                    transactions={uiTransactions as any}
                    onViewDetail={handleViewDetail}
                    onClearFilters={handleClearFilters}
                />

                {uiTransactions.length > 0 && (
                    <HistoryPagination
                        currentPage={filters.page ? filters.page + 1 : 1}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={filters.size || 7}
                        onPageChange={(page) => setPage(page - 1)}
                    />
                )}
            </div>
        </div>
    );
};

export default HistoryPage;