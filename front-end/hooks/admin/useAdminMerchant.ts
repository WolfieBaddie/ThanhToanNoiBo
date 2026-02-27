import { useState, useEffect, useCallback } from 'react';
import { adminMerchantService } from '@/services/admin/admin.merchant.service';
import { MerchantSummaryResponse, MerchantFilterParams } from '@/types/admin.merchant.type';
import { UserStatus } from '@/types/user.type';
import { useDebounce } from '@/hooks/useDebounce';

export const useAdminMerchants = (initialSize = 10) => {
    const [data, setData] = useState<MerchantSummaryResponse[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState<MerchantFilterParams>({
        page: 0,
        size: initialSize,
        keyword: '',
        status: null
    });

    const debouncedKeyword = useDebounce(filters.keyword, 500);

    const fetchMerchants = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminMerchantService.getMerchants({
                ...filters,
                keyword: debouncedKeyword
            });

            // [QUAN TRỌNG] Xử lý Response từ Spring Page
            // Kiểm tra cả 'content' (Spring Default) và 'items' (Custom cũ) để an toàn
            // @ts-ignore
            const items = res.content || res.items || [];
            // @ts-ignore
            const total = res.totalElements || res.totalItems || 0;
            // @ts-ignore
            const pages = res.totalPages || 0;

            setData(items);
            setTotalItems(total);
            setTotalPages(pages);

        } catch (error) {
            console.error("Fetch merchants error", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [filters.page, filters.size, filters.status, debouncedKeyword]);

    useEffect(() => {
        fetchMerchants();
    }, [fetchMerchants]);

    // Actions
    const setPage = (page: number) => setFilters(prev => ({ ...prev, page }));
    const setSearch = (keyword: string) => setFilters(prev => ({ ...prev, keyword, page: 0 }));
    const setStatusFilter = (status: UserStatus | null) => setFilters(prev => ({ ...prev, status, page: 0 }));
    const refresh = () => fetchMerchants();

    return {
        data,
        totalItems,
        totalPages,
        loading,
        filters,
        setPage,
        setSearch,
        setStatusFilter,
        refresh
    };
};