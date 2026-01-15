export enum PaymentRequestType {
    TOP_UP = 'TOP_UP',
    PAYMENT = 'PAYMENT',
    TRANSFER = 'TRANSFER'
}

export interface PaymentRequest {
    amount: number;
    orderInfo: string;
    type: PaymentRequestType;
    bankCode?: string;
    language?: string;
    serviceId?: string;
    packageId?: string;
    // userId?: string; // Có thể bỏ dòng này vì Backend tự lấy từ Token
}

export interface VnPayResponse {
    paymentUrl: string;
    message?: string;
    status?: string;
}

export interface PaymentDetailResponse {
    paymentDetailId: string;
    transactionId: string;
    transactionRef: string;
    serviceId?: string;
    serviceName?: string;
    packageId?: string;
    packageName?: string;
    quantity?: number;
    totalAmount: number;
}