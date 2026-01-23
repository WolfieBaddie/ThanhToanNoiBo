import { useState, useEffect, useCallback, useMemo } from 'react';
import { catalogService } from '@/services/catalog.service';
import {
    ServiceResponse,
    PackageResponse,
    ServiceCategory,
    CatalogFilterParams,
    CatalogItem,
    CatalogItemType
} from '@/types/catalog.type';

const DEFAULT_PAGE_SIZE = 10;

export const useCatalog = () => {
    // --- STATE DỮ LIỆU GỐC ---
    const [services, setServices] = useState<ServiceResponse[]>([]);
    const [packages, setPackages] = useState<PackageResponse[]>([]); // Thêm state Packages
    const [categories, setCategories] = useState<ServiceCategory[]>([]);

    // --- STATE QUẢN LÝ ---
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // --- STATE PHÂN TRANG (Cho Services) ---
    const [pagination, setPagination] = useState({
        pageNumber: 0,
        totalPages: 0,
        totalItems: 0,
    });

    // --- STATE FILTER SERVER (Gửi lên BE) ---
    const [filters, setFilters] = useState<CatalogFilterParams>({
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        keyword: '',
        categoryId: '',
        sortBy: 'createdAt',
        sortDir: 'desc'
    });

    // --- STATE FILTER CLIENT (Lọc hiển thị tại UI) ---
    // 'ALL': Hiện Package ở trên, Service ở dưới
    // 'PACKAGE': Chỉ hiện Package
    // 'SERVICE': Chỉ hiện Service
    const [viewFilter, setViewFilter] = useState<CatalogItemType | 'ALL'>('ALL');

    // 1. Fetch Static Data (Categories & Packages) - Chạy 1 lần
    useEffect(() => {
        const fetchStaticData = async () => {
            try {
                // Gọi song song 2 API để tiết kiệm thời gian
                // Lưu ý: Bạn cần đảm bảo catalogService.getPackages() đã được định nghĩa
                const [catsData, pkgsData] = await Promise.all([
                    catalogService.getCategories(),
                    catalogService.getPackages()
                ]);

                if (Array.isArray(catsData)) setCategories(catsData);

                if (Array.isArray(pkgsData)) {
                    // Map thêm type='PACKAGE' nếu BE chưa trả về, hoặc typescript tự hiểu nhờ interface
                    const mappedPkgs = pkgsData.map(p => ({ ...p, type: 'PACKAGE' } as PackageResponse));
                    setPackages(mappedPkgs);
                }

            } catch (err) {
                console.error("Failed to load static catalog data", err);
            }
        };
        fetchStaticData();
    }, []);

    // 2. Fetch Services (Chạy mỗi khi filters thay đổi)
    const fetchServices = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await catalogService.getServices(filters);

            if (data && Array.isArray(data.items)) {
                // Map thêm type='SERVICE' để an toàn
                const mappedServices = data.items.map(s => ({ ...s, type: 'SERVICE' } as ServiceResponse));

                setServices(mappedServices);
                setPagination({
                    pageNumber: data.page,
                    totalPages: data.totalPages,
                    totalItems: data.totalItems
                });
            } else {
                setServices([]);
                setPagination({ pageNumber: 0, totalPages: 0, totalItems: 0 });
            }

        } catch (err: any) {
            console.error("Error fetching services:", err);
            setError(err.response?.data?.message || "Không thể tải danh sách dịch vụ.");
            setServices([]);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    // --- COMPUTED DATA (Dữ liệu hiển thị cuối cùng) ---
    // Logic:
    // - Nếu đang ở trang 0 và viewFilter là 'ALL' hoặc 'PACKAGE' -> Hiển thị Packages lên đầu.
    // - Nếu có keyword tìm kiếm -> Tùy logic, thường chỉ tìm Service (vì Package ít),
    //   nhưng ở đây ta tạm hiển thị Package luôn nếu khớp keyword (client filter).

    const displayedItems = useMemo<CatalogItem[]>(() => {
        let result: CatalogItem[] = [];

        // 1. Xử lý Packages (Lọc client-side)
        let visiblePackages = packages;

        // Nếu có keyword, lọc sơ bộ Package theo tên (Optional)
        if (filters.keyword) {
            const k = filters.keyword.toLowerCase();
            visiblePackages = packages.filter(p => p.packageName.toLowerCase().includes(k));
        }

        // 2. Logic Gộp
        if (viewFilter === 'PACKAGE') {
            return visiblePackages;
        }

        if (viewFilter === 'SERVICE') {
            return services;
        }

        // Case 'ALL':
        // Chỉ hiện Package nếu đang ở trang đầu tiên (page 0) của Services
        // để tránh Package lặp lại ở mọi trang
        if (filters.page === 0) {
            result = [...visiblePackages, ...services];
        } else {
            result = [...services];
        }

        return result;
    }, [services, packages, viewFilter, filters.page, filters.keyword]);


    // --- ACTIONS ---

    const changePage = (newPage: number) => {
        if (newPage >= 0 && newPage < pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleSearch = (keyword: string) => {
        setFilters(prev => ({ ...prev, keyword, page: 0 }));
    };

    const filterByCategory = (categoryId: string | '') => {
        setFilters(prev => ({ ...prev, categoryId, page: 0 }));
    };

    // Action mới: Cho phép UI chuyển đổi chế độ xem (Tất cả / Combo / Dịch vụ)
    const filterByType = (type: CatalogItemType | 'ALL') => {
        setViewFilter(type);
        setFilters(prev => ({ ...prev, page: 0 })); // Reset về trang 1 khi đổi loại view
    };

    const refresh = () => {
        fetchServices();
        // Có thể gọi lại fetchStaticData nếu cần cập nhật cả package
    };

    return {
        // Raw Data (nếu cần truy cập riêng)
        services,
        packages,
        categories,

        // Merged Data (Dùng cái này để map ra View)
        displayedItems,

        // Metadata
        pagination,
        isLoading,
        error,
        viewFilter, // Để UI biết đang highlight tab nào

        // Filter actions
        filters,
        changePage,
        handleSearch,
        filterByCategory,
        filterByType, // Expose hàm này ra ngoài
        refresh
    };
};