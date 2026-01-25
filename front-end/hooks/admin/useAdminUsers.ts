import { useState, useEffect, useCallback } from 'react';
import { adminUserService } from '@/services/admin/admin.user.service';
import { UserFilterParams, UserResponse, UserStatus } from '@/types/user.type';
import { useDebounce } from '@/hooks/useDebounce';

export const useAdminUsers = (initialSize = 10) => {
    // State Data
    const [data, setData] = useState<UserResponse[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // State Loading & Error
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State Filter
    const [filters, setFilters] = useState<UserFilterParams>({
        page: 0,
        size: initialSize,
        keyword: '',
        status: null,
        role: null,
        fromDate: undefined, // [MỚI]
        toDate: undefined    // [MỚI]
    });

    const debouncedKeyword = useDebounce(filters.keyword, 500);

    // --- MAIN FETCH FUNCTION ---
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminUserService.getUsers({
                ...filters,
                keyword: debouncedKeyword
            });

            if (res && Array.isArray(res.items)) {
                setData(res.items);
                setTotalItems(res.totalItems || 0);
                setTotalPages(res.totalPages || 0);
            } else {
                console.warn("API response format invalid:", res);
                setData([]);
                setTotalItems(0);
                setTotalPages(0);
            }
        } catch (err: any) {
            console.error("Fetch Users Error:", err);
            setError(err.response?.data?.message || "Lỗi tải danh sách người dùng");
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [
        filters.page,
        filters.size,
        filters.status,
        filters.role,
        filters.fromDate, // [MỚI] Thêm vào dependency
        filters.toDate,   // [MỚI] Thêm vào dependency
        debouncedKeyword
    ]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // --- ACTIONS ---
    const setPage = (page: number) => setFilters(prev => ({ ...prev, page }));
    const setSearch = (keyword: string) => setFilters(prev => ({ ...prev, keyword, page: 0 }));
    const setStatusFilter = (status: UserStatus | null) => setFilters(prev => ({ ...prev, status, page: 0 }));
    const setRoleFilter = (role: string | null) => setFilters(prev => ({ ...prev, role, page: 0 }));
    const refresh = () => fetchUsers();

    // [MỚI] Action set Date Filter
    // Hàm này nhận Date object và convert sang string YYYY-MM-DD
    const setDateFilter = (from: Date | null, to: Date | null) => {
        const formatDate = (date: Date) => {
            // Lấy YYYY-MM-DD theo local time để tránh lệch múi giờ
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            return localDate.toISOString().split('T')[0];
        };

        setFilters(prev => ({
            ...prev,
            fromDate: from ? formatDate(from) : undefined,
            toDate: to ? formatDate(to) : undefined,
            page: 0 // Reset về trang 1 khi lọc
        }));
    };

    return {
        data,
        totalItems,
        totalPages,
        loading,
        error,
        filters,
        setPage,
        setSearch,
        setStatusFilter,
        setRoleFilter,
        setDateFilter, // [MỚI] Export function
        refresh
    };
};