import { axiosClient } from '@/lib/axios-client';
import { PageResponse, ServiceResponse, ServiceCategory, CatalogFilterParams } from '@/types/catalog.type';

export const catalogService = {
    /**
     * Lấy danh sách dịch vụ (Có phân trang & lọc)
     * GET /api/catalog/services
     */
    getServices: async (params: CatalogFilterParams): Promise<PageResponse<ServiceResponse>> => {
        // axiosClient tự "gỡ" BaseResponse, trả về data bên trong (là PageResponse)
        const response = await axiosClient.get<PageResponse<ServiceResponse>>('/catalog/services', {
            params: {
                page: params.page,
                size: params.size,
                keyword: params.keyword || undefined, // Nếu rỗng thì không gửi
                categoryId: params.categoryId || undefined,
                sortBy: params.sortBy,
                sortDir: params.sortDir
            }
        });
        return response as unknown as PageResponse<ServiceResponse>;
    },

    /**
     * Lấy danh sách danh mục (để hiển thị Filter)
     * GET /api/catalog/categories
     */
    getCategories: async (): Promise<ServiceCategory[]> => {
        const response = await axiosClient.get<ServiceCategory[]>('/catalog/categories');
        return response as unknown as ServiceCategory[];
    },

    /**
     * Lấy chi tiết 1 dịch vụ
     * GET /api/catalog/services/{id}
     */
    getServiceDetail: async (id: string): Promise<ServiceResponse> => {
        const response = await axiosClient.get<ServiceResponse>(`/catalog/services/${id}`);
        return response as unknown as ServiceResponse;
    }
};