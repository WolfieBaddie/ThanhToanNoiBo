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
            // [FIX QUAN TRỌNG] Kiểm tra xem có phải user vừa bấm Logout không
            const isLogout = localStorage.getItem('IS_LOGOUT');

            if (isLogout) {
                console.log('Phát hiện sự kiện Logout chủ động. Dừng check phiên.');
                // Xóa cờ để lần sau F5 nó lại check bình thường
                localStorage.removeItem('IS_LOGOUT');

                // Set user = null và dừng loading ngay lập tức
                setUser(null);
                setIsLoading(false);
                return; // RETURN NGAY TẠI ĐÂY, KHÔNG GỌI fetchUserProfile() NỮA
            }

            // Nếu không phải Logout thì mới gọi API check phiên
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
            // [FIX] Xóa cờ logout nếu có để đảm bảo đăng nhập được
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
            // Dự phòng cho trường hợp gọi logout từ nơi khác ngoài Sidebar
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