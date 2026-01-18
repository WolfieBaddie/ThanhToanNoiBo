import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification, NotificationType } from '@/components/ui/Notification'; // Đường dẫn tới file Notification.tsx của bạn

interface NotificationContextType {
    showNotification: (type: NotificationType, message: React.ReactNode) => void;
    success: (message: React.ReactNode) => void;
    error: (message: React.ReactNode) => void;
    info: (message: React.ReactNode) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<NotificationType>('info');
    const [message, setMessage] = useState<React.ReactNode>('');

    const showNotification = useCallback((type: NotificationType, message: React.ReactNode) => {
        setType(type);
        setMessage(message);
        setIsOpen(true);
    }, []);

    const closeNotification = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Các hàm helper gọi nhanh
    const success = (msg: React.ReactNode) => showNotification('success', msg);
    const error = (msg: React.ReactNode) => showNotification('error', msg);
    const info = (msg: React.ReactNode) => showNotification('info', msg);

    return (
        <NotificationContext.Provider value={{ showNotification, success, error, info }}>
            {children}

            {/* Render component Notification ở cấp cao nhất */}
            <Notification
                isOpen={isOpen}
                onClose={closeNotification}
                type={type}
                message={message}
            />
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};