import { useState, useEffect, useCallback } from 'react';
import { voucherService } from '@/services/voucher.service';
import { UserVoucherResponse, VoucherFilters, UserVoucherStatusEnum } from '@/types/voucher.type';

export const useMyVouchers = () => {
    const [vouchers, setVouchers] = useState<UserVoucherResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Default filters
    const [filters, setFilters] = useState<VoucherFilters>({
        page: 0,
        size: 10, // Mặc định 10
        status: UserVoucherStatusEnum.ACTIVE
    });

    const [pagination, setPagination] = useState({
        pageNumber: 0,
        totalPages: 0,
        totalItems: 0,
        size: 10
    });

    const fetchVouchers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await voucherService.getMyVouchers(filters);
            setVouchers(data.items);
            setPagination({
                pageNumber: data.page,
                totalPages: data.totalPages,
                totalItems: data.totalItems,
                size: data.size
            });
        } catch (error) {
            console.error("Error fetching vouchers:", error);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchVouchers();
    }, [fetchVouchers]);

    const changePage = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const filterByStatus = (status: UserVoucherStatusEnum | '') => {
        setFilters(prev => ({ ...prev, status: status, page: 0 }));
    };

    // [MỚI] Hàm thay đổi số lượng item trên 1 trang
    const changePageSize = (newSize: number) => {
        setFilters(prev => ({ ...prev, size: newSize, page: 0 })); // Reset về trang đầu
    };

    return {
        vouchers,
        pagination,
        isLoading,
        filters,        // Trả về filters để UI biết đang select size nào
        changePage,
        filterByStatus,
        changePageSize, // Export hàm mới
        refresh: fetchVouchers
    };
};