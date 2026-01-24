// src/services/transaction.service.ts

import { axiosClient } from "@/lib/axios-client";
import {
    PageResponse,
    Transaction,
    TransactionDetail,
    TransactionFilterParams,
    UserTransactionDetail,
    MerchantStatsData, DashboardChartData
} from '@/types/transaction.type';

export const walletService = {
    /**
     * Lấy danh sách giao dịch
     */
    getMyTransactions: async (params: TransactionFilterParams): Promise<PageResponse<Transaction>> => {
        const response = await axiosClient.get('/user-credits/transactions', { params });
        return response as unknown as PageResponse<Transaction>;
    },

    /**
     * Lấy chi tiết giao dịch (Merchant/Admin)
     * Response bao gồm: items (list), itemName, itemImage...
     */
    getTransactionDetail: async (id: string): Promise<TransactionDetail> => {
        const response = await axiosClient.get(`/user-credits/transactions/${id}`);
        return response as unknown as TransactionDetail;
    },

    /**
     * Lấy chi tiết giao dịch (User)
     * Response bao gồm: items (list), itemName, itemImage...
     */
    getUserTransactionDetail: async (id: string): Promise<UserTransactionDetail> => {
        const response = await axiosClient.get(`/user-credits/user/transactions/${id}`);
        return response as unknown as UserTransactionDetail;
    },

    getMerchantStats: async (): Promise<MerchantStatsData> => {
        const response = await axiosClient.get('/user-credits/transactions/stats');
        return response as unknown as MerchantStatsData;
    },

    getDashboardChart: async (period: string = 'Week'): Promise<DashboardChartData> => {
        const response = await axiosClient.get('/user-credits/transactions/dashboard-chart', {
            params: { period }
        });
        return response as unknown as DashboardChartData;
    }
};