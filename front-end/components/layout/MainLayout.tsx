import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
    Menu,
    Bell,
    Search,
    Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotification';
import { AppNotification } from '@/types/notification.type';
import { GlobalNotificationProvider } from "@/context/GlobalNoticationContext";
import { UserRole } from "@/types/common.types";
import { Sidebar } from './Sidebar';
import { NotificationItem } from '../notification/NotificationItem'; // [MỚI] Import NotificationItem

interface MainLayoutProps {
    children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = () => {
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Notification Logic
    const notificationData = useNotifications();
    const { notifications, unreadCount, fetchNotifications, markRead, markAllRead } = notificationData;
    const [showNotiDropdown, setShowNotiDropdown] = useState(false);
    const notiRef = useRef<HTMLDivElement>(null);

    const isMerchant = user?.roles?.includes(UserRole.MERCHANT);

    const toggleNoti = () => {
        if (!showNotiDropdown) fetchNotifications();
        setShowNotiDropdown(!showNotiDropdown);
    };

    const handleNotiClick = (item: AppNotification) => {
        if (!item.isRead) markRead(item.notificationId);
        if (item.targetUrl) {
            navigate(item.targetUrl);
            setShowNotiDropdown(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
                setShowNotiDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="min-h-screen bg-app-bg dark:bg-slate-950 text-slate-900 dark:text-white font-sans transition-colors duration-300 flex">

            {/* Desktop Sidebar (z-20) */}
            <aside className="hidden lg:block w-[280px] h-screen sticky top-0 z-20">
                <Sidebar isOpen={true} onClose={() => {}} />
            </aside>

            {/* Mobile Sidebar (z-50) */}
            <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                {/* Drawer */}
                <div className={`absolute top-0 left-0 w-[280px] h-full bg-white shadow-2xl transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
                {/* Header (z-40) */}
                <header className="bg-app-bg/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex items-center justify-between transition-colors border-b border-transparent dark:border-slate-800/50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                        >
                            <Menu size={24} />
                        </button>

                        <div className="hidden md:flex items-center bg-white dark:bg-slate-800 border-none rounded-2xl px-4 py-2.5 w-80 transition-all focus-within:ring-2 focus-within:ring-primary dark:focus-within:ring-slate-700 shadow-sm">
                            <Search size={18} className="text-slate-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                        {/* --- NOTIFICATION BELL --- */}
                        <div className="relative" ref={notiRef}>
                            <button
                                onClick={toggleNoti}
                                className={`relative p-2.5 rounded-full transition-all shadow-sm ${showNotiDropdown ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400' : 'bg-white text-slate-500 hover:text-slate-900 dark:bg-slate-800 dark:hover:text-white'}`}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-slate-50 dark:border-slate-900 animate-in zoom-in duration-300">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {showNotiDropdown && (
                                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
                                        <h3 className="font-bold text-slate-800 dark:text-white">Thông báo</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={() => { markAllRead(); setShowNotiDropdown(false); }}
                                                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                                            >
                                                <Check size={14} />
                                                Đánh dấu đã đọc
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 bg-white dark:bg-slate-900">
                                        {notifications.length > 0 ? (
                                            notifications.map(item => (
                                                <NotificationItem
                                                    key={item.notificationId}
                                                    item={item}
                                                    onClick={() => handleNotiClick(item)}
                                                />
                                            ))
                                        ) : (
                                            <div className="p-10 text-center flex flex-col items-center text-slate-400">
                                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                                    <Bell size={24} className="opacity-50" />
                                                </div>
                                                <p className="text-sm font-medium">Không có thông báo nào</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3 bg-gray-50 dark:bg-slate-800 text-center border-t border-slate-100 dark:border-slate-800">
                                        <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">
                                            Xem tất cả
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Info Header */}
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700 h-8">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{user?.fullName || "Khách"}</p>
                                <p className="text-xs font-semibold text-slate-500 uppercase">{isMerchant ? "Đối tác" : (user?.studentCode || user?.username || "---")}</p>
                            </div>
                            <div className="p-0.5 rounded-full border-2 border-white dark:border-slate-700 shadow-sm cursor-pointer hover:border-indigo-200 transition-colors">
                                <img
                                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=random`}
                                    alt="Avatar"
                                    className="w-9 h-9 rounded-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth bg-transparent">
                    <div className="max-w-[1600px] mx-auto pb-10">
                        <GlobalNotificationProvider value={notificationData}>
                            <Outlet />
                        </GlobalNotificationProvider>
                    </div>
                </div>
            </main>
        </div>
    );
};