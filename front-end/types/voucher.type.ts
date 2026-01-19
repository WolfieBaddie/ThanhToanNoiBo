// Enum trạng thái (Khớp với Backend)
export enum UserVoucherStatusEnum {
    ACTIVE = 'ACTIVE',
    USED = 'USED',
    EXPIRED = 'EXPIRED',
    LOCKED = 'LOCKED'
}

// Cập nhật DTO Response
export interface UserVoucherResponse {
    voucherId: string;
    voucherCode: string;
    status: UserVoucherStatusEnum;

    // [CẬP NHẬT] serviceId có thể null do lưu snapshot
    serviceId: string | null;

    serviceName: string;

    // [MỚI] Các trường snapshot từ backend
    imageUrl?: string | null;
    categoryName?: string;

    // [QUAN TRỌNG] Số lượng vé gộp
    quantity: number;

    priceAtPurchase: number; // Đơn giá lúc mua
    createdAt: string;
    expiresAt: string | null;
    usedAt: string | null;
}

// ... Các interface khác giữ nguyên
export interface PageResponse<T> {
    items: T[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
}

export interface VoucherFilters {
    status?: UserVoucherStatusEnum | '';
    code?: string;
    page: number;
    size: number;
}

export interface BuyVoucherRequest {
    serviceId: string;
    amount: number;
}

export interface BuyVoucherResponse {
    orderId: string;
    transactionId: string;
    totalAmount: number;
    quantity: number;
    voucherCodes: string[];
    purchasedAt: string;
}

export interface ExchangeVoucherRequest {
    quantity: number;       // Số lượng vé
    creditValue: number;    // Mệnh giá (VD: 50000)
}

export const ERROR_CODES = {
    INSUFFICIENT_BALANCE: 'W0002'
};