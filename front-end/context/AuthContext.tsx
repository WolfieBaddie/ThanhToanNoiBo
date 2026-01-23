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

    // Hàm lấy thông tin user đầy đủ (từ /auth/me)
    const fetchUserProfile = async () => {
        try {
            const userData = await authService.getMe();
            // Đảm bảo roles luôn là mảng để tránh lỗi null khi check quyền
            if (!userData.roles) userData.roles = [];
            setUser(userData);
        } catch (error) {
            console.log("Phiên đăng nhập không tồn tại hoặc đã hết hạn.");
            setUser(null);
        }
    };

    useEffect(() => {
        const initAuth = async () => {
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
            // Bước 1: Gọi Login để lấy Token (Cookie)
            // Response login trả về user thiếu roles -> KHÔNG DÙNG ĐỂ SET STATE
            await authService.login(credentials);

            // Bước 2: Gọi ngay /auth/me để lấy User đầy đủ (có Roles)
            // Lúc này cookie đã được set bởi bước 1 nên request này sẽ hợp lệ
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
            setUser(null);
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