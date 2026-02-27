import { useState, useEffect, useCallback } from 'react';
import { adminUserService } from '@/services/admin/admin.user.service';
import { UserFilterParams, UserResponse, UserStatus, UserType } from '@/types/user.type';
import { useDebounce } from '@/hooks/useDebounce';

export const useAdminUsers = (initialSize = 10) => {
    // Data State
    const [data, setData] = useState<UserResponse[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter State
    const [filters, setFilters] = useState<UserFilterParams>({
        page: 0,
        size: initialSize,
        keyword: '',
        status: null,
        role: null,
        userType: null, // [MỚI]
        fromDate: undefined,
        toDate: undefined
    });

    const debouncedKeyword = useDebounce(filters.keyword, 500);

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
                setData([]);
                setTotalItems(0);
            }
        } catch (err: any) {
            console.error("Fetch Users Error:", err);
            setError(err.message || "Lỗi tải dữ liệu");
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [
        filters.page, filters.size, filters.status, filters.role,
        filters.userType, // [MỚI] Dependency
        filters.fromDate, filters.toDate, debouncedKeyword
    ]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // --- ACTIONS ---
    const setPage = (page: number) => setFilters(prev => ({ ...prev, page }));
    const setSearch = (keyword: string) => setFilters(prev => ({ ...prev, keyword, page: 0 }));
    const setStatusFilter = (status: UserStatus | null) => setFilters(prev => ({ ...prev, status, page: 0 }));
    const setRoleFilter = (role: string | null) => setFilters(prev => ({ ...prev, role, page: 0 }));

    // [MỚI] Action lọc UserType
    const setUserTypeFilter = (type: UserType | null) => setFilters(prev => ({ ...prev, userType: type, page: 0 }));

    const setDateFilter = (from: Date | null, to: Date | null) => {
        const formatDate = (date: Date) => {
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            return localDate.toISOString().split('T')[0];
        };
        setFilters(prev => ({
            ...prev,
            fromDate: from ? formatDate(from) : undefined,
            toDate: to ? formatDate(to) : undefined,
            page: 0
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
        setUserTypeFilter, // [MỚI] Export
        setDateFilter,
        refresh: fetchUsers
    };
};