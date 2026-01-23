import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import {
    LayoutDashboard,
    Wallet,
    UtensilsCrossed,
    History,
    Settings,
    LogOut,
    Menu,
    Bell,
    Search,
    X,
    TicketPercent,
    CheckCircle2,
    AlertTriangle,
    Info,
    Check,
    ClipboardList, // Icon đơn hàng
    BarChart3,     // Icon báo cáo
    Store          // Icon cửa hàng
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotification';
import { AppNotification } from '@/types/notification.type';
import { GlobalNotificationProvider } from "@/context/GlobalNoticationContext";
import {UserRole} from "@/types/common.types";

interface MainLayoutProps {
    children?: React.ReactNode;
    // user & onLogout lấy từ useAuth() nên không cần truyền props, nhưng giữ lại nếu bạn muốn flexible
}

// Sub-component NotificationItem (Giữ nguyên)
const NotificationItem: React.FC<{ item: AppNotification; onClick: () => void }> = ({ item, onClick }) => {
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

export const MainLayout: React.FC = () => {
    const { user, logout } = useAuth(); // Lấy trực tiếp từ Context
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const notificationData = useNotifications();
    const {
        notifications,
        unreadCount,
        fetchNotifications,
        markRead,
        markAllRead
    } = notificationData;

    const [showNotiDropdown, setShowNotiDropdown] = useState(false);
    const notiRef = useRef<HTMLDivElement>(null);

    // --- CẤU HÌNH MENU ---
    // Menu cho USER (Học sinh/Giáo viên)
    const userNavItems = [
        { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { id: 'wallet', label: 'Ví & Nạp tiền', icon: <Wallet size={20} />, path: '/wallet' },
        { id: 'voucher', label: 'Kho Voucher', icon: <TicketPercent size={20} />, path: '/voucher' },
        { id: 'services', label: 'Dịch vụ & Món', icon: <UtensilsCrossed size={20} />, path: '/menu' },
        { id: 'history', label: 'Lịch sử GD', icon: <History size={20} />, path: '/history' },
        { id: 'settings', label: 'Cài đặt', icon: <Settings size={20} />, path: '/settings' },
    ];

    // Menu cho MERCHANT (Chủ quầy)
    const merchantNavItems = [
        { id: 'm-dashboard', label: 'Tổng quan Quầy', icon: <LayoutDashboard size={20} />, path: '/merchant/dashboard' },
        // { id: 'm-services', label: 'Quản lý Dịch vụ', icon: <Store size={20} />, path: '/merchant/services' },
        // { id: 'm-orders', label: 'Lịch sử Đơn', icon: <ClipboardList size={20} />, path: '/merchant/orders' },
        // { id: 'm-reports', label: 'Báo cáo', icon: <BarChart3 size={20} />, path: '/merchant/reports' },
        // { id: 'm-settings', label: 'Cài đặt', icon: <Settings size={20} />, path: '/merchant/settings' },
    ];

    // --- LOGIC CHỌN MENU ---
    const isMerchant = user?.roles?.includes(UserRole.MERCHANT);
    const navItems = isMerchant ? merchantNavItems : userNavItems;

    // Logic toggle notification
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

    const isActive = (path: string) => {
        if (path === '/dashboard' && location.pathname === '/') return true;
        if (location.pathname === path) return true;
        // Logic active thông minh hơn cho nested routes
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-colors">
            <div className="p-8 pb-8 flex items-center justify-between">
                <Logo className="text-slate-900 dark:text-white" />
                {/* Badge Role cho Merchant */}
                {isMerchant && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-600 text-[10px] font-bold rounded uppercase border border-orange-200">
                        Merchant
                    </span>
                )}
                <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 px-6 space-y-2 py-4 overflow-y-auto">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                navigate(item.path);
                                setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-start px-5 py-4 rounded-2xl transition-all font-bold text-sm group ${
                                active
                                    ? 'bg-primary text-slate-900 shadow-md shadow-lime-200/50'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                            }`}
                        >
                            <span className={`mr-3 ${active ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-5 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors font-bold text-sm"
                >
                    <LogOut size={20} />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-app-bg dark:bg-slate-950 text-slate-900 dark:text-white font-sans transition-colors duration-300 flex">
            {/* Desktop Sidebar (z-20) */}
            <aside className="hidden lg:block w-[280px] h-screen sticky top-0 z-20">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar (z-50) */}
            <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
                <div
                    className={`absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                />
                <div className={`absolute top-0 left-0 w-[280px] h-full bg-white shadow-2xl transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <SidebarContent />
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

                        {/* User Info */}
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