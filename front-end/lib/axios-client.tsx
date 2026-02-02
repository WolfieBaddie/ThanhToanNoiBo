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
        if (response.data instanceof Blob || response.config.responseType === 'blob') {
            return response.data;
        }
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

        // Log debug (Giữ nguyên để theo dõi)
        // console.log(`%c[Axios Error] Status: ${error.response?.status} | URL: ${originalRequest?.url}`, 'color: red; font-weight: bold');

        if (error.response?.status === 401 && !originalRequest._retry) {

            // Chặn Login/Refresh/Logout để tránh loop
            if (
                originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/refresh') ||
                originalRequest.url?.includes('/auth/logout')
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
                // console.log('%c[Auth] Token expired. Attempting refresh...', 'color: orange');
                await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
                // console.log('%c[Auth] Refresh Success! Retrying original request.', 'color: green');
                processQueue(null);
                return axiosClient(originalRequest);
            } catch (refreshError) {
                // console.error('%c[Auth] Refresh Failed! Session expired.', 'color: red');
                processQueue(refreshError, null);

                // [FIX QUAN TRỌNG NHẤT Ở ĐÂY]
                // Nếu đang ở trang login rồi thì KHÔNG redirect nữa để tránh vòng lặp reload vô tận
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);