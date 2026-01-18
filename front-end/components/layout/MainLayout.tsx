import React, { useState } from 'react';
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
    TicketPercent
} from 'lucide-react';

interface MainLayoutProps {
    children?: React.ReactNode;
    user?: any;
    onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { id: 'wallet', label: 'Ví & Nạp tiền', icon: <Wallet size={20} />, path: '/wallet' },
        { id: 'voucher', label: 'Voucher', icon: <TicketPercent size={20} />, path: '/voucher' },
        { id: 'services', label: 'Dịch vụ', icon: <UtensilsCrossed size={20} />, path: '/menu' },
        { id: 'history', label: 'Lịch sử GD', icon: <History size={20} />, path: '/history' },
        { id: 'settings', label: 'Cài đặt', icon: <Settings size={20} />, path: '/settings' },
    ];

    // [YÊU CẦU 3] Logic kiểm tra Active Sidebar cải tiến
    const isActive = (path: string) => {
        // Trang chủ
        if (path === '/dashboard' && location.pathname === '/') return true;

        // Kiểm tra chính xác
        if (location.pathname === path) return true;

        // Kiểm tra trang con (Nested routes)
        // Ví dụ: path là '/wallet', hiện tại là '/payment/topup' -> vẫn cho active 'Ví'
        if (path === '/wallet' && location.pathname.startsWith('/payment')) return true;
        if (path === '/history' && location.pathname.startsWith('/transactions')) return true;

        // Default: startsWith cho các trường hợp menu đơn giản khác
        return location.pathname.startsWith(path);
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-colors">
            <div className="p-8 pb-8 flex items-center justify-between">
                <Logo className="text-slate-900 dark:text-white" />
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
                    onClick={onLogout}
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
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-[280px] h-screen sticky top-0 z-20">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
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
                {/* Header */}
                <header className="bg-app-bg/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-10 px-6 py-4 flex items-center justify-between transition-colors">
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
                        <button className="relative p-2.5 bg-white rounded-full text-slate-500 hover:text-slate-900 dark:bg-slate-800 dark:hover:text-white transition-colors shadow-sm">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.fullName || "Nguyễn Văn A"}</p>
                                <p className="text-xs font-semibold text-slate-500">{user?.studentCode || "HS2024"}</p>
                            </div>
                            <div className="p-0.5 rounded-full border-2 border-white shadow-sm">
                                <img
                                    src={user?.avatar || "https://picsum.photos/100/100?random=1"}
                                    alt="Avatar"
                                    className="w-9 h-9 rounded-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
                    <div className="max-w-[1600px] mx-auto pb-10">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};