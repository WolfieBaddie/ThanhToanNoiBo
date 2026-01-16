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
    // isLoading này CHỈ dành cho việc check session lần đầu khi F5
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const userData = await authService.getMe();
                setUser(userData);
            } catch (error) {
                // Khi API /me trả về 401, nó sẽ nhảy vào đây.
                // Chúng ta chỉ cần set User = null để App hiểu là "Chưa đăng nhập"
                // Tuyệt đối KHÔNG gọi window.location.reload() ở đây
                console.log("Phiên đăng nhập không tồn tại hoặc đã hết hạn.");
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    // Login function
    const login = async (credentials: LoginRequest) => {
        // --- SỬA LỖI TẠI ĐÂY ---
        // KHÔNG set setIsLoading(true) ở đây.
        // Hãy để AuthPage tự xử lý loading của nút bấm (disabled button).

        try {
            const response = await authService.login(credentials);
            console.log("Login Response Data:", response);
            // Cập nhật User -> App sẽ tự động chuyển hướng nhờ logic trong App.tsx
            setUser(response);
        } catch (error) {
            throw error; // Ném lỗi ra để AuthPage hiển thị alert
        }
    };

    // Logout function
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

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout
    };

    // Màn hình chờ CHỈ hiện ra khi đang check session lần đầu (F5)
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <div className="text-lg font-semibold text-gray-600">Đang khởi động ứng dụng...</div>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
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