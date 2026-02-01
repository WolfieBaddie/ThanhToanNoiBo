import { axiosClient } from '@/lib/axios-client';
import {
    PageResponse,
    ServiceResponse,
    PackageResponse,
    CatalogStatus
} from '@/types/catalog.type';
import {
    MerchantCatalogFilterParams,
    CreateServiceRequest,
    UpdateServiceRequest,
    CreatePackageRequest, // [MỚI]
    UpdatePackageRequest  // [MỚI]
} from '@/types/merchant.types';

export const merchantCatalogService = {
    // --- CÁC HÀM CŨ (GIỮ NGUYÊN) ---

    getServices: async (params: MerchantCatalogFilterParams): Promise<PageResponse<ServiceResponse>> => {
        const response = await axiosClient.get<PageResponse<ServiceResponse>>('/merchant/catalog/services', {
            params: {
                page: params.page,
                size: params.size,
                keyword: params.keyword || undefined,
                categoryId: params.categoryId || undefined,
                status: params.status || undefined,
                system: params.system,
                sortBy: params.sortBy,
                sortDir: params.sortDir
            }
        });
        return response as unknown as PageResponse<ServiceResponse>;
    },

    getPackages: async (params: MerchantCatalogFilterParams): Promise<PageResponse<PackageResponse>> => {
        const response = await axiosClient.get<PageResponse<PackageResponse>>('/merchant/catalog/packages', {
            params: {
                page: params.page,
                size: params.size,
                keyword: params.keyword || undefined,
                system: params.system,
                sortBy: 'createdAt',
                sortDir: 'desc'
            }
        });
        return response as unknown as PageResponse<PackageResponse>;
    },

    createService: async (data: CreateServiceRequest): Promise<ServiceResponse[]> => {
        const response = await axiosClient.post<ServiceResponse[]>('/merchant/catalog/services', data);
        return response as unknown as ServiceResponse[];
    },

    deleteService: async (id: string): Promise<void> => {
        await axiosClient.delete(`/merchant/catalog/services/${id}`);
    },

    updateService: async (id: string, data: UpdateServiceRequest): Promise<ServiceResponse> => {
        const response = await axiosClient.put<ServiceResponse>(`/merchant/catalog/services/${id}`, data);
        return response as unknown as ServiceResponse;
    },

    toggleServiceStatus: async (id: string, currentStatus: CatalogStatus): Promise<ServiceResponse> => {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        return await merchantCatalogService.updateService(id, { status: newStatus });
    },

    // --- [BỔ SUNG MỚI] CÁC HÀM CHO PACKAGE ---

    /**
     * Tạo gói Combo mới
     * POST /api/merchant/catalog/packages
     */
    createPackage: async (data: CreatePackageRequest): Promise<PackageResponse> => {
        const response = await axiosClient.post<PackageResponse>('/merchant/catalog/packages', data);
        return response as unknown as PackageResponse;
    },

    /**
     * Cập nhật gói Combo
     * PUT /api/merchant/catalog/packages/{id}
     */
    updatePackage: async (id: string, data: UpdatePackageRequest): Promise<PackageResponse> => {
        const response = await axiosClient.put<PackageResponse>(`/merchant/catalog/packages/${id}`, data);
        return response as unknown as PackageResponse;
    },

    /**
     * Xóa mềm gói Combo
     * DELETE /api/merchant/catalog/packages/{id}
     */
    deletePackage: async (id: string): Promise<void> => {
        await axiosClient.delete(`/merchant/catalog/packages/${id}`);
    }
};