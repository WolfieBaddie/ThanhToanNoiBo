import { axiosClient } from "@/lib/axios-client";
import {
    PageResponse,
    Transaction,
    TransactionDetail,
    TransactionFilterParams,
    UserTransactionDetail
} from '@/types/transaction.type';

export const walletService = {
    /**
     * Lấy danh sách giao dịch
     * Backend trả về: BaseResponse<PageResponse<TransactionResponse>>
     * Axios Interceptor đã gỡ BaseResponse -> Service trả về: PageResponse<Transaction>
     */
    getMyTransactions: async (params: TransactionFilterParams): Promise<PageResponse<Transaction>> => {
        const response = await axiosClient.get('/user-credits/transactions', { params });
        return response as unknown as PageResponse<Transaction>;
    },

    /**
     * Lấy chi tiết giao dịch
     * Backend trả về: BaseResponse<TransactionDetailResponse>
     * Axios Interceptor đã gỡ BaseResponse -> Service trả về: TransactionDetail
     */
    getTransactionDetail: async (id: string): Promise<TransactionDetail> => {
        const response = await axiosClient.get(`/user-credits/transactions/${id}`);
        return response as unknown as TransactionDetail;
    },

    getUserTransactionDetail: async (id: string): Promise<UserTransactionDetail> => {
        const response = await axiosClient.get(`/user-credits/user/transactions/${id}`);
        return response as unknown as UserTransactionDetail;
    }
};