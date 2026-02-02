import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    UtensilsCrossed,
    History,
    Settings,
    LogOut,
    TicketPercent,
    X,
    ClipboardList,
    BarChart3,
    Store
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from "@/types/common.types";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // --- CẤU HÌNH MENU ---
    const userNavItems = [
        { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { id: 'wallet', label: 'Ví & Nạp tiền', icon: <Wallet size={20} />, path: '/wallet' },
        { id: 'voucher', label: 'Kho Voucher', icon: <TicketPercent size={20} />, path: '/voucher' },
        { id: 'services', label: 'Dịch vụ & Món', icon: <UtensilsCrossed size={20} />, path: '/menu' },
        { id: 'history', label: 'Lịch sử GD', icon: <History size={20} />, path: '/history' },
        { id: 'settings', label: 'Cài đặt', icon: <Settings size={20} />, path: '/settings' },
    ];

    const merchantNavItems = [
        { id: 'm-dashboard', label: 'Tổng quan Quầy', icon: <LayoutDashboard size={20} />, path: '/merchant/dashboard' },
        { id: 'm-services', label: 'Quản lý Dịch vụ', icon: <Store size={20} />, path: '/merchant/services' },
        { id: 'm-orders', label: 'Lịch sử Đơn', icon: <ClipboardList size={20} />, path: '/merchant/orders' },
        { id: 'm-reports', label: 'Báo cáo', icon: <BarChart3 size={20} />, path: '/merchant/request' },
        { id: 'm-settings', label: 'Cài đặt', icon: <Settings size={20} />, path: '/merchant/settings' },

    ];

    // --- LOGIC CHỌN MENU ---
    const isMerchant = user?.roles?.includes(UserRole.MERCHANT);
    const navItems = isMerchant ? merchantNavItems : userNavItems;

    // Helper kiểm tra active route
    const isActive = (path: string) => {
        if (path === '/dashboard' && location.pathname === '/') return true;
        if (location.pathname === path) return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        onClose(); // Đóng sidebar trên mobile sau khi click
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-colors">
            {/* Header Sidebar */}
            <div className="p-8 pb-8 flex items-center justify-between">
                <Logo className="text-slate-900 dark:text-white" />

                {/* Badge Role cho Merchant */}
                {isMerchant && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-600 text-[10px] font-bold rounded uppercase border border-orange-200">
                        Merchant
                    </span>
                )}

                {/* Nút đóng (chỉ hiện trên Mobile) */}
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 px-6 space-y-2 py-4 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item.path)}
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

            {/* Footer Sidebar (Logout) */}
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
};