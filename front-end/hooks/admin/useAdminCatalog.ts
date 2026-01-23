import { useState, useEffect, useCallback } from 'react';
import { adminCatalogService, AdminCatalogFilterParams } from '@/services/admin/admin.catalog.service';
import {
    ServiceResponse,
    PackageResponse,
    ServiceCategory
} from '@/types/catalog.type';
import { catalogService } from '@/services/catalog.service'; // Reuse để lấy categories
import { useDebounce } from '@/hooks/useDebounce';

const DEFAULT_PAGE_SIZE = 10;

export const useAdminCatalog = () => {
    // --- STATE DATA ---
    const [data, setData] = useState<(ServiceResponse | PackageResponse)[]>([]);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);

    // --- STATE PAGINATION ---
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // --- STATE UI ---
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- STATE FILTER ---
    const [filters, setFilters] = useState<AdminCatalogFilterParams>({
        type: 'SERVICE', // Mặc định hiển thị tab Service
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        keyword: '',
        categoryId: '',
        isActive: null,
        sortBy: 'createdAt',
        sortDir: 'desc'
    });

    // Debounce keyword để tránh spam API
    const debouncedKeyword = useDebounce(filters.keyword, 500);

    // 1. Load Categories (Chạy 1 lần để phục vụ dropdown filter)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await catalogService.getCategories();
                if (Array.isArray(res)) setCategories(res);
            } catch (err) {
                console.error("Failed to load categories", err);
            }
        };
        fetchCategories();
    }, []);

    // 2. Main Fetch Function
    const fetchCatalog = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Gọi service
            const res = await adminCatalogService.getCatalogItems({
                ...filters,
                keyword: debouncedKeyword
            });

            // Kiểm tra dữ liệu trả về chuẩn PageResponse
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
            console.error("Admin Catalog Error:", err);
            setError(err.response?.data?.message || "Lỗi tải dữ liệu danh mục");
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [
        filters.type,
        filters.page,
        filters.size,
        filters.categoryId,
        filters.isActive,
        debouncedKeyword // Dùng keyword đã debounce
    ]);

    // Auto-fetch khi filters thay đổi
    useEffect(() => {
        fetchCatalog();
    }, [fetchCatalog]);

    // --- HELPER ACTIONS (Giống useAdminTransactions) ---

    // Chuyển Tab (Service <-> Package)
    const setTabType = (type: 'SERVICE' | 'PACKAGE') => {
        setFilters(prev => ({
            ...prev,
            type,
            page: 0,
            categoryId: '', // Reset category
            keyword: ''
        }));
    };

    const setPage = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const setSearch = (keyword: string) => {
        setFilters(prev => ({ ...prev, keyword, page: 0 }));
    };

    const setCategoryFilter = (categoryId: string) => {
        setFilters(prev => ({ ...prev, categoryId, page: 0 }));
    };

    const setStatusFilter = (isActive: boolean | null) => {
        setFilters(prev => ({ ...prev, isActive, page: 0 }));
    };

    const refresh = () => fetchCatalog();

    return {
        // Data
        data,
        categories,
        totalItems,
        totalPages,

        // UI
        loading,
        error,

        // Filters & Actions
        filters,
        setTabType,
        setPage,
        setSearch,
        setCategoryFilter,
        setStatusFilter,
        refresh
    };
};