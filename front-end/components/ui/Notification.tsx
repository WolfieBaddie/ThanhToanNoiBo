import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  type: NotificationType;
  message: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  isOpen,
  onClose,
}) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Increased duration slightly for reading longer messages
      return () => clearTimeout(timer);
    } else {
      // Allow animation to finish before unmounting
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isRendered) return null;

  const config = {
    success: {
      icon: <CheckCircle2 size={24} className="stroke-[3px]" />,
      bgIcon: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
      shadowColor: 'shadow-emerald-500/20',
      title: 'Thành công!',
    },
    error: {
      icon: <XCircle size={24} className="stroke-[3px]" />,
      bgIcon: 'bg-gradient-to-br from-red-400 to-red-600',
      shadowColor: 'shadow-red-500/20',
      title: 'Đã có lỗi xảy ra',
    },
    info: {
      icon: <AlertCircle size={24} className="stroke-[3px]" />,
      bgIcon: 'bg-gradient-to-br from-blue-400 to-blue-600',
      shadowColor: 'shadow-blue-500/20',
      title: 'Thông báo',
    }
  };

  const current = config[type];

  return (
    <div className={`fixed top-6 right-6 z-[100] flex flex-col gap-2 transition-all duration-300 ease-out transform ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-1 flex items-stretch min-w-[320px] max-w-sm overflow-hidden backdrop-blur-xl">
        
        {/* Colorful Icon Bar */}
        <div className={`${current.bgIcon} ${current.shadowColor} w-14 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0`}>
          {current.icon}
        </div>

        {/* Content */}
        <div className="flex-1 py-3 px-4 flex flex-col justify-center min-h-[80px]">
          <h4 className="font-bold text-slate-800 text-base leading-tight mb-1">{current.title}</h4>
          <div className="text-slate-500 text-sm font-medium leading-relaxed">
            {message}
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="self-start mt-2 mr-2 text-slate-300 hover:text-slate-500 hover:bg-slate-100 p-1 rounded-full transition-colors shrink-0"
        >
          <X size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};