import { useState, useEffect, useCallback, useMemo } from 'react';
import { catalogService } from '@/services/catalog.service';
import {
    ServiceResponse,
    PackageResponse,
    ServiceCategory,
    CatalogFilterParams,
    CatalogItem,
    CatalogItemType,
    PageResponse
} from '@/types/catalog.type';

// Mặc định hiển thị 12 sản phẩm (để chia hết cho 2, 3, 4 cột)
const DEFAULT_PAGE_SIZE = 12;

export const useCatalog = () => {
    // --- STATE DỮ LIỆU ---
    const [services, setServices] = useState<ServiceResponse[]>([]);
    const [packages, setPackages] = useState<PackageResponse[]>([]);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);

    // --- STATE UI ---
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isServicesLoading, setIsServicesLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // --- STATE PHÂN TRANG ---
    const [pagination, setPagination] = useState({
        pageNumber: 0,
        totalPages: 0,
        totalItems: 0,
        size: DEFAULT_PAGE_SIZE // [MỚI] Lưu size hiện tại để UI hiển thị
    });

    // --- STATE FILTER GỬI API ---
    const [filters, setFilters] = useState<CatalogFilterParams>({
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        keyword: '',
        categoryId: '',
        sortBy: 'createdAt',
        sortDir: 'desc'
    });

    // --- STATE LOCAL FILTER (TAB) ---
    const [viewFilter, setViewFilter] = useState<CatalogItemType | 'ALL'>('ALL');

    // =========================================================================
    // 1. FETCH DATA TĨNH (Packages & Categories)
    // =========================================================================
    const fetchStaticData = useCallback(async () => {
        try {
            const [pkgs, cats] = await Promise.all([
                catalogService.getPackages(),
                catalogService.getCategories()
            ]);
            setPackages(pkgs);
            setCategories(cats);
        } catch (err: any) {
            console.error("Failed to load static catalog data", err);
        }
    }, []);

    // =========================================================================
    // 2. FETCH SERVICES (Gọi lại khi filter/page/size thay đổi)
    // =========================================================================
    const fetchServices = useCallback(async () => {
        setIsServicesLoading(true);
        setError(null);
        try {
            const data: PageResponse<ServiceResponse> = await catalogService.getServices(filters);

            setServices(data.items);
            setPagination({
                pageNumber: data.page,
                totalPages: data.totalPages,
                totalItems: data.totalItems,
                size: filters.size // Cập nhật size theo filter hiện tại
            });
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Không thể tải danh sách dịch vụ');
        } finally {
            setIsServicesLoading(false);
            setIsLoading(false);
        }
    }, [filters]);

    // --- EFFECTS ---
    useEffect(() => {
        fetchStaticData();
    }, [fetchStaticData]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    // =========================================================================
    // 3. LOGIC MERGE & DISPLAY DATA
    // =========================================================================
    const displayedItems = useMemo(() => {
        let items: CatalogItem[] = [];

        // Logic: Nếu đang search hoặc filter category -> chỉ hiện Service (Package thường ko có category con)
        const isFiltering = !!filters.categoryId || !!filters.keyword;

        if (viewFilter === 'ALL') {
            if (!isFiltering) {
                // Mặc định: hiện Package trước, Service sau
                items = [...packages, ...services];
            } else {
                items = [...services];
            }
        } else if (viewFilter === 'PACKAGE') {
            items = [...packages];
        } else if (viewFilter === 'SERVICE') {
            items = [...services];
        }

        return items;
    }, [services, packages, viewFilter, filters.categoryId, filters.keyword]);

    // =========================================================================
    // 4. ACTIONS (Public functions)
    // =========================================================================

    const changePage = (newPage: number) => {
        if (newPage >= 0 && newPage < pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // [MỚI] Đổi số lượng sản phẩm trên trang
    const changePageSize = (newSize: number) => {
        setFilters(prev => ({
            ...prev,
            size: newSize,
            page: 0 // Reset về trang đầu khi đổi size để tránh lỗi out of range
        }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSearch = (keyword: string) => {
        setFilters(prev => ({ ...prev, keyword, page: 0 }));
    };

    const filterByCategory = (categoryId: string | '') => {
        setFilters(prev => ({ ...prev, categoryId, page: 0 }));
    };

    const filterByType = (type: CatalogItemType | 'ALL') => {
        setViewFilter(type);
        // Nếu chuyển sang tab SERVICE thì reset page về 0
        if (type === 'SERVICE' || type === 'ALL') {
            setFilters(prev => ({ ...prev, page: 0 }));
        }
    };

    const refresh = () => {
        setIsLoading(true);
        Promise.all([fetchStaticData(), fetchServices()]).finally(() => setIsLoading(false));
    };

    return {
        // Data
        displayedItems, // List đã merge để render
        categories,     // List danh mục để filter

        // Metadata
        pagination,     // { pageNumber, totalPages, totalItems, size }
        isLoading,
        isServicesLoading,
        error,

        // Filters State
        currentFilters: filters,
        viewFilter,     // 'ALL' | 'PACKAGE' | 'SERVICE'

        // Actions
        changePage,
        changePageSize, // [MỚI]
        handleSearch,
        filterByCategory,
        filterByType,
        refresh
    };
};