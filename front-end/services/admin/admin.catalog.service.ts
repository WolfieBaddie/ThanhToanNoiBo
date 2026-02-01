import { axiosClient } from '@/lib/axios-client';
import {
    PageResponse,
    CatalogStatus,
} from '@/types/catalog.type';

import {
    // Types cho Read/View
    ServiceCategory,
    AdminServiceResponse,
    AppService,
    PackageResponse,
    // Requests cho Category & Package
    CreateCategoryRequest,
    UpdateCategoryRequest,
    CreatePackageRequest,
    UpdatePackageRequest,
} from '@/types/admin.catalog.type';

// [MỚI] Import Types riêng cho luồng Admin Service (Create/Update/Toggle)
import {
    CreateMasterServiceRequest,
    UpdateMasterServiceRequest,
    MasterServiceResponse,
    MerchantServiceStatusResponse
} from '@/types/admin.service.type';

// 3 Base URL tương ứng 3 Controller
const URL_CATEGORIES = '/admin/categories';
const URL_PACKAGES = '/admin/packages';
const URL_CATALOG = '/admin/catalog'; // Chứa Master & Moderation

export const adminCatalogService = {
    // =========================================================================
    // 1. CATEGORIES (GIỮ NGUYÊN)
    // =========================================================================
    getAllCategories: async (params: any): Promise<PageResponse<ServiceCategory>> => {
        const res = await axiosClient.get(`${URL_CATEGORIES}`, { params });
        return res as unknown as PageResponse<ServiceCategory>;
    },

    createCategory: async (data: CreateCategoryRequest): Promise<ServiceCategory> => {
        const res = await axiosClient.post(`${URL_CATEGORIES}`, data);
        return res as unknown as ServiceCategory;
    },

    updateCategory: async (id: string, data: UpdateCategoryRequest): Promise<ServiceCategory> => {
        const res = await axiosClient.put(`${URL_CATEGORIES}/${id}`, data);
        return res as unknown as ServiceCategory;
    },

    deleteCategory: async (id: string): Promise<void> => {
        await axiosClient.delete(`${URL_CATEGORIES}/${id}`);
    },

    // =========================================================================
    // 2. PACKAGES (GIỮ NGUYÊN)
    // =========================================================================
    getPackages: async (params: any): Promise<PageResponse<PackageResponse>> => {
        const res = await axiosClient.get(`${URL_PACKAGES}`, { params });
        return res as unknown as PageResponse<PackageResponse>;
    },

    createPackage: async (data: CreatePackageRequest): Promise<PackageResponse> => {
        const res = await axiosClient.post(`${URL_PACKAGES}`, data);
        return res as unknown as PackageResponse;
    },

    updatePackage: async (id: string, data: UpdatePackageRequest): Promise<PackageResponse> => {
        const res = await axiosClient.put(`${URL_PACKAGES}/${id}`, data);
        return res as unknown as PackageResponse;
    },

    approvePackage: async (id: string): Promise<PackageResponse> => {
        const res = await axiosClient.patch(`${URL_PACKAGES}/${id}/approve`);
        return res as unknown as PackageResponse;
    },

    deletePackage: async (id: string): Promise<void> => {
        await axiosClient.delete(`${URL_PACKAGES}/${id}`);
    },

    // =========================================================================
    // 3. MASTER SERVICES (System Catalog) - [CẬP NHẬT TYPE MỚI]
    // =========================================================================

    /**
     * Lấy danh sách Master Service (Group view).
     */
    getMasterServices: async (params: any): Promise<PageResponse<AdminServiceResponse>> => {
        const res = await axiosClient.get(`${URL_CATALOG}`, {
            params: { ...params, type: 'SERVICE' }
        });
        return res as unknown as PageResponse<AdminServiceResponse>;
    },

    /**
     * Tạo Master Service mới
     * Endpoint: POST /api/admin/catalog/master
     */
    createMasterService: async (data: CreateMasterServiceRequest): Promise<MasterServiceResponse> => {
        // Sử dụng Type CreateMasterServiceRequest và MasterServiceResponse mới
        const res = await axiosClient.post<MasterServiceResponse>(`${URL_CATALOG}/master`, data);
        return res as unknown as MasterServiceResponse;
    },

    /**
     * Cập nhật Master Service (Bao gồm cả việc Sync Counter)
     * Endpoint: PUT /api/admin/catalog/master/{id}
     */
    updateMasterService: async (id: string, data: UpdateMasterServiceRequest): Promise<MasterServiceResponse> => {
        // Sử dụng Type UpdateMasterServiceRequest và MasterServiceResponse mới
        const res = await axiosClient.put<MasterServiceResponse>(`${URL_CATALOG}/master/${id}`, data);
        return res as unknown as MasterServiceResponse;
    },

    deleteMasterService: async (id: string): Promise<void> => {
        await axiosClient.delete(`${URL_CATALOG}/master/${id}`);
    },

    // =========================================================================
    // 4. MODERATION (Merchant Services) - [CẬP NHẬT TYPE MỚI]
    // =========================================================================

    /**
     * Lấy danh sách Service lẻ để duyệt.
     */
    getServicesForModeration: async (params: any): Promise<PageResponse<AppService>> => {
        const res = await axiosClient.get(`${URL_CATALOG}/moderation`, { params });
        return res as unknown as PageResponse<AppService>;
    },

    /**
     * Duyệt/Khóa Service của Merchant
     * Endpoint: PATCH /api/admin/catalog/moderation/{id}/status?status=...
     */
    toggleMerchantServiceStatus: async (serviceId: string, status: CatalogStatus): Promise<MerchantServiceStatusResponse> => {
        // Sử dụng MerchantServiceStatusResponse mới (đầy đủ các trường)
        const res = await axiosClient.patch<MerchantServiceStatusResponse>(
            `${URL_CATALOG}/moderation/${serviceId}/status`,
            null,
            { params: { status } }
        );
        return res as unknown as MerchantServiceStatusResponse;
    }
};