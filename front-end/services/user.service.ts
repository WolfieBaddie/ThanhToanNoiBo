import { axiosClient } from '../lib/axios-client';
import {UpdateUserProfileRequest, UserProfile} from "@/types/auth.types";


const ENDPOINT = '/users';

export const userService = {
    /**
     * Lấy chi tiết user hiện tại (đầy đủ roles, permissions)
     * API: GET /api/users/detail
     */
    getMyDetail: async (): Promise<UserProfile> => {
        const response = await axiosClient.get<UserProfile>(`${ENDPOINT}/detail`);
        return response as unknown as UserProfile;
    },

    /**
     * Cập nhật thông tin cá nhân
     * API: PUT /api/users/me
     */
    updateProfile: async (data: UpdateUserProfileRequest): Promise<UserProfile> => {
        const response = await axiosClient.put<UserProfile>(`${ENDPOINT}/me`, data);
        return response as unknown as UserProfile;
    }
};