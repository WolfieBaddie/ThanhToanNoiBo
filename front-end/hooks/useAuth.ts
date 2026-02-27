// Trong file: src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { storage } from '../utils/storage';
import {
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    UpdateUserProfileRequest,
    UserProfile
} from '../types/auth.types';

export const useAuth = () => {
    // Khởi tạo state từ localStorage (nếu có) để giao diện hiển thị ngay lập tức
    const [user, setUser] = useState<UserProfile | null>(storage.getUser());
    const [isLoading, setIsLoading] = useState<boolean>(true); // Mặc định loading true để check auth

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Gọi API /me để lấy thông tin mới nhất từ Backend
                // Điều này cũng xác thực xem Token/Cookie còn hạn không
                const userData = await authService.getMe();

                setUser(userData);
                storage.setUser(userData); // Cập nhật lại localStorage cho đồng bộ
            } catch (err) {
                console.log("Session expired or invalid:", err);
                // Nếu gọi API lỗi (401 Unauthorized), nghĩa là token hết hạn
                await logout();
            } finally {
                setIsLoading(false);
            }
        };

        // Logic:
        // 1. Nếu chưa có user trong state (F5 trang) -> Gọi API check
        // 2. Nếu đã có user (navigating giữa các trang) -> Có thể không cần check lại liên tục để tối ưu,
        //    nhưng check lại thì an toàn hơn. Ở đây ta check nếu user null.
        if (!user) {
            checkAuth();
        } else {
            setIsLoading(false);
        }
    }, []); // Chạy 1 lần khi mount

    const login = async (credentials: LoginRequest) => {
        setIsLoading(true);
        try {
            const response = await authService.login(credentials);

            // Backend trả về UserInfo trong response.user (dựa theo AuthController của bạn)
            const userProfile = response.user;

            storage.setUser(userProfile);
            setUser(userProfile);
        } catch (err) {
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Gọi API để xóa HttpOnly Cookie phía server
            await authService.logout({});
        } catch (e) {
            console.error("Logout error", e);
        } finally {
            // Xóa data phía client bất kể API thành công hay thất bại
            storage.clearUser();
            setUser(null);
            // Có thể redirect về login hoặc reload trang
            window.location.href = '/login';
        }
    };

    const sendOtp = async (email: string) => {
        // Không set isLoading toàn cục để tránh block UI nếu user đang nhập liệu
        return await authService.sendRegisterOtp(email);
    };

    const register = async (data: RegisterRequest) => {
        setIsLoading(true);
        try {
            await authService.register(data);
        } catch (err) {
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const requestPasswordResetOtp = async (email: string) => {
        // Không cần try-catch ở đây để lỗi bắn ra cho UI xử lý hiển thị
        return await authService.sendForgotPasswordOtp(email);
    };

    // [MỚI] Xác nhận đổi mật khẩu
    const submitResetPassword = async (data: ForgotPasswordRequest) => {
        setIsLoading(true);
        try {
            return await authService.resetPassword(data);
        } catch (err) {
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (data: UpdateUserProfileRequest) => {
        setIsLoading(true);
        try {
            // 1. Gọi API cập nhật
            const updatedUser = await userService.updateProfile(data);

            // 2. Cập nhật lại State và LocalStorage để UI thay đổi ngay lập tức
            setUser(updatedUser);
            storage.setUser(updatedUser);

            return updatedUser;
        } catch (err) {
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // [MỚI] Hàm refresh thông tin user (khi cần lấy dữ liệu mới nhất từ server)
    const refreshProfile = async () => {
        try {
            const userData = await userService.getMyDetail();
            setUser(userData);
            storage.setUser(userData);
        } catch (e) {
            console.error("Failed to refresh profile", e);
        }
    };

    return {
        user,
        isLoading,
        login,
        logout,
        register,
        sendOtp,
        requestPasswordResetOtp,
        submitResetPassword,
        updateProfile,
        refreshProfile
    };
};