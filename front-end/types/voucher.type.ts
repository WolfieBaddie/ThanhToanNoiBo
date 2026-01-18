
// Enum trạng thái (Khớp với Backend)
export enum UserVoucherStatusEnum {
    ACTIVE = 'ACTIVE',
    USED = 'USED',
    EXPIRED = 'EXPIRED',
    LOCKED = 'LOCKED'
}

// Cấu trúc response trả về của 1 voucher (UserVoucherResponse DTO)
export interface UserVoucherResponse {
    voucherId: string;
    voucherCode: string;
    status: UserVoucherStatusEnum;
    serviceName: string;
    serviceId: string;
    priceAtPurchase: number;
    createdAt: string;
    expiresAt: string | null;
    usedAt: string | null;
}

// Cấu trúc phân trang chung (PageResponse DTO)
export interface PageResponse<T> {
    items: T[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
}

// Bộ lọc gửi lên API
export interface VoucherFilters {
    status?: UserVoucherStatusEnum | '';
    code?: string;
    page: number;
    size: number;
}

export interface UserVoucherDetailResponse {
    voucherId: string;
    voucherCode: string;
    status: UserVoucherStatusEnum;
    serviceId: string;
    serviceName: string;
    imageUrl: string | null;
    categoryName: string;
    priceAtPurchase: number;
    createdAt: string;
    expiresAt: string;
    usedAt: string | null;
    // qrContent: string;
    expired: boolean;
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

export const ERROR_CODES = {
    INSUFFICIENT_BALANCE: 'W0002'
};