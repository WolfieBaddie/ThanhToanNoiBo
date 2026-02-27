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

// Enum khớp với Backend
export type TransactionTypeEnum = 'DEPOSIT' | 'WITHDRAW' | 'PAYMENT' | 'REFUND' | 'BUY_VOUCHER' | 'TRANSFER' | 'REDEMPTION';

// Enum Status khớp với Backend
export type TransactionStatusEnum = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// 1. Transaction List Item (Dùng cho bảng danh sách)
export interface Transaction {
    transactionId: string;
    transactionRef: string;
    title: string;
    description: string;
    amount: number;
    direction: 'IN' | 'OUT';
    quantity?: number;
    status: TransactionStatusEnum;
    transactionType: TransactionTypeEnum;
    createdAt: string;
    partnerInfo?: TransactionPartnerInfo;
}

// [MỚI] Interface cho từng món chi tiết trong giao dịch (Combo)
export interface TransactionItemDetail {
    itemName: string;
    itemImage?: string;
    quantity: number;
    unitPrice: number;
}

// 2. Transaction Detail (Góc nhìn Admin/Merchant)
export interface TransactionDetail {
    transactionId: string;
    transactionRef: string;
    amount: number;       // Tổng tiền thanh toán (Gốc + Thuế)

    // [MỚI] Thêm trường Breakdown tiền
    originalAmount?: number; // Tiền gốc
    taxAmount?: number;      // Tiền thuế VAT

    status: TransactionStatusEnum;
    type: TransactionTypeEnum;
    description: string;
    createdAt: string;
    direction: 'IN' | 'OUT' | 'SYSTEM';

    // Product Info (Tổng hợp)
    itemName?: string;
    itemImage?: string;
    categoryName?: string;
    quantity?: number;
    priceAtPurchase?: number;
    serviceId?: string;
    packageId?: string;
    partnerInfo?: TransactionPartnerInfo;
    evidenceImage?: string;

    // Danh sách chi tiết các món (cho giao dịch Combo/Package)
    items?: TransactionItemDetail[];
}

export interface TransactionPartnerInfo {
    partnerId: string;
    partnerName: string;
    partnerImage?: string;
    partnerType: 'CUSTOMER' | 'MERCHANT' | 'USER';
    subTitle?: string;
}

// 3. Filter Params
export interface TransactionFilterParams {
    fromDate?: string;
    toDate?: string;
    type?: TransactionTypeEnum;
    transactionRef?: string;
    page?: number;
    size?: number;
}

// 4. User Transaction Detail (Góc nhìn User App)
export interface UserTransactionDetail {
    transactionId: string;
    transactionRef: string;

    // Logic hiển thị riêng cho User
    title: string;
    amountDisplay: string;
    isTicketRedemption: boolean;

    // Thông tin chung
    amount: number;          // Tổng tiền

    // [MỚI] Thêm trường Breakdown tiền cho User xem bill
    originalAmount?: number; // Tiền gốc
    taxAmount?: number;      // Tiền thuế

    status: string;
    type: string;
    description: string;
    createdAt: string;
    direction: 'IN' | 'OUT';

    // Sản phẩm / Dịch vụ (Tổng hợp)
    itemName?: string;
    itemImage?: string;
    categoryName?: string;
    quantity: number;
    priceAtPurchase?: number;
    serviceId?: string;
    packageId?: string;

    // Danh sách chi tiết các món (cho giao dịch Combo/Package)
    items?: TransactionItemDetail[];

    // Thông tin đối tác & Ảnh bằng chứng
    partnerInfo?: TransactionPartnerInfo;
    evidenceImage?: string;

    // Debug info / QR logic
    qrId?: string;
    qrUsageLimit?: number;
    qrUsageCount?: number;
}

export interface MerchantStatsData {
    todayRevenue: number;
    yesterdayRevenue: number;
    revenueGrowth: number; // % tăng trưởng
    orderCount: number;
    processingCount: number;
    avgOrderValue: number;
}

export interface ChartDataPoint {
    date: string;      // YYYY-MM-DD
    dayName: string;   // T2, T3, CN...
    value: number;     // Doanh thu
}

// [MỚI] Interface cho Top món bán chạy
export interface TopItemData {
    itemName: string;
    sales: number;
    trend: string;     // 'up' | 'down'
}

// [MỚI] Response tổng cho Dashboard Chart
export interface DashboardChartData {
    revenueChart: ChartDataPoint[];
    topItems: TopItemData[];
}