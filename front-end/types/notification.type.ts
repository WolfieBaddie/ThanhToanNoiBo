export interface AppNotification {
    notificationId: string;
    title: string;
    message: string;
    type: 'SUCCESS' | 'WARNING' | 'INFO' | 'ERROR' ;
    isRead: boolean;
    targetUrl?: string;
    createdAt: string;
}