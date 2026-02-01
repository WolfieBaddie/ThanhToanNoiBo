import type { FC } from 'react';
import { useMemo } from 'react';
// Make sure StatsCard is also exported correctly in its own file!
import StatsCard from './StatsCard';
import { useAdminTransactions } from '@/hooks/admin/useAdminTransaction';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { useAdminCatalog } from '@/hooks/admin/useAdminCatalog';

export const StatsGrid: FC = () => {
    // 1. TỔNG DOANH THU (Logic giống RevenueChart)
    // Chỉ tính giao dịch REDEMPTION trong năm nay
    const currentYear = new Date().getFullYear();
    const { data: revenueData } = useAdminTransactions({
        page: 0,
        size: 5000, // Lấy số lượng lớn để tính tổng chính xác
        type: 'REDEMPTION',
        fromDate: `${currentYear}-01-01`,
        toDate: `${currentYear}-12-31`
    });

    const totalRevenue = useMemo(() => {
        if (!revenueData) return 0;
        return revenueData.reduce((acc, curr: any) => acc + (curr.amount || 0), 0);
    }, [revenueData]);

    // 2. TỔNG ĐƠN HÀNG (Tổng tất cả giao dịch)
    // Gọi API với size nhỏ chỉ để lấy totalItems
    const { totalItems: totalOrders } = useAdminTransactions({ page: 0, size: 1 });

    // 3. NGƯỜI DÙNG (Active Users)
    const { totalItems: totalUsers } = useAdminUsers(1);

    // 4. DỊCH VỤ (Master Services)
    const { totalItems: totalServices } = useAdminCatalog();

    // Helper format: 45000 -> 45.000 VND
    const formatVND = (val: number) => {
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " VND";
    };

    const stats = [
        {
            title: 'Tổng doanh thu',
            value: formatVND(totalRevenue),
            change: '+20.1%', // Placeholder: Cần API so sánh kỳ trước để tính
            icon: '/money.svg',
            color: 'from-green-500/20 to-emerald-500/20',
            borderColor: 'border-green-500/30',
            trend: 'up' as const
        },
        {
            title: 'Tổng đơn hàng',
            value: totalOrders.toLocaleString('vi-VN'),
            change: '+15.3%',
            icon: '📦',
            color: 'from-blue-500/20 to-cyan-500/20',
            borderColor: 'border-blue-500/30',
            trend: 'up' as const
        },
        {
            title: 'Người dùng',
            value: totalUsers.toLocaleString('vi-VN'),
            change: '+8.2%',
            icon: '👥',
            color: 'from-purple-500/20 to-pink-500/20',
            borderColor: 'border-purple-500/30',
            trend: 'up' as const
        },
        {
            title: 'Dịch vụ',
            value: totalServices.toLocaleString('vi-VN'),
            change: '+3',
            icon: '/service.svg',
            color: 'from-orange-500/20 to-yellow-500/20',
            borderColor: 'border-orange-500/30',
            trend: 'up' as const
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 animate-slideUp">
            {stats.map((stat, index) => (
                <StatsCard key={index} {...stat} delay={index * 100} />
            ))}
        </div>
    );
};