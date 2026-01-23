import axios, { AxiosError } from 'axios';

const BASE_URL = 'http://localhost:8080/api';

export const axiosClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

axiosClient.interceptors.response.use(
    (response) => {
        const apiResponse = response.data;
        if (response.status === 200 && apiResponse.code === 200) {
            return apiResponse.data;
        }
        return Promise.reject(new AxiosError(
            apiResponse.message,
            String(apiResponse.code),
            response.config,
            response.request,
            response
        ));
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Xử lý 401
        if (error.response?.status === 401 && !originalRequest._retry) {

            // [FIX QUAN TRỌNG]: Nếu lỗi 401 xảy ra khi đang check login (/me)
            // hoặc đang login/refresh -> KHÔNG làm gì cả, trả lỗi về luôn để AuthContext xử lý.
            // Tránh vòng lặp reload trang vô tận.
            if (
                originalRequest.url?.includes('/auth/me') ||
                originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/refresh')
            ) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => axiosClient(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
                processQueue(null);
                return axiosClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Nếu refresh thất bại, điều hướng về login (nhưng không reload nếu không cần thiết)
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);