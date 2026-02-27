import { axiosClient } from '@/lib/axios-client';
import {
    PageResponse,
    ServiceResponse,
    ServiceCategory,
    CatalogFilterParams,
    PackageResponse,
} from '@/types/catalog.type';

// Nếu bạn chưa có type CatalogDataResponse trong file type, bạn có thể định nghĩa tạm ở đây hoặc thêm vào catalog.type.ts
interface CatalogDataResponse {
    packages: PackageResponse[];
    services: PageResponse<ServiceResponse>;
}

export const catalogService = {
    /**
     * Lấy danh sách dịch vụ (Có phân trang & lọc)
     * GET /api/catalog/services
     */
    getServices: async (params: CatalogFilterParams): Promise<PageResponse<ServiceResponse>> => {
        const response = await axiosClient.get<PageResponse<any>>('/catalog/services', {
            params: {
                page: params.page,
                size: params.size,
                keyword: params.keyword || undefined,
                categoryId: params.categoryId || undefined,
                sortBy: params.sortBy,
                sortDir: params.sortDir
            }
        });

        // [QUAN TRỌNG] Inject type='SERVICE' vào từng item vì backend không trả về field này
        const data = response as unknown as PageResponse<any>;
        if (data.items) {
            data.items = data.items.map((item: any) => ({
                ...item,
                type: 'SERVICE'
            }));
        }

        return data as PageResponse<ServiceResponse>;
    },

    /**
     * Lấy danh sách danh mục
     */
    getCategories: async (): Promise<ServiceCategory[]> => {
        const response = await axiosClient.get<ServiceCategory[]>('/catalog/categories');
        return response as unknown as ServiceCategory[];
    },

    /**
     * Lấy danh sách Packages
     */
    getPackages: async (): Promise<PackageResponse[]> => {
        const response = await axiosClient.get<any[]>('/catalog/packages');

        // Inject type='PACKAGE'
        const data = (response as unknown as any[]).map((item: any) => ({
            ...item,
            type: 'PACKAGE'
        }));

        return data as PackageResponse[];
    },

    /**
     * Lấy dữ liệu tổng hợp cho trang Home (Everything)
     * GET /api/catalog/everything
     */
    getCatalogData: async (params: { keyword?: string, page?: number, size?: number }): Promise<CatalogDataResponse> => {
        const response = await axiosClient.get<any>('/catalog/everything', {
            params: {
                keyword: params.keyword,
                page: params.page || 0,
                size: params.size || 10
            }
        });

        const data = response as unknown as any;

        // Map Packages
        if (data.packages) {
            data.packages = data.packages.map((p: any) => ({ ...p, type: 'PACKAGE' }));
        }

        // Map Services
        if (data.services && data.services.items) {
            data.services.items = data.services.items.map((s: any) => ({ ...s, type: 'SERVICE' }));
        }

        return data as CatalogDataResponse;
    }
};