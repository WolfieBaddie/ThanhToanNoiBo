import { useState, useEffect, useCallback } from 'react';
import { catalogService } from '@/services/catalog.service';
import { ServiceResponse, ServiceCategory, CatalogFilterParams } from '@/types/catalog.type';

const DEFAULT_PAGE_SIZE = 10;

export const useCatalog = () => {
    // --- STATE DỮ LIỆU ---
    const [services, setServices] = useState<ServiceResponse[]>([]);
    const [categories, setCategories] = useState<ServiceCategory[]>([]); // List danh mục để render nút lọc

    // --- STATE QUẢN LÝ ---
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // --- STATE PHÂN TRANG ---
    const [pagination, setPagination] = useState({
        pageNumber: 0,
        totalPages: 0,
        totalItems: 0,
    });

    // --- STATE FILTER ---
    const [filters, setFilters] = useState<CatalogFilterParams>({
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        keyword: '',
        categoryId: '', // Rỗng nghĩa là lấy tất cả
        sortBy: 'createdAt',
        sortDir: 'desc'
    });

    // 1. Fetch Categories (Chỉ chạy 1 lần khi mount)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await catalogService.getCategories();
                if (Array.isArray(data)) {
                    setCategories(data);
                }
            } catch (err) {
                console.error("Failed to load categories", err);
            }
        };
        fetchCategories();
    }, []);

    // 2. Fetch Services (Chạy mỗi khi filters thay đổi)
    const fetchServices = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // [DEBUG]
            console.log("Fetching services with filters:", filters);

            const data = await catalogService.getServices(filters);

            // Logic check dữ liệu an toàn giống Transaction/Voucher
            if (data && Array.isArray(data.items)) {
                setServices(data.items);
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

    // Trigger fetch khi filter đổi
    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    // --- HELPER FUNCTIONS ---

    // Chuyển trang
    const changePage = (newPage: number) => {
        if (newPage >= 0 && newPage < pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    // Tìm kiếm (Reset về trang 0)
    const handleSearch = (keyword: string) => {
        setFilters(prev => ({ ...prev, keyword, page: 0 }));
    };

    // Lọc theo danh mục (Reset về trang 0)
    const filterByCategory = (categoryId: string | '') => {
        setFilters(prev => ({ ...prev, categoryId, page: 0 }));
    };

    // Reload
    const refresh = () => {
        fetchServices();
    };

    return {
        // Data
        services,
        categories,

        // Metadata
        pagination,
        isLoading,
        error,

        // Filter actions
        filters,
        changePage,
        handleSearch,
        filterByCategory,
        refresh
    };
};