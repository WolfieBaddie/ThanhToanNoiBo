import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth.service';
import { LoginRequest, UserProfile } from '../types/auth.types';

interface AuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchUserProfile = async () => {
        try {
            const userData = await authService.getMe();
            if (!userData.roles) userData.roles = [];
            setUser(userData);
        } catch (error) {
            console.log("Phiên đăng nhập không tồn tại hoặc đã hết hạn.");
            setUser(null);
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const isLogout = localStorage.getItem('IS_LOGOUT');

            if (isLogout) {
                console.log('Phát hiện sự kiện Logout chủ động. Dừng check phiên.');
                localStorage.removeItem('IS_LOGOUT');
                setUser(null);
                setIsLoading(false);
                return;
            }

            // =======================================================
            // [FIX LỖI BỊ ĐÁ VĂNG KHỎI TRANG ĐĂNG KÝ]
            // Chặn không gọi API check session nếu đang ở trang Đăng ký/Quên Mật khẩu.
            // Tránh trường hợp API trả về 401 làm Axios Interceptor
            // tự động đá ngược về /login.
            // =======================================================
            const path = window.location.pathname.toLowerCase();
            if (path.includes('/register') || path.includes('/dang-ky') || path.includes('/forgot')) {
                setUser(null);
                setIsLoading(false);
                return;
            }

            try {
                await fetchUserProfile();
            } finally {
                setIsLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (credentials: LoginRequest) => {
        try {
            localStorage.removeItem('IS_LOGOUT');
            await authService.login(credentials);
            await fetchUserProfile();
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout({});
        } catch (error) {
            console.error("Logout error", error);
        } finally {
            localStorage.setItem('IS_LOGOUT', 'true');
            window.location.href = '/login';
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <div className="text-lg font-semibold text-gray-600">Đang tải dữ liệu...</div>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};