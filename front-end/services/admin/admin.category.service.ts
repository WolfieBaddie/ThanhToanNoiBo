import axiosClient from './axiosClient'; // Giả sử bạn đã config axios base URL
import {
    BaseResponse,
    PageResponse,
    ServiceFilterParams,
    Category,
    CreateCategoryRequest,
    UpdateCategoryRequest,
    MasterService,
    CreateMasterServiceRequest,
    UpdateServiceRequest,
    AppService,
    CatalogStatus,
    AppPackage,
    CreatePackageRequest,
    UpdatePackageRequest
} from '../types/adminCatalog.types';

const BASE_URL = '/api/admin';

export const adminCatalogService = {
    // ================= CATEGORIES =================
    getCategories: async (params: ServiceFilterParams) => {
        const response = await axiosClient.get<BaseResponse<PageResponse<Category>>>(
            `${BASE_URL}/categories`,
            { params }
        );
        return response.data;
    },

    createCategory: async (data: CreateCategoryRequest) => {
        const response = await axiosClient.post<BaseResponse<Category>>(
            `${BASE_URL}/categories`,
            data
        );
        return response.data;
    },

    updateCategory: async (id: string, data: UpdateCategoryRequest) => {
        const response = await axiosClient.put<BaseResponse<Category>>(
            `${BASE_URL}/categories/${id}`,
            data
        );
        return response.data;
    },

    deleteCategory: async (id: string) => {
        const response = await axiosClient.delete<BaseResponse<void>>(
            `${BASE_URL}/categories/${id}`
        );
        return response.data;
    },

    // ================= MASTER SERVICES =================
    getMasterServices: async (params: ServiceFilterParams) => {
        const response = await axiosClient.get<BaseResponse<PageResponse<MasterService>>>(
            `${BASE_URL}/master-services`,
            { params }
        );
        return response.data;
    },

    createMasterService: async (data: CreateMasterServiceRequest) => {
        const response = await axiosClient.post<BaseResponse<MasterService>>(
            `${BASE_URL}/master-services`,
            data
        );
        return response.data;
    },

    updateMasterService: async (id: string, data: UpdateServiceRequest) => {
        const response = await axiosClient.put<BaseResponse<MasterService>>(
            `${BASE_URL}/master-services/${id}`,
            data
        );
        return response.data;
    },

    deleteMasterService: async (id: string) => {
        const response = await axiosClient.delete<BaseResponse<void>>(
            `${BASE_URL}/master-services/${id}`
        );
        return response.data;
    },

    // ================= MERCHANT SERVICES (APP SERVICES) =================
    // Lấy danh sách service của merchant (để duyệt/khóa)
    getAppServices: async (params: ServiceFilterParams) => {
        const response = await axiosClient.get<BaseResponse<PageResponse<AppService>>>(
            `${BASE_URL}/merchant-services`, // URL mapping tạm thời
            { params }
        );
        return response.data;
    },

    // Duyệt hoặc Khóa service merchant
    updateAppServiceStatus: async (id: string, status: CatalogStatus) => {
        // Backend đang dùng hàm updateAppServiceStatus, ta có thể PUT vào endpoint status
        const response = await axiosClient.put<BaseResponse<AppService>>(
            `${BASE_URL}/merchant-services/${id}/status`,
            null,
            { params: { status } }
        );
        return response.data;
    },

    // ================= PACKAGES =================
    getPackages: async (params: ServiceFilterParams) => {
        const response = await axiosClient.get<BaseResponse<PageResponse<AppPackage>>>(
            `${BASE_URL}/packages`,
            { params }
        );
        return response.data;
    },

    createPackage: async (data: CreatePackageRequest) => {
        const response = await axiosClient.post<BaseResponse<AppPackage>>(
            `${BASE_URL}/packages`,
            data
        );
        return response.data;
    },

    updatePackage: async (id: string, data: UpdatePackageRequest) => {
        const response = await axiosClient.put<BaseResponse<AppPackage>>(
            `${BASE_URL}/packages/${id}`,
            data
        );
        return response.data;
    },

    // Nút duyệt nhanh gói
    approvePackage: async (id: string) => {
        const response = await axiosClient.put<BaseResponse<AppPackage>>(
            `${BASE_URL}/packages/${id}/approve`
        );
        return response.data;
    },

    deletePackage: async (id: string) => {
        const response = await axiosClient.delete<BaseResponse<void>>(
            `${BASE_URL}/packages/${id}`
        );
        return response.data;
    },
};