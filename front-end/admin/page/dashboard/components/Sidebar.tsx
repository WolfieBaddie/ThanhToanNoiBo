import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    LayoutDashboard, Users, ShoppingBag, ClipboardList,
    FileText, Settings, LogOut, User
} from 'lucide-react';

import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { useAdminTransactions } from '@/hooks/admin/useAdminTransaction';
import { useAdminRequest } from '@/hooks/admin/useAdminRequest';
import { adminCatalogService } from '@/services/admin/admin.catalog.service';
import { authService } from '@/services/auth.service'; // Import Service trực tiếp

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const Sidebar: FC<SidebarProps> = ({ activeTab, onTabChange }) => {
    // Chỉ lấy thông tin user để hiển thị, KHÔNG lấy hàm logout từ context
    const { user } = useAuth();

    // --- LẤY DỮ LIỆU THỐNG KÊ ---
    const { totalItems: totalUsers } = useAdminUsers(1);
    const { totalItems: totalOrders } = useAdminTransactions({ page: 0, size: 1 });
    const { pagination } = useAdminRequest();
    const totalRequests = pagination.totalElements;
    const [totalCatalog, setTotalCatalog] = useState(0);

    useEffect(() => {
        const fetchCatalogCounts = async () => {
            try {
                const [servicesRes, packagesRes] = await Promise.all([
                    adminCatalogService.getMasterServices({ page: 0, size: 1, keyword: '' }),
                    adminCatalogService.getPackages({ page: 0, size: 1, keyword: '' })
                ]);
                const sCount = servicesRes.totalItems || 0;
                const pCount = packagesRes.totalItems || 0;
                setTotalCatalog(sCount + pCount);
            } catch (error) {
                console.error("Failed to fetch catalog counts", error);
            }
        };
        fetchCatalogCounts();
    }, []);

    // --- HÀM XỬ LÝ LOGOUT ---
    const handleLogout = async () => {
        try {
            // 1. Gọi API báo server xóa cookie (nếu server cấu hình đúng path)
            await authService.logout({});
        } catch (error) {
            console.warn("Logout API warning:", error);
        } finally {
            // [QUAN TRỌNG NHẤT] Đặt cờ đánh dấu là User chủ động Logout
            localStorage.setItem('IS_LOGOUT', 'true');

            // 2. Ép trình duyệt tải lại trang Login để xóa sạch bộ nhớ tạm
            window.location.href = '/login';
        }
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20}/>, count: null },
        { id: 'users', label: 'Users', icon: <Users size={20}/>, count: totalUsers },
        { id: 'services', label: 'Services', icon: <ShoppingBag size={20}/>, count: totalCatalog },
        { id: 'orders', label: 'Orders', icon: <ClipboardList size={20}/>, count: totalOrders },
        { id: 'merchant-requests', label: 'Merchant Requests', icon: <FileText size={20}/>, count: totalRequests },
        { id: 'settings', label: 'Settings', icon: <Settings size={20}/>, count: null },
    ];

    return (
        <div className="sticky top-0 z-40 w-64 lg:w-72 bg-black/30 backdrop-blur-2xl border-r border-white/10 flex flex-col h-screen shrink-0">
            {/* Logo */}
            <div className="p-6 border-b border-white/10 shrink-0">
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
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full min-w-[24px] text-center transition-colors ${
                                activeTab === item.id
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-white/10 text-white/60 group-hover:bg-white/20'
                            }`}>
                                {item.count.toLocaleString('vi-VN')}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-white/10 space-y-3 bg-black/20 shrink-0">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
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

                <button
                    onClick={handleLogout}
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