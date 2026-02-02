import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface AdminNotificationProps {
    isOpen: boolean;
    type: NotificationType;
    message: string;
    onClose: () => void;
    duration?: number;
}

export const AdminNotification: React.FC<AdminNotificationProps> = ({
                                                                        isOpen,
                                                                        type,
                                                                        message,
                                                                        onClose,
                                                                        duration = 3000
                                                                    }) => {
    // Auto-close logic
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose, duration]);

    if (!isOpen) return null;

    // Cấu hình giao diện (Sử dụng màu nền đặc và viền rõ hơn)
    const config = {
        success: {
            icon: CheckCircle,
            title: 'Success',
            color: 'text-emerald-400',
            iconBg: 'bg-emerald-500/20', // Nền icon đậm hơn chút
            border: 'border-emerald-500/50', // Viền sáng hơn
            glow: 'shadow-emerald-500/10' // Glow nhẹ
        },
        error: {
            icon: AlertCircle,
            title: 'Error',
            color: 'text-red-400',
            iconBg: 'bg-red-500/20',
            border: 'border-red-500/50',
            glow: 'shadow-red-500/10'
        },
        warning: {
            icon: AlertTriangle,
            title: 'Warning',
            color: 'text-amber-400',
            iconBg: 'bg-amber-500/20',
            border: 'border-amber-500/50',
            glow: 'shadow-amber-500/10'
        },
        info: {
            icon: Info,
            title: 'Information',
            color: 'text-blue-400',
            iconBg: 'bg-blue-500/20',
            border: 'border-blue-500/50',
            glow: 'shadow-blue-500/10'
        },
    }[type];

    const Icon = config.icon;

    return (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
            {/* [FIX UI]
                - bg-[#181825]: Màu nền rất tối và ĐẶC (không trong suốt) để che nội dung bên dưới.
                - border-l-4: Thêm viền trái dày màu đặc trưng để dễ nhận diện loại thông báo.
                - shadow-xl: Bóng đổ sâu để nổi lên trên các layer khác.
            */}
            <div className={`flex items-start gap-4 px-5 py-4 rounded-lg border border-white/10 border-l-4 min-w-[340px] max-w-[420px] shadow-xl
                bg-[#181825] ${config.border} ${config.glow}`}
            >
                {/* Icon Section */}
                <div className={`mt-0.5 p-2 rounded-full ${config.iconBg} ${config.color}`}>
                    <Icon size={20} />
                </div>

                {/* Content Section */}
                <div className="flex-1 pt-0.5">
                    <h4 className={`text-base font-bold ${config.color} leading-none mb-1.5`}>
                        {config.title}
                    </h4>
                    <p className="text-sm text-white/90 leading-relaxed font-medium">
                        {message}
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="p-1.5 -mr-2 -mt-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};