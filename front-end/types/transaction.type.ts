// Common Response Types
export interface BaseResponse<T> {
    code: number;
    message: string;
    data: T;
    timestamp: string;
}

export interface PageResponse<T> {
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    items: T[];
}

// [CẬP NHẬT 1]: Định nghĩa Enum khớp với Backend (TransactionType.java)
export type TransactionTypeEnum = 'DEPOSIT' | 'WITHDRAW' | 'PAYMENT' | 'REFUND' | 'BUY_VOUCHER' | 'TRANSFER';

// [CẬP NHẬT 2]: Định nghĩa Status khớp với Backend (TransactionStatus.java)
export type TransactionStatusEnum = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// 1. Transaction List Item
export interface Transaction {
    transactionId: string;
    transactionRef: string;
    title: string;
    description: string;
    amount: number;
    direction: 'IN' | 'OUT';
    status: TransactionStatusEnum; // Dùng Enum thay vì string
    transactionType: TransactionTypeEnum; // Dùng Enum thay vì string
    createdAt: string;
    partnerInfo?: TransactionPartnerInfo;
}

// 2. Transaction Detail
export interface TransactionDetail {
    transactionId: string;
    transactionRef: string;
    amount: number;
    status: TransactionStatusEnum;
    type: TransactionTypeEnum;
    description: string;
    createdAt: string;
    direction: 'IN' | 'OUT';

    // Product Info
    itemName?: string;
    itemImage?: string;
    categoryName?: string;
    quantity?: number;
    priceAtPurchase?: number;
    serviceId?: string;
    packageId?: string;
    partnerInfo?: TransactionPartnerInfo;
    evidenceImage?: string;
}

export interface TransactionPartnerInfo {
    partnerId: string;
    partnerName: string;  // Tên User hoặc Tên Quầy
    partnerImage?: string; // Avatar/Logo
    partnerType: 'CUSTOMER' | 'MERCHANT';
    subTitle?: string;    // SĐT hoặc Tên thu ngân
}

// 3. Filter Params
export interface TransactionFilterParams {
    fromDate?: string;
    toDate?: string;
    type?: TransactionTypeEnum; // Update type ở đây để khi gọi API gợi ý code tốt hơn
    transactionRef?: string;
    page?: number;
    size?: number;
}

// [CẬP NHẬT] Interface chi tiết giao dịch cho User App
// Khớp với UserTransactionDetailResponse.java
export interface UserTransactionDetail {
    transactionId: string;
    transactionRef: string;

    // Logic hiển thị riêng cho User
    title: string;          // VD: "Đổi 1 Hủ Tiếu"
    amountDisplay: string;  // VD: "-1 Vé" hoặc "-35.000đ"
    isTicketRedemption: boolean;

    // Thông tin chung
    amount: number;
    status: string;
    type: string;
    description: string;
    createdAt: string;
    direction: 'IN' | 'OUT';

    // Sản phẩm / Dịch vụ
    itemName?: string;
    itemImage?: string;
    categoryName?: string;
    quantity: number;
    priceAtPurchase?: number;
    serviceId?: string;
    packageId?: string;

    // Thông tin đối tác & Ảnh bằng chứng (Quan trọng)
    partnerInfo?: TransactionPartnerInfo;
    evidenceImage?: string;

    // Debug info
    qrId?: string;
    qrUsageLimit?: number;
    qrUsageCount?: number;
}