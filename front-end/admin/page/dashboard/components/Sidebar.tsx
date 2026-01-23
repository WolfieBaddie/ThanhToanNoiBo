import type { FC } from 'react';
import { useAuth } from '@/hooks/useAuth'; // 1. Import Hook Auth
import {
    LayoutDashboard, Users, ShoppingBag, ClipboardList,
    BarChart3, Settings, LogOut, User
} from 'lucide-react'; // Import icons cho đẹp hơn

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const Sidebar: FC<SidebarProps> = ({ activeTab, onTabChange }) => {
    // 2. Lấy user và hàm logout từ Hook
    const { user, logout } = useAuth();

    // Cập nhật icon cho menu items
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20}/>, count: null },
        { id: 'users', label: 'Users', icon: <Users size={20}/>, count: 12 },
        { id: 'services', label: 'Services', icon: <ShoppingBag size={20}/>, count: 45 },
        { id: 'orders', label: 'Orders', icon: <ClipboardList size={20}/>, count: 45 },
        { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20}/>, count: null },
        { id: 'settings', label: 'Settings', icon: <Settings size={20}/>, count: null },
    ];

    return (
        <div className="w-64 lg:w-72 bg-black/30 backdrop-blur-2xl border-r border-white/10 flex flex-col h-screen">
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center space-x-3 animate-slideRight">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xl animate-pulse shadow-lg shadow-purple-500/20">
                        🌌
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            GalaxyPay
                        </h1>
                        <p className="text-xs text-white/60">Admin Dashboard</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                {menuItems.map((item, index) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`cursor-pointer w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 transform hover:translate-x-1 ${
                            activeTab === item.id
                                ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-white shadow-lg shadow-purple-500/10'
                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex items-center space-x-3">
                            <span className={activeTab === item.id ? "text-purple-400" : ""}>{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </div>
                        {item.count !== null && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full min-w-[24px] text-center ${
                                activeTab === item.id
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-white/10 text-white/60'
                            }`}>
                {item.count}
              </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-white/10 space-y-3 bg-black/20">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            {/* Hiển thị Avatar thật hoặc Placeholder */}
                            {user?.imageUrl ? (
                                <img src={user.imageUrl} alt={user.fullName} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold">
                                    {user?.fullName?.charAt(0).toUpperCase() || <User size={18}/>}
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1a1a1a]"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-sm truncate">
                                {user?.fullName || 'Admin User'}
                            </h4>
                            <p className="text-xs text-white/50 truncate">
                                {user?.email || 'admin@galaxypay.edu'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Gọi hàm logout thật */}
                <button
                    onClick={logout}
                    className="cursor-pointer w-full p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                    <LogOut size={16} className="group-hover:-translate-x-1 transition-transform"/>
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;