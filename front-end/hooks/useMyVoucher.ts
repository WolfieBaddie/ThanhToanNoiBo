import { useState, useEffect, useCallback } from 'react';
import { voucherService } from '../services/voucher.service';
import { UserVoucherResponse, VoucherFilters, UserVoucherStatusEnum } from '@/types/voucher.type';

const DEFAULT_PAGE_SIZE = 9;

export const useMyVouchers = () => {
    const [vouchers, setVouchers] = useState<UserVoucherResponse[]>([]);

    const [pagination, setPagination] = useState({
        pageNumber: 0,
        totalPages: 0,
        totalElements: 0,
    });

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<VoucherFilters>({
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        status: UserVoucherStatusEnum.ACTIVE,
        code: ''
    });

    const fetchVouchers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // @ts-ignore - Bỏ qua check type tạm thời nếu PageResponse chưa update
            const data = await voucherService.getMyVouchers(filters);

            // [FIX]: Tham khảo logic từ useTransaction.ts
            // Cấu trúc đúng là: { items: [], totalItems: number, totalPages: number, ... }
            if (data && Array.isArray(data.items)) {
                setVouchers(data.items);

                setPagination({
                    pageNumber: data.page || filters.page, // Lấy page trả về hoặc page hiện tại
                    totalPages: data.totalPages || 0,
                    totalElements: data.totalItems || 0    // Đổi từ totalElements -> totalItems
                });
            } else {
                // Fallback nếu API trả về null hoặc sai cấu trúc
                console.warn("Invalid data structure:", data);
                setVouchers([]);
                setPagination({
                    pageNumber: 0,
                    totalPages: 0,
                    totalElements: 0
                });
            }

        } catch (err: any) {
            console.error("Error fetching vouchers:", err);
            setError("Không thể tải danh sách vé.");
            setVouchers([]);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchVouchers();
    }, [fetchVouchers]);

    const changePage = (newPage: number) => {
        if (newPage >= 0 && newPage < pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    const filterByStatus = (status: UserVoucherStatusEnum | '') => {
        setFilters(prev => ({ ...prev, status, page: 0 }));
    };

    return {
        vouchers,
        pagination,
        isLoading,
        error,
        filters,
        changePage,
        filterByStatus,
        refresh: fetchVouchers
    };
};