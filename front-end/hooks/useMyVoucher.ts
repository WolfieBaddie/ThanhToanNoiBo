import { useState, useEffect, useCallback } from 'react';
import { voucherService } from '@/services/voucher.service';
import { UserVoucherResponse, VoucherFilters, UserVoucherStatusEnum } from '@/types/voucher.type';

export const useMyVouchers = () => {
    const [vouchers, setVouchers] = useState<UserVoucherResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Default filters
    const [filters, setFilters] = useState<VoucherFilters>({
        page: 0,
        size: 10,
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

            // data.items ở đây là danh sách Voucher (UserVoucherResponse[])
            // Mỗi voucher bên trong sẽ tự động có field .items (chi tiết món) nhờ update Type
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

    // Các hàm helper đổi trang, filter
    const changePage = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const filterByStatus = (status: UserVoucherStatusEnum | '') => {
        setFilters(prev => ({ ...prev, status: status, page: 0 }));
    };

    const changePageSize = (newSize: number) => {
        setFilters(prev => ({ ...prev, size: newSize, page: 0 }));
    };

    return {
        vouchers,
        pagination,
        isLoading,
        filters,
        changePage,
        filterByStatus,
        changePageSize,
        refresh: fetchVouchers
    };
};