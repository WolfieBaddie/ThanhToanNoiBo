import { useState, useEffect, useCallback } from 'react';
import { AppNotification } from '@/types/notification.type';
import {notificationService} from "@/services/notifcation.service.ts";

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Hàm lấy số lượng chưa đọc
    const fetchUnreadCount = useCallback(async () => {
        try {
            const count = await notificationService.getUnreadCount();
            // Đôi khi backend trả về object { data: 5 } hoặc số 5 trần
            // Cần ép kiểu an toàn
            setUnreadCount(Number(count) || 0);
        } catch (error) {
            console.error("Failed to fetch unread count", error);
        }
    }, []);

    // Hàm lấy danh sách thông báo (Refactor theo style useTransaction)
    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);

        // [DEBUG] Log giống useTransaction để dễ theo dõi
        console.groupCollapsed('%c🔔 [useNotifications] Fetching...', 'color: cyan;');

        try {
            let data = await notificationService.getMyNotifications(0, 10);

            // [FIX QUAN TRỌNG]: Xử lý trường hợp Backend trả về String JSON (lỗi Double-Serialized)
            if (typeof data === 'string') {
                try {
                    console.warn("API returned string, parsing manually...");
                    data = JSON.parse(data);
                    // Nếu sau khi parse nó vẫn bọc trong 1 lớp 'data' hoặc 'result' nữa thì unwrap tiếp
                    // @ts-ignore
                    if (data.data && !data.items) data = data.data;
                } catch (e) {
                    console.error("JSON Parse error:", e);
                }
            }

            console.log("%c✅ Notification Response:", 'color: green;', data);

            // [CHECK AN TOÀN] Giống useTransaction
            if (data && Array.isArray(data.items)) {
                setNotifications(data.items);
            } else {
                console.warn("%c⚠️ Structure mismatch:", 'color: orange;', data);
                setNotifications([]); // Fallback mảng rỗng để không lỗi map
            }

        } catch (error: any) {
            console.error("%c❌ Error:", 'color: red;', error);
        } finally {
            setIsLoading(false);
            console.groupEnd();
        }
    }, []);

    // Hàm xử lý khi người dùng click vào 1 thông báo
    const markRead = useCallback(async (notificationId: string) => {
        try {
            // Optimistic UI Update
            setNotifications(prev =>
                prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            await notificationService.markAsRead(notificationId);
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    }, []);

    // Hàm đánh dấu tất cả đã đọc
    const markAllRead = useCallback(async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            await notificationService.markAllAsRead();
        } catch (error) {
            console.error("Failed to mark all read", error);
        }
    }, []);

    // Init
    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    return {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markRead,
        markAllRead,
        refetchCount: fetchUnreadCount // Expose thêm để gọi khi cần
    };
};