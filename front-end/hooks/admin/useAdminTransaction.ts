import { useState, useEffect, useCallback } from 'react';
import { adminTransactionService } from '@/services/admin/admin.transaction.service';
import { AdminTransactionFilterParams } from '@/types/admin.transaction.type';
// Reuse types
import {
    Transaction,
    TransactionDetail,
    TransactionTypeEnum
} from '@/types/transaction.type';

// Helper format date YYYY-MM-DD
const formatDateIso = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// =========================================================================
// HOOK 1: useAdminTransactions (Quản lý Danh sách & Bộ lọc)
// =========================================================================
export const useAdminTransactions = (initialParams: AdminTransactionFilterParams = { page: 0, size: 10 }) => {
    // Data State
    const [data, setData] = useState<Transaction[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter State
    const [filters, setFilters] = useState<AdminTransactionFilterParams>(initialParams);

    // --- FETCH DATA ---
    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminTransactionService.getAllTransactions(filters);
            if (res && Array.isArray(res.items)) {
                setData(res.items);
                setTotalItems(res.totalItems || 0);
                setTotalPages(res.totalPages || 0);
            } else {
                setData([]);
                setTotalItems(0);
                setTotalPages(0);
            }
        } catch (err: any) {
            console.error("Admin Fetch Error:", err);
            // Lấy message từ error response nếu có (do axios-client ném ra)
            setError(err.response?.data?.message || err.message || "Lỗi tải danh sách giao dịch");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Auto-fetch khi filters thay đổi
    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // --- FILTER ACTIONS (Helpers) ---

    // 1. Chuyển trang
    const setPage = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    // 2. Lọc ngày (Reset về trang 0)
    const setDateFilter = (from: Date | null, to: Date | null) => {
        setFilters(prev => ({
            ...prev,
            fromDate: from ? formatDateIso(from) : undefined,
            toDate: to ? formatDateIso(to) : undefined,
            page: 0
        }));
    };

    // 3. Tìm kiếm theo Mã GD
    const setSearchRef = (keyword: string) => {
        setFilters(prev => ({
            ...prev,
            transactionRef: keyword,
            page: 0
        }));
    };

    // 4. Lọc theo loại (DEPOSIT, PAYMENT...)
    const setTypeFilter = (type: TransactionTypeEnum | undefined | string) => {
        setFilters(prev => ({
            ...prev,
            type: (type === 'ALL' || !type) ? undefined : (type as TransactionTypeEnum),
            page: 0
        }));
    };

    // 5. [Admin Only] Lọc theo danh sách User
    const setUserFilter = (userIds: string[]) => {
        setFilters(prev => ({
            ...prev,
            userIds: userIds.length > 0 ? userIds : undefined,
            page: 0
        }));
    };

    // 6. Reset bộ lọc
    const clearFilters = () => {
        setFilters({ page: 0, size: initialParams.size || 10 });
    };

    return {
        // State
        data,
        loading,
        error,
        totalItems,
        totalPages,
        filters,

        // Actions
        setPage,
        setDateFilter,
        setSearchRef,
        setTypeFilter,
        setUserFilter,
        clearFilters,
        refetch: fetchTransactions,
        setFilters // Expose gốc nếu cần custom
    };
};

// =========================================================================
// HOOK 2: useAdminTransactionDetail (Chi tiết)
// =========================================================================
export const useAdminTransactionDetail = (transactionId: string | null) => {
    const [detail, setDetail] = useState<TransactionDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!transactionId) {
            setDetail(null);
            return;
        }

        const fetch = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await adminTransactionService.getTransactionDetail(transactionId);
                setDetail(res);
            } catch (err: any) {
                console.error("Detail Error:", err);
                setError(err.response?.data?.message || err.message || "Lỗi tải chi tiết");
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, [transactionId]);

    return { detail, loading, error };
};