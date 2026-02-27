import { axiosClient } from "@/lib/axios-client";
import {
    AdminMerchantDetailResponse,
    MerchantSummaryResponse,
    MerchantFilterParams,
    UpdateCounterRequest,
    UpdateMerchantItemStatusRequest, UpdateServiceRequest, UpdatePackageRequest
} from "@/types/admin.merchant.type";
import { PageResponse } from "@/types/catalog.type"; // [CẬP NHẬT] Reuse PageResponse chung

export const adminMerchantService = {
    /**
     * 1. Lấy chi tiết Merchant
     */
    getMerchantDetail: async (merchantId: string): Promise<AdminMerchantDetailResponse> => {
        const response = await axiosClient.get(`/admin/merchants/${merchantId}`);
        return response as unknown as AdminMerchantDetailResponse;
    },

    /**
     * 2. Cập nhật thông tin Quầy
     */
    updateCounter: async (merchantId: string, data: UpdateCounterRequest): Promise<any> => {
        const response = await axiosClient.put(`/admin/merchants/${merchantId}/counter`, data);
        return response;
    },

    /**
     * 3. Cập nhật trạng thái Service
     */
    updateServiceStatus: async (serviceId: string, data: UpdateMerchantItemStatusRequest): Promise<any> => {
        const response = await axiosClient.put(`/admin/merchants/services/${serviceId}/status`, data);
        return response;
    },

    /**
     * 4. Cập nhật trạng thái Package
     */
    updatePackageStatus: async (packageId: string, data: UpdateMerchantItemStatusRequest): Promise<any> => {
        const response = await axiosClient.put(`/admin/merchants/packages/${packageId}/status`, data);
        return response;
    },

    updateMerchantService: async (serviceId: string, data: UpdateServiceRequest): Promise<any> => {
        const response = await axiosClient.put(`/admin/merchants/services/${serviceId}`, data);
        return response;
    },

    updateMerchantPackage: async (packageId: string, data: UpdatePackageRequest): Promise<any> => {
        const response = await axiosClient.put(`/admin/merchants/packages/${packageId}`, data);
        return response;
    },

    /**
     * 5. Lấy danh sách Merchant (Dạng Spring Page)
     */
    getMerchants: async (params: MerchantFilterParams): Promise<PageResponse<MerchantSummaryResponse>> => {
        const response = await axiosClient.get('/admin/merchants', { params });
        // Response từ backend là Spring Page (content, totalElements,...)
        return response as unknown as PageResponse<MerchantSummaryResponse>;
    }
};