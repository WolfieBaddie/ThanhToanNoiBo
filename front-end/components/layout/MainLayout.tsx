import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom'; // Import mới
import { LayoutDashboard, Wallet, UtensilsCrossed, History, Settings, LogOut } from 'lucide-react';
// ... imports UI components (Header, Sidebar...)

interface MainLayoutProps {
    children?: React.ReactNode;
    user: any;
    onLogout: () => void;
    // Bỏ currentTab và onChangeTab cũ
}

export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Mapping đường dẫn URL với tab để highlight
    const getActiveTab = (path: string) => {
        if (path.includes('/dashboard')) return 'dashboard';
        if (path.includes('/wallet')) return 'wallet';
        if (path.includes('/menu')) return 'menu';
        if (path.includes('/history')) return 'history';
        if (path.includes('/settings')) return 'settings';
        return 'dashboard';
    };

    const activeTab = getActiveTab(location.pathname);

    // Hàm điều hướng mới
    const handleNavigate = (key: string) => {
        navigate(`/${key}`);
    };

    const menuItems = [
        { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'wallet', label: 'Ví & Nạp tiền', icon: Wallet },
        { id: 'menu', label: 'Thực đơn', icon: UtensilsCrossed },
        { id: 'history', label: 'Lịch sử', icon: History },
        { id: 'settings', label: 'Cài đặt', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            {/* SIDEBAR */}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-colors duration-300">
                <div className="p-6 flex items-center gap-3">
                    {/* Logo... */}
                    <span className="font-bold text-xl text-slate-800 dark:text-white">Swallet</span>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {menuItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavigate(item.id)} // Dùng navigate thay vì onChangeTab
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400'
                                }`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-700">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                    >
                        <LogOut size={20} />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize">
                        {menuItems.find(i => i.id === activeTab)?.label}
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{user?.fullName || 'User'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.username}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold">
                            {user?.fullName?.charAt(0) || 'U'}
                        </div>
                    </div>
                </header>

                <div className="p-4 sm:p-6 lg:p-8">
                    {/* Thay vì render {children}, ta dùng <Outlet /> của Router */}
                    <Outlet />
                </div>
            </main>

            {/* MOBILE BOTTOM NAV (Nếu có) */}
            {/* Logic tương tự: activeTab check location, onClick gọi navigate */}
        </div>
    );
};