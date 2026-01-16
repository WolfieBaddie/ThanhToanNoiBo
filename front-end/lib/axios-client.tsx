import axios from 'axios';
import { storage } from '../utils/storage';

// Base URL nên lấy từ biến môi trường
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
        return response.data;
    },
    (error) => {
        // Lấy thông tin request gây ra lỗi
        const originalRequest = error.config;

        // Nếu lỗi 401 (Unauthorized)
        if (error.response?.status === 401) {

            // --- KHẮC PHỤC VÒNG LẶP TẠI ĐÂY ---
            // Nếu API bị lỗi chính là API lấy thông tin user (VD: '/auth/me', '/users/profile'...)
            // Thì KHÔNG ĐƯỢC redirect hay reload trang.
            // Hãy để AuthContext tự bắt lỗi và set user = null.
            if (originalRequest.url.includes('/auth/me') || originalRequest.url.includes('/profile')) {
                return Promise.reject(error);
            }

            // Với các API khác, có thể redirect về login hoặc logout
            // window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);