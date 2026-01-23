
import { TransactionFilterParams } from "@/types/transaction.type";

// Kế thừa các bộ lọc cơ bản (page, size, date, type...) và thêm userIds
export interface AdminTransactionFilterParams extends TransactionFilterParams {
    userIds?: string[]; // Admin có thể lọc theo 1 hoặc nhiều user
}
// Interface response trả về từ Admin API (bọc trong BaseResponse)
export interface AdminTransactionListResponse {
    items: any[]; // Thay 'any' bằng TransactionResponse nếu đã import
    totalItems: number;
    totalPages: number;
    page: number;
    size: number;
}