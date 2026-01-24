// src/hooks/useTransaction.ts

import { useState, useEffect, useCallback } from 'react';
import { walletService } from '@/services/transaction.service';
import {
    Transaction,
    TransactionDetail,
    TransactionFilterParams,
    UserTransactionDetail
} from '@/types/transaction.type';

// Format ngày chuẩn ISO YYYY-MM-DD cho bộ lọc
const formatDateIso = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Hook quản lý danh sách giao dịch (Lịch sử)
 */
export const useTransactions = (initialParams: TransactionFilterParams = { page: 0, size: 10 }) => {
    const [data, setData] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [filters, setFilters] = useState<TransactionFilterParams>(initialParams);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await walletService.getMyTransactions(filters);
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
            console.error("Fetch Transactions Error:", err);
            setError(err.response?.data?.message || "Không thể tải danh sách giao dịch.");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // --- Actions ---
    const setPage = (page: number) => setFilters(prev => ({ ...prev, page }));

    const setDateFilter = (from: Date, to: Date) => {
        setFilters(prev => ({
            ...prev,
            fromDate: formatDateIso(from),
            toDate: formatDateIso(to),
            page: 0
        }));
    };

    const setTypeFilter = (type: any) => { // type: TransactionTypeEnum
        setFilters(prev => ({ ...prev, type: type, page: 0 }));
    };

    const setSearchRef = (keyword: string) => {
        setFilters(prev => ({ ...prev, transactionRef: keyword, page: 0 }));
    };

    const clearFilters = () => {
        setFilters({ page: 0, size: initialParams.size || 10 });
    };

    return {
        data, loading, error, totalItems, totalPages, filters,
        setPage, setDateFilter, setTypeFilter, setSearchRef, clearFilters,
        refetch: fetchTransactions
    };
};

/**
 * Hook xem chi tiết giao dịch (Dành cho Merchant/Admin)
 * Đảm bảo lấy được itemName, itemImage, items[]
 */
export const useTransactionDetail = (transactionId: string | null) => {
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
            try {
                const res = await walletService.getTransactionDetail(transactionId);
                // Dữ liệu res trả về đã bao gồm items, itemName, itemImage từ API
                setDetail(res);
            } catch (err: any) {
                console.error("Detail Error:", err);
                setError(err.response?.data?.message || "Lỗi tải chi tiết");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [transactionId]);

    return { detail, loading, error };
};

/**
 * Hook xem chi tiết giao dịch (Dành cho User App)
 * Đảm bảo lấy được itemName để hiển thị "Đổi 1 Cơm Tấm"
 */
export const useUserTransactionDetail = (transactionId: string | null) => {
    const [detail, setDetail] = useState<UserTransactionDetail | null>(null);
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
                const res = await walletService.getUserTransactionDetail(transactionId);
                // Backend trả về UserTransactionDetailResponse có sẵn itemName, items
                setDetail(res);
            } catch (err: any) {
                console.error("Fetch User Detail Error:", err);
                setError(err.response?.data?.message || "Lỗi tải chi tiết giao dịch");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [transactionId]);

    return { detail, loading, error };
};