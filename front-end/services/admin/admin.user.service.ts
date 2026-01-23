import { axiosClient } from "@/lib/axios-client";
import { UserFilterParams, UserListResponse, UserResponse } from "@/types/user.type";
import { BaseResponse } from "@/types/transaction.type"; // Hoặc base type của bạn

export const adminUserService = {
    // 1. Lấy danh sách users
    getUsers: async (params: UserFilterParams): Promise<UserListResponse> => {
        // [FIX] Không destructuring { data } ngay lập tức để tránh nhầm lẫn
        const response = await axiosClient.get<BaseResponse<UserListResponse>>('/admin/users', {
            params: {
                keyword: params.keyword,
                status: params.status,
                role: params.role,
                page: params.page,
                size: params.size
            }
        });

        // Kiểm tra logic response để return đúng 'items'
        // Trường hợp 1: axiosClient trả về BaseResponse (Body JSON) -> Lấy .data
        if ((response as any).data && (response as any).code) {
            return (response as any).data;
        }

        // Trường hợp 2: axiosClient là chuẩn AxiosResponse -> Lấy .data.data
        if ((response as any).data?.data) {
            return (response as any).data.data;
        }

        // Trường hợp 3: axiosClient trả về thẳng data (như transaction service có vẻ đang làm)
        return response as unknown as UserListResponse;
    },

    // 2. Lấy chi tiết user
    getUserDetail: async (userId: string): Promise<UserResponse> => {
        const response = await axiosClient.get<BaseResponse<UserResponse>>(`/admin/users/${userId}`);

        // Tương tự logic trên
        if ((response as any).data && (response as any).code) {
            return (response as any).data;
        }
        return (response as any).data?.data || response;
    }
};