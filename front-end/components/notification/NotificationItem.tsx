import React from 'react';
import { CheckCircle2, AlertTriangle, Info, Check, X } from 'lucide-react';
import { AppNotification } from '@/types/notification.type';

interface NotificationItemProps {
    item: AppNotification;
    onClick: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ item, onClick }) => {
    let Icon = Info;
    let iconColorClass = "text-blue-500 bg-blue-50 dark:bg-blue-900";

    if (item.type === 'SUCCESS') {
        Icon = CheckCircle2;
        iconColorClass = "text-emerald-500 bg-emerald-50 dark:bg-emerald-900";
    } else if (item.type === 'WARNING') {
        Icon = AlertTriangle;
        iconColorClass = "text-orange-500 bg-orange-50 dark:bg-orange-900";
    } else if (item.type === 'ERROR') {
        Icon = X;
        iconColorClass = "text-red-500 bg-red-50 dark:bg-red-900";
    }

    return (
        <div
            onClick={onClick}
            className={`p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group 
            ${!item.isRead
                ? 'bg-indigo-50 dark:bg-slate-800'
                : 'bg-white dark:bg-slate-900'
            }`}
        >
            <div className="flex gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconColorClass}`}>
                    <Icon size={18} />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-0.5">
                        <h4 className={`text-sm ${!item.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                            {item.title}
                        </h4>
                        {!item.isRead && <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shadow-sm"></span>}
                    </div>
                    <p className={`text-xs ${!item.isRead ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-500'} line-clamp-2 leading-relaxed`}>
                        {item.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                        {new Date(item.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
};