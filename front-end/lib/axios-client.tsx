import axios, {AxiosError} from 'axios';
import { storage } from '../utils/storage';

const BASE_URL = process.env.PUBLIC_API_URL || 'http://localhost:8080/api';

export const axiosClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

axiosClient.interceptors.response.use(
    (response) => {
        const apiResponse = response.data;

        // Trường hợp 1: HTTP 200 & Business Code 200 => Thành công
        if (response.status === 200 && apiResponse.code === 200) {
            // Trả về dữ liệu lõi (T) để Service/Component dùng luôn
            return apiResponse.data;
        }

        // Trường hợp 2: HTTP 200 nhưng Business Code lỗi (VD: code 400, message "Hết hàng")
        // Cần ném lỗi để nhảy vào catch của Component
        return Promise.reject(new AxiosError(
            apiResponse.message,
            String(apiResponse.code),
            response.config,
            response.request,
            response // Trả về nguyên response để component đọc được data
        ));
    },
    (error) => {
        // Trường hợp 3: HTTP Lỗi (400, 401, 500...) từ Backend (GlobalExceptionHandler trả về)
        const originalRequest = error.config;

        // Xử lý 401 (Hết hạn token) như cũ
        if (error.response?.status === 401) {
            if (originalRequest.url.includes('/auth/me') || originalRequest.url.includes('/profile')) {
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);