import { axiosClient } from '@/lib/axios-client';
import {
    PageResponse,
    ServiceResponse,
    PackageResponse,
    CatalogFilterParams
} from '@/types/catalog.type';

// Type Filter mở rộng cho Admin (thêm type & isActive)
export interface AdminCatalogFilterParams extends CatalogFilterParams {
    type: 'SERVICE' | 'PACKAGE'; // Bắt buộc
    isActive?: boolean | null;   // Admin lọc được trạng thái ẩn/hiện
}

export const adminCatalogService = {
    /**
     * Lấy danh sách Catalog (Service hoặc Package) cho Admin
     * GET /api/admin/catalog
     */
    getCatalogItems: async (params: AdminCatalogFilterParams): Promise<PageResponse<ServiceResponse | PackageResponse>> => {
        const response = await axiosClient.get('/admin/catalog', {
            params: {
                type: params.type,
                keyword: params.keyword || undefined,
                categoryId: params.categoryId || undefined,
                isActive: params.isActive,
                page: params.page,
                size: params.size,
                sortBy: params.sortBy,
                sortDir: params.sortDir
            }
        });

        // Ép kiểu trực tiếp về PageResponse như file mẫu bạn đưa
        return response as unknown as PageResponse<ServiceResponse | PackageResponse>;
    },

    /**
     * Tạo mới Service
     * POST /api/admin/catalog/services
     */
    createService: async (data: any): Promise<ServiceResponse> => {
        const response = await axiosClient.post('/admin/catalog/services', data);
        return response as unknown as ServiceResponse;
    },

    /**
     * Tạo mới Category
     * POST /api/admin/catalog/categories
     */
    createCategory: async (data: any): Promise<any> => {
        const response = await axiosClient.post('/admin/catalog/categories', data);
        return response as unknown as any;
    }
};