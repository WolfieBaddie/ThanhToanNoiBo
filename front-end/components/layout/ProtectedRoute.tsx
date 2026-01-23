import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {UserRole} from "@/types/common.types";

interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
}

// [SỬA LỖI]: Thêm 'export' ở đây để biến nó thành Named Export
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    // 1. Chưa đăng nhập -> Đá về Login
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Kiểm tra quyền (Roles)
    if (allowedRoles && allowedRoles.length > 0) {
        const hasPermission = user.roles.some(role =>
            allowedRoles.includes(role as UserRole)
        );

        if (!hasPermission) {
            console.warn(`[ProtectedRoute] Access Denied. User: ${user.username}, Roles: ${user.roles}`);

            if (user.roles.includes(UserRole.MERCHANT)) {
                if (location.pathname === '/merchant/dashboard') return <div className="p-4 text-center">Bạn không có quyền truy cập.</div>;
                return <Navigate to="/merchant/dashboard" replace />;
            }

            if (location.pathname === '/dashboard') return <div className="p-4 text-center">Bạn không có quyền truy cập.</div>;
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <Outlet />;
};
