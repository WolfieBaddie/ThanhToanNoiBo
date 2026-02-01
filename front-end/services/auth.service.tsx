import { axiosClient } from '../lib/axios-client';
import {
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    LogoutRequest,
    UserProfile, RegisterRequest, GenerateOtpResponse, ForgotPasswordRequest
} from '../types/auth.types';

const ENDPOINT = '/auth';

export const authService = {
    /**
     * Đăng nhập
     */
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        // Thêm "as LoginResponse" để TypeScript hiểu đây là dữ liệu đã xử lý
        const response = await axiosClient.post<LoginResponse>(`${ENDPOINT}/login`, credentials);
        return response as unknown as LoginResponse;
    },

    /**
     * Đăng xuất
     */
    logout: async (request: LogoutRequest): Promise<void> => {
        await axiosClient.post(`${ENDPOINT}/logout`, request);
    },

    /**
     * Lấy thông tin user
     */
    getMe: async (): Promise<UserProfile> => {
        const response = await axiosClient.get<UserProfile>(`${ENDPOINT}/me`);
        return response as unknown as UserProfile;
    },

    /**
     * Refresh Token
     */
    refreshToken: async (request: RefreshTokenRequest): Promise<LoginResponse> => {
        const response = await axiosClient.post<LoginResponse>(`${ENDPOINT}/refresh`, request);
        return response as unknown as LoginResponse;
    },

    validateToken: async (): Promise<void> => {
        await axiosClient.get(`${ENDPOINT}/validate`);
    },

    register: async (data: RegisterRequest): Promise<LoginResponse> => {
        const response = await axiosClient.post<LoginResponse>(`${ENDPOINT}/register`, data);
        return response as unknown as LoginResponse;
    },

    sendRegisterOtp: async (email: string): Promise<GenerateOtpResponse> => {
        const response = await axiosClient.post<GenerateOtpResponse>(`${ENDPOINT}/register/send-otp`, { email });
        return response as unknown as GenerateOtpResponse;
    },

    sendForgotPasswordOtp: async (email: string): Promise<string> => {
        const response = await axiosClient.post<string>(`${ENDPOINT}/forgot-password/send-otp`, { email });
        return response as unknown as string;
    },

    /**
     * Submit Đổi mật khẩu
     * Backend trả về: BaseResponse<String> -> Interceptor bóc ra String
     */
    resetPassword: async (data: ForgotPasswordRequest): Promise<string> => {
        const response = await axiosClient.post<string>(`${ENDPOINT}/forgot-password`, data);
        return response as unknown as string;
    }
};