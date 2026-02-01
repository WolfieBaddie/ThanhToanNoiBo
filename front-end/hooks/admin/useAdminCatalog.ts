import { useState, useEffect, useCallback } from 'react';
import { adminCatalogService } from '@/services/admin/admin.catalog.service';
import { catalogService } from '@/services/catalog.service';
import { CatalogStatus } from '@/types/catalog.type';
import {
    AdminServiceResponse,
    PackageResponse,
    ServiceCategory
} from '@/types/admin.catalog.type'; // Đảm bảo import từ file vừa sửa
import { useDebounce } from '@/hooks/useDebounce';

// Chỉ cần 2 loại tab chính theo yêu cầu: SERVICE (Master) và PACKAGE
export type AdminViewType = 'SERVICE' | 'PACKAGE';

export interface AdminCatalogFilterParams {
    type: AdminViewType;
    page: number;
    size: number;
    keyword: string;
    categoryId?: string;
    status?: CatalogStatus | null;
    sortBy?: string;
    sortDir?: string;
}

const DEFAULT_PAGE_SIZE = 10;

export const useAdminCatalog = () => {
    // Data có thể là Master (AdminServiceResponse) hoặc Package (PackageResponse)
    // PackageResponse giờ đã bao gồm merchantInfo
    const [data, setData] = useState<(AdminServiceResponse | PackageResponse)[]>([]);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);

    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<AdminCatalogFilterParams>({
        type: 'SERVICE',
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        keyword: '',
        categoryId: '',
        status: null,
        sortBy: 'createdAt',
        sortDir: 'desc'
    });

    const debouncedKeyword = useDebounce(filters.keyword, 500);

    // Fetch Categories Init
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await catalogService.getCategories();
                setCategories(res);
            } catch (err) {
                console.error("Failed to load categories", err);
            }
        };
        fetchCategories();
    }, []);

    // Fetch Catalog Data
    const fetchCatalog = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Gọi service tương ứng dựa trên Tab Type
            if (filters.type === 'SERVICE') {
                const res = await adminCatalogService.getMasterServices({
                    page: filters.page,
                    size: filters.size,
                    keyword: debouncedKeyword,
                    categoryId: filters.categoryId,
                    status: filters.status || undefined
                });
                setData(res.items);
                setTotalItems(res.totalItems);
                setTotalPages(res.totalPages);
            } else {
                // Fetch Packages
                // Backend trả về PackageResponse mới (có merchantInfo)
                const res = await adminCatalogService.getPackages({
                    page: filters.page,
                    size: filters.size,
                    keyword: debouncedKeyword,
                    status: filters.status || undefined
                });
                setData(res.items);
                setTotalItems(res.totalItems);
                setTotalPages(res.totalPages);
            }
        } catch (err) {
            console.error("Error fetching admin catalog:", err);
            setError("Không thể tải dữ liệu catalog");
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [
        filters.type,
        filters.page,
        filters.size,
        filters.categoryId,
        filters.status,
        filters.sortBy,
        filters.sortDir,
        debouncedKeyword
    ]);

    useEffect(() => {
        fetchCatalog();
    }, [fetchCatalog]);

    // --- ACTIONS ---

    const setTabType = (type: AdminViewType) => {
        setFilters(prev => ({
            ...prev,
            type,
            page: 0,
            categoryId: '',
            keyword: '',
            status: null
        }));
    };

    const setPage = (page: number) => setFilters(prev => ({ ...prev, page }));
    const setSearch = (keyword: string) => setFilters(prev => ({ ...prev, keyword, page: 0 }));
    const setCategoryFilter = (categoryId: string) => setFilters(prev => ({ ...prev, categoryId, page: 0 }));
    const setStatusFilter = (status: CatalogStatus | null) => setFilters(prev => ({ ...prev, status, page: 0 }));
    const refresh = () => fetchCatalog();

    return {
        data,
        categories,
        totalItems,
        totalPages,
        loading,
        error,
        filters,

        // Actions
        setTabType,
        setPage,
        setSearch,
        setCategoryFilter,
        setStatusFilter,
        refresh
    };
};