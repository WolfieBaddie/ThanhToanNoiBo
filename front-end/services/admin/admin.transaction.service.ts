import { axiosClient } from '@/lib/axios-client';
import { AdminTransactionFilterParams } from '@/types/admin.transaction.type';
import {
    PageResponse,
    Transaction,
    TransactionDetail
} from '@/types/transaction.type';

export const adminTransactionService = {
    /**
     * 1. Lấy danh sách giao dịch (Admin)
     * GET /api/admin/transactions
     */
    getAllTransactions: async (params: AdminTransactionFilterParams): Promise<PageResponse<Transaction>> => {
        const response = await axiosClient.get('/admin/transactions', {
            params: {
                ...params,
                userIds: params.userIds && params.userIds.length > 0 ? params.userIds : undefined
            }
        });

        // [FIX LỖI TS2352]: Ép kiểu qua 'unknown' để TypeScript bỏ qua kiểm tra overlap
        return response as unknown as PageResponse<Transaction>;
    },

    /**
     * 2. Lấy chi tiết giao dịch (Admin)
     * GET /api/admin/transactions/{id}
     */
    getTransactionDetail: async (transactionId: string): Promise<TransactionDetail> => {
        const response = await axiosClient.get(`/admin/transactions/${transactionId}`);

        // [FIX LỖI TS2352]: Tương tự cho detail
        return response as unknown as TransactionDetail;
    }
};