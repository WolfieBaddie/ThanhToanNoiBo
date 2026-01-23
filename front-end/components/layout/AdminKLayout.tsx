import React from 'react';
import { Outlet } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotification';
import { GlobalNotificationProvider } from "@/context/GlobalNoticationContext";

export const AdminLayout: React.FC = () => {
    // 1. Kế thừa logic Notification từ MainLayout
    const notificationData = useNotifications();

    return (
        // 2. Wrap Provider để các trang con (AdminDashboard) có thể dùng context thông báo
        <GlobalNotificationProvider value={notificationData}>
            {/* 3. Render nội dung trang con (AdminDashboard) */}
            {/* Không thêm div wrapper hay class style nào, để AdminDashboard tự quyết định giao diện */}
            <Outlet />
        </GlobalNotificationProvider>
    );
};