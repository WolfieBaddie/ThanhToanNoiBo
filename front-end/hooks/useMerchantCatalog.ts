import { useState, useEffect, useCallback } from 'react';
import { merchantCatalogService } from '@/services/merchant.catalog.service';
import { catalogService } from '@/services/catalog.service';
import {
    ServiceResponse,
    PackageResponse,
    ServiceCategory,
    CatalogItemType
} from '@/types/catalog.type';
import {
    MerchantCatalogFilterParams,
    CreatePackageRequest,
    UpdatePackageRequest
} from '@/types/merchant.types';

const DEFAULT_PAGE_SIZE = 10;

export const useMerchantCatalog = () => {
    // --- DATA STATE ---
    const [services, setServices] = useState<ServiceResponse[]>([]);
    const [packages, setPackages] = useState<PackageResponse[]>([]);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);

    // --- UI STATE ---
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<CatalogItemType>('SERVICE');
    const [isSystemMode, setIsSystemMode] = useState<boolean>(false);

    // --- PAGINATION STATE ---
    const [pagination, setPagination] = useState({
        pageNumber: 0,
        totalPages: 0,
        totalItems: 0,
    });

    const [filters, setFilters] = useState<MerchantCatalogFilterParams>({
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        keyword: '',
        categoryId: '',
        status: '',
        system: false,
    });

    // --- FETCH DATA ---
    const fetchCategories = useCallback(async () => {
        try {
            const res = await catalogService.getCategories();
            setCategories(res);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'SERVICE') {
                const res = await merchantCatalogService.getServices(filters);
                const data = res as any; // Ép kiểu để lấy đúng trường data của ông

                // [FIX] Dùng data.items theo đúng ý ông
                setServices(data.items || []);

                // [FIX] Map pagination đúng 3 trường ông yêu cầu
                setPagination({
                    pageNumber: data.page,
                    totalPages: data.totalPages,
                    totalItems: data.totalItems
                });
            } else {
                const res = await merchantCatalogService.getPackages(filters);
                const data = res as any;

                // [FIX] Dùng data.items
                setPackages(data.items || []);

                // [FIX] Map pagination đúng 3 trường ông yêu cầu
                setPagination({
                    pageNumber: data.page,
                    totalPages: data.totalPages,
                    totalItems: data.totalItems
                });
            }
        } catch (error) {
            console.error("Failed to fetch merchant catalog", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, filters]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- ACTIONS HELPERS ---

    const switchTab = (tab: CatalogItemType) => {
        setActiveTab(tab);
        setFilters(prev => ({ ...prev, page: 0, keyword: '' }));
    };

    const toggleSystemMode = (enabled: boolean) => {
        setIsSystemMode(enabled);
        setFilters(prev => ({ ...prev, page: 0, system: enabled }));
    };

    const handleSearch = (keyword: string) => {
        setFilters(prev => ({ ...prev, keyword, page: 0 }));
    };

    const changePage = (newPage: number) => {
        // Kiểm tra an toàn để không gọi page âm hoặc quá giới hạn
        if (newPage >= 0 && newPage < pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    const filterByCategory = (categoryId: string) => {
        setFilters(prev => ({ ...prev, categoryId, page: 0 }));
    };

    const refresh = () => {
        fetchData();
    };

    // --- PACKAGE ACTIONS ---

    const createPackage = async (data: CreatePackageRequest) => {
        await merchantCatalogService.createPackage(data);
        refresh();
    };

    const updatePackage = async (id: string, data: UpdatePackageRequest) => {
        await merchantCatalogService.updatePackage(id, data);
        refresh();
    };

    const deletePackage = async (id: string) => {
        await merchantCatalogService.deletePackage(id);
        refresh();
    };

    return {
        services,
        packages,
        categories,
        pagination,
        isLoading,
        activeTab,
        isSystemMode,
        switchTab,
        toggleSystemMode,
        handleSearch,
        changePage,
        filterByCategory,
        refresh,
        createPackage,
        updatePackage,
        deletePackage
    };
};