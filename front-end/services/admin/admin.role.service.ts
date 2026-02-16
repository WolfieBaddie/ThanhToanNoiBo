import { axiosClient } from "@/lib/axios-client";
import { RoleResponse } from "@/types/role.type";

// Đảm bảo endpoint khớp với Backend của bạn (ví dụ: /roles hoặc /admin/roles)
const ENDPOINT = '/roles';

export const adminRoleService = {
    getAllRoles: async (): Promise<RoleResponse[]> => {
        // Gọi GET /api/roles
        const response = await axiosClient.get<any>(ENDPOINT);

        // Xử lý data trả về (tùy theo cấu trúc BaseResponse của bạn)
        const resData = response as any;
        if (resData.data && resData.code) {
            return resData.data as RoleResponse[];
        }
        return resData as RoleResponse[];
    }
};