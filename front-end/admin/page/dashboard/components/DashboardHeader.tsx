import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Users, ShoppingBag, FileText, Calendar, Clock, Loader2 } from 'lucide-react';

// Import Services
import { adminUserService } from '@/services/admin/admin.user.service';
import { adminCatalogService } from '@/services/admin/admin.catalog.service';
import { adminTransactionService } from '@/services/admin/admin.transaction.service';

const DashboardHeader: FC = () => {
    // State lưu thống kê
    const [stats, setStats] = useState({
        users: 0,
        services: 0,
        transactions: 0
    });
    const [loading, setLoading] = useState(true);

    // Lấy ngày hiện tại
    const today = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Fetch Data khi mount
    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Gọi song song 4 API (User, Transaction, Service, Package) lấy size=1 để lấy totalItems
                const [usersRes, transRes, servicesRes, packagesRes] = await Promise.all([
                    adminUserService.getUsers({ page: 0, size: 1 }),
                    adminTransactionService.getAllTransactions({ page: 0, size: 1 }),
                    adminCatalogService.getMasterServices({ page: 0, size: 1 }),
                    adminCatalogService.getPackages({ page: 0, size: 1 })
                ]);

                // Helper để lấy total an toàn (xử lý cả trường hợp API trả về PageResponse hoặc ListResponse)
                const getTotal = (res: any) => res.totalItems || res.totalElements || 0;

                setStats({
                    users: getTotal(usersRes),
                    transactions: getTotal(transRes),
                    // Tổng Catalog = Service + Package
                    services: getTotal(servicesRes) + getTotal(packagesRes)
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 animate-fadeIn">
            {/* Left Section - Title & Stats */}
            <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-4">
                    Dashboard
                </h1>

                {/* Quick Stats Grid */}
                <div className="flex flex-wrap gap-4">

                    {/* Stat 1: Users */}
                    <div className="flex items-center space-x-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm min-w-[140px]">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-white/40 text-xs uppercase font-medium tracking-wider">Người dùng</p>
                            <div className="text-white font-bold text-lg leading-none">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : stats.users}
                            </div>
                        </div>
                    </div>

                    {/* Stat 2: Catalog (Services) */}
                    <div className="flex items-center space-x-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm min-w-[140px]">
                        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <p className="text-white/40 text-xs uppercase font-medium tracking-wider">Dịch vụ</p>
                            <div className="text-white font-bold text-lg leading-none">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : stats.services}
                            </div>
                        </div>
                    </div>

                    {/* Stat 3: Transactions */}
                    <div className="flex items-center space-x-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm min-w-[140px]">
                        <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                            <FileText size={20} />
                        </div>
                        <div>
                            <p className="text-white/40 text-xs uppercase font-medium tracking-wider">Giao dịch</p>
                            <div className="text-white font-bold text-lg leading-none">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : stats.transactions}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Right Section - Date & Time Display */}
            <div className="flex items-center gap-3 bg-black/20 p-2 rounded-2xl border border-white/5 shrink-0">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80">
                    <Calendar size={16} className="text-blue-400" />
                    <span className="text-sm font-medium capitalize">{today}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80">
                    <Clock size={16} className="text-purple-400" />
                    <span className="text-sm font-medium">System Online</span>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;