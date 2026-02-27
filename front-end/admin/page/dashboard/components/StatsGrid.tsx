import type { FC } from 'react';
import { useMemo } from 'react';
import StatsCard from './StatsCard';
import { useAdminTransactions } from '@/hooks/admin/useAdminTransaction';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { useAdminCatalog } from '@/hooks/admin/useAdminCatalog';
import { DollarSign, FileText, Users, ShoppingBag } from 'lucide-react'; // [MỚI] Import Icons

export const StatsGrid: FC = () => {
    // 1. TỔNG DOANH THU (Logic cũ giữ nguyên)
    const currentYear = new Date().getFullYear();
    const { data: revenueData } = useAdminTransactions({
        page: 0,
        size: 5000,
        type: 'REDEMPTION',
        fromDate: `${currentYear}-01-01`,
        toDate: `${currentYear}-12-31`
    });

    const totalRevenue = useMemo(() => {
        if (!revenueData) return 0;
        return revenueData.reduce((acc, curr: any) => acc + (curr.amount || 0), 0);
    }, [revenueData]);

    // 2. CÁC THỐNG KÊ KHÁC (Logic cũ giữ nguyên)
    const { totalItems: totalOrders } = useAdminTransactions({ page: 0, size: 1 });
    const { totalItems: totalUsers } = useAdminUsers(1);
    const { totalItems: totalServices } = useAdminCatalog();

    // 3. Cấu hình hiển thị (Đã thay đổi Icon)
    const stats = [
        {
            title: 'Tổng doanh thu',
            value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue),
            change: '+20.1%',
            icon: DollarSign, // [MỚI] Lucide Icon
            color: 'from-green-500/20 to-emerald-500/20',
            borderColor: 'border-green-500/30',
            trend: 'up' as const
        },
        {
            title: 'Tổng đơn hàng',
            value: totalOrders.toLocaleString('vi-VN'),
            change: '+15.3%',
            icon: FileText, // [MỚI] Lucide Icon
            color: 'from-blue-500/20 to-cyan-500/20',
            borderColor: 'border-blue-500/30',
            trend: 'up' as const
        },
        {
            title: 'Người dùng',
            value: totalUsers.toLocaleString('vi-VN'),
            change: '+8.2%',
            icon: Users, // [MỚI] Lucide Icon
            color: 'from-purple-500/20 to-pink-500/20',
            borderColor: 'border-purple-500/30',
            trend: 'up' as const
        },
        {
            title: 'Dịch vụ',
            value: totalServices.toLocaleString('vi-VN'),
            change: '+3',
            icon: ShoppingBag, // [MỚI] Lucide Icon
            color: 'from-orange-500/20 to-yellow-500/20',
            borderColor: 'border-orange-500/30',
            trend: 'up' as const
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
            {stats.map((stat, index) => (
                <StatsCard
                    key={index}
                    {...stat}
                    delay={index * 100}
                />
            ))}
        </div>
    );
};