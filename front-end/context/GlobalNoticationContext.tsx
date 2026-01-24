import React, { createContext, useContext } from 'react';
import { AppNotification } from '@/types/notification.type';

// Định nghĩa kiểu dữ liệu giống hệt những gì hook useNotifications trả về
interface GlobalNotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    isLoading: boolean;
    fetchNotifications: () => Promise<void>;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    refetchCount: () => Promise<void>; // Hàm quan trọng để cập nhật số trên chuông
}

const GlobalNotificationContext = createContext<GlobalNotificationContextType | undefined>(undefined);

export const useGlobalNotification = () => {
    const context = useContext(GlobalNotificationContext);
    if (!context) {
        throw new Error("useGlobalNotification must be used within GlobalNotificationProvider (located in MainLayout)");
    }
    return context;
};

// Component Provider này chỉ dùng để bọc Context, không chứa logic (logic vẫn nằm ở hook cũ)
export const GlobalNotificationProvider: React.FC<{
    value: GlobalNotificationContextType;
    children: React.ReactNode;
}> = ({ value, children }) => {
    return (
        <GlobalNotificationContext.Provider value={value}>
            {children}
        </GlobalNotificationContext.Provider>
    );
};
