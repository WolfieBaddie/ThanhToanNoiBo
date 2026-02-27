import { axiosClient } from "@/lib/axios-client";
import {
    CreateUserRequest,
    UpdateUserRequest,
    UserFilterParams,
    UserListResponse,
    UserResponse
} from "@/types/user.type";
import { BaseResponse } from "@/types/admin.catalog.type"; // Hoặc import BaseResponse từ file type chung của bạn

export const adminUserService = {
    // 1. Lấy danh sách users
    getUsers: async (params: UserFilterParams): Promise<UserListResponse> => {
        const response = await axiosClient.get<BaseResponse<UserListResponse>>('/admin/users', {
            params: {
                keyword: params.keyword,
                status: params.status,
                role: params.role,

                // [MỚI] Truyền userType lên server
                userType: params.userType,

                fromDate: params.fromDate,
                toDate: params.toDate,
                page: params.page,
                size: params.size
            }
        });

        // Xử lý response linh hoạt (tùy cấu hình axios của bạn trả về data hay full response)
        // Nếu axios interceptor đã trả về response.data, ta có thể cast thẳng
        const resData = response as any;

        if (resData.data && resData.code) {
            return resData.data; // Trường hợp trả về BaseResponse
        }

        if (resData.items) {
            return resData; // Trường hợp trả về thẳng PageResponse
        }

        return resData as UserListResponse;
    },

    // 2. Lấy chi tiết user
    getUserDetail: async (userId: string): Promise<UserResponse> => {
        const response = await axiosClient.get<BaseResponse<UserResponse>>(`/admin/users/${userId}`);
        const resData = response as any;
        return (resData.data || resData) as UserResponse;
    },

    createUser: async (data: CreateUserRequest): Promise<UserResponse> => {
        const response = await axiosClient.post<BaseResponse<UserResponse>>('/admin/users', data);
        const resData = response as any;
        return resData.data || resData;
    },

    updateUser: async (userId: string, data: UpdateUserRequest): Promise<UserResponse> => {
        const response = await axiosClient.put<BaseResponse<UserResponse>>(`/admin/users/${userId}`, data);
        const resData = response as any;
        return resData.data || resData;
    },

    deleteUser: async (userId: string): Promise<string> => {
        const response = await axiosClient.delete<BaseResponse<string>>(`/admin/users/${userId}`);
        const resData = response as any;
        return resData.message || "Xóa thành công";
    }
};