import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    LayoutDashboard, Users, ShoppingBag,
    FileText, Settings, LogOut, User, Store, ChevronDown, ChevronRight
} from 'lucide-react';

import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { useAdminTransactions } from '@/hooks/admin/useAdminTransaction';
import { useAdminRequest } from '@/hooks/admin/useAdminRequest';
import { adminCatalogService } from '@/services/admin/admin.catalog.service';
import { authService } from '@/services/auth.service';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const Sidebar: FC<SidebarProps> = ({ activeTab, onTabChange }) => {
    const { user } = useAuth();

    // --- LẤY DỮ LIỆU THỐNG KÊ ---
    const { totalItems: totalUsers } = useAdminUsers(1);
    const { totalItems: totalOrders } = useAdminTransactions({ page: 0, size: 1 });
    const { pagination } = useAdminRequest();
    const totalRequests = pagination.totalElements;
    const [totalCatalog, setTotalCatalog] = useState(0);

    // --- STATE QUẢN LÝ MENU CON ---
    const [isMerchantMenuOpen, setIsMerchantMenuOpen] = useState(false);

    // Tự động mở menu con nếu đang ở tab con
    useEffect(() => {
        if (activeTab === 'merchants' || activeTab === 'merchant-requests') {
            setIsMerchantMenuOpen(true);
        }
    }, [activeTab]);

    useEffect(() => {
        const fetchCatalogCounts = async () => {
            try {
                const services = await adminCatalogService.getMasterServices({ page: 0, size: 1 });
                const packages = await adminCatalogService.getPackages({ page: 0, size: 1 });
                // @ts-ignore
                setTotalCatalog((services.totalItems || 0) + (packages.totalItems || 0));
            } catch (error) {
                console.error("Failed to fetch catalog counts", error);
            }
        };
        fetchCatalogCounts();
    }, []);

    const handleLogout = () => {
        authService.logout();
        window.location.href = '/auth/login';
    };

    // Helper component cho Menu Item thường (MÀU TÍM MẶC ĐỊNH)
    const MenuItem = ({ id, icon: Icon, label, badge }: any) => (
        <button
            onClick={() => onTabChange(id)}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group relative overflow-hidden
            ${activeTab === id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'hover:bg-white/5 text-white/60'
            }`}
        >
            <div className={`flex items-center gap-3 relative z-10 ${activeTab === id ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                <Icon size={20} className={`transition-transform duration-300 ${activeTab === id ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-medium text-sm">{label}</span>
            </div>
            {badge > 0 && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold relative z-10
                ${activeTab === id
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/60 group-hover:text-white group-hover:bg-white/20'
                }`}>
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
            {activeTab === id && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-shimmer" />
            )}
        </button>
    );

    return (
        <div className="w-72 bg-[#0a0a0a]/90 backdrop-blur-xl border-r border-white/5 h-full flex flex-col shadow-2xl relative overflow-hidden shrink-0">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
            </div>

            {/* Header */}
            <div className="p-6 pb-2 relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        {/* Đổi logo thành S đại diện cho SWallet */}
                        <span className="font-bold text-white text-xl">S</span>
                    </div>
                    <div>
                        {/* Đổi tên Header Portal thành SWallet */}
                        <h1 className="font-bold text-white text-lg tracking-tight">SWallet Admin</h1>
                        <p className="text-xs text-white/40 font-medium">System Management</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 relative z-10 overflow-y-auto custom-scrollbar">
                <div className="text-xs font-bold text-white/30 uppercase tracking-wider px-3 mb-2 mt-2">Overview</div>

                <MenuItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />

                <div className="text-xs font-bold text-white/30 uppercase tracking-wider px-3 mb-2 mt-6">Management</div>

                <MenuItem id="users" icon={Users} label="Người dùng" badge={totalUsers} />

                {/* --- KHỐI QUẢN LÝ MERCHANT (ACCORDION) --- */}
                <div className="space-y-1">
                    {/* Nút cha Accordion */}
                    <button
                        onClick={() => setIsMerchantMenuOpen(!isMerchantMenuOpen)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group
                        ${(activeTab === 'merchants' || activeTab === 'merchant-requests')
                            ? 'bg-white/5 text-white'
                            : 'hover:bg-white/5 text-white/60'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {/* [FIX MÀU] Chuyển orange -> purple khi active */}
                            <Store size={20} className={`${(activeTab === 'merchants' || activeTab === 'merchant-requests') ? 'text-purple-400' : 'group-hover:text-purple-400'} transition-colors`} />
                            <span className="font-medium text-sm">Đối tác (Merchant)</span>
                        </div>
                        {isMerchantMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {/* Sub-menu */}
                    <div className={`pl-4 space-y-1 overflow-hidden transition-all duration-300 ${isMerchantMenuOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>

                        {/* 1. Danh sách Merchant */}
                        <button
                            onClick={() => onTabChange('merchants')}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-sm
                            ${activeTab === 'merchants'
                                // [FIX MÀU] Active là Tím
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
                                : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'merchants' ? 'bg-purple-400' : 'bg-white/30'}`}></div>
                                <span>Danh sách</span>
                            </div>
                        </button>

                        {/* 2. Yêu cầu duyệt */}
                        <button
                            onClick={() => onTabChange('merchant-requests')}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-sm
                            ${activeTab === 'merchant-requests'
                                // [FIX MÀU] Active là Tím
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
                                : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'merchant-requests' ? 'bg-purple-400' : 'bg-white/30'}`}></div>
                                <span>Yêu cầu duyệt</span>
                            </div>
                            {totalRequests > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold">
                                    {totalRequests}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
                {/* ----------------------------------------------- */}

                <MenuItem id="catalog" icon={ShoppingBag} label="Dịch vụ & Gói" badge={totalCatalog} />
                <MenuItem id="transactions" icon={FileText} label="Giao dịch" badge={totalOrders} />

                <div className="text-xs font-bold text-white/30 uppercase tracking-wider px-3 mb-2 mt-6">System</div>
                <MenuItem id="settings" icon={Settings} label="Cài đặt" />
            </nav>

            {/* Footer Profile */}
            <div className="p-4 border-t border-white/5 relative z-10 bg-[#0a0a0a]/50">
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                            {user?.imageUrl ? (
                                <img src={user.imageUrl} alt="Admin" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold">
                                    {user?.fullName?.charAt(0).toUpperCase() || <User size={18}/>}
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1a1a1a]"></div>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">
                            {user?.fullName || 'Admin User'}
                        </h4>
                        <p className="text-xs text-white/50 truncate">
                            {/* Đổi fallback email thành swallet */}
                            {user?.email || 'admin@swallet.vn'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="cursor-pointer w-full p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                    <LogOut size={16} className="group-hover:-translate-x-1 transition-transform"/>
                    <span>Đăng xuất</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;