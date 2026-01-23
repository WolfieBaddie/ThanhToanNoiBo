import { axiosClient } from '@/lib/axios-client';
import { PageResponse } from '@/types/voucher.type'; // Tận dụng PageResponse
import { AppNotification } from '@/types/notification.type';

export const notificationService = {
    getMyNotifications: async (page = 0, size = 10) => {
        const res = await axiosClient.get<PageResponse<AppNotification>>('/notifications', { params: { page, size } });
        return res as unknown as PageResponse<AppNotification>;
    },
    getUnreadCount: async () => {
        const res = await axiosClient.get<number>('/notifications/unread-count');
        return res as unknown as number;
    },
    markAsRead: async (id: string) => {
        await axiosClient.put(`/notifications/${id}/read`);
    },
    markAllAsRead: async () => {
        await axiosClient.put(`/notifications/read-all`);
    }
};