// src/hooks/useMerchantStats.ts

import { useState, useEffect } from 'react';
import { walletService } from '@/services/transaction.service';
import {MerchantStatsData} from "@/types/transaction.type.ts";

export const useMerchantStats = () => {
    const [stats, setStats] = useState<MerchantStatsData>({
        todayRevenue: 0,
        yesterdayRevenue: 0,
        revenueGrowth: 0,
        orderCount: 0,
        processingCount: 0,
        avgOrderValue: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const data = await walletService.getMerchantStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch merchant stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        // Tùy chọn: Auto refresh mỗi 60 giây để số liệu luôn tươi mới
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    return { stats, loading, refetch: fetchStats };
};