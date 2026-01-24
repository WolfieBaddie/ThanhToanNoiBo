import { useState, useEffect } from 'react';
import { walletService } from '@/services/transaction.service';
import { DashboardChartData } from '@/types/transaction.type';

export const useMerchantChart = (initialPeriod: string = 'Week') => {
    // State lưu dữ liệu
    const [data, setData] = useState<DashboardChartData | null>(null);
    const [loading, setLoading] = useState(false);

    // State lưu mốc thời gian đang chọn (Week | Month)
    const [period, setPeriod] = useState(initialPeriod);

    const fetchChartData = async () => {
        setLoading(true);
        try {
            const res = await walletService.getDashboardChart(period);
            setData(res);
        } catch (error) {
            console.error("Failed to fetch dashboard chart:", error);
        } finally {
            setLoading(false);
        }
    };

    // Gọi lại API mỗi khi 'period' thay đổi
    useEffect(() => {
        fetchChartData();
    }, [period]);

    return {
        chartData: data?.revenueChart || [], // Mảng dữ liệu biểu đồ
        topItems: data?.topItems || [],      // Mảng top món
        loading,
        period,
        setPeriod, // Hàm để UI gọi khi user bấm tab Ngày/Tuần/Tháng
        refetch: fetchChartData
    };
};