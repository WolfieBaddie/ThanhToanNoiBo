// Enum trạng thái (Khớp với Backend)
import {ServiceResponse} from "@/types/catalog.type.ts";

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
    serviceId: string | null;
    packageId: string | null;
    serviceName: string;
    imageUrl?: string | null;
    categoryName?: string;
    quantity: number;
    priceAtPurchase: number;
    createdAt: string;
    expiresAt: string | null;
    usedAt: string | null;

    // [MỚI] Danh sách món trong gói
    includedServices?: ServiceResponse[];
}
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

// Request mua lẻ
export interface BuyVoucherRequest {
    serviceId: string;
    amount: number;
    otpCode: string;
}

// [MỚI] Request mua combo (Khớp với Backend DTO)
export interface BuyPackageRequest {
    packageId: string;
    quantity: number;
    otpCode: string;
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
    quantity: number;
    creditValue: number;
}

export interface GenerateOtpResponse {
    message: string;
    maskedEmail: string;
    expiresInSeconds: number;
    sentAt: string;
}

export interface GenerateOtpRequest {
    actionType: 'TRANSACTION' | 'LOGIN' | 'FORGOT_PASSWORD';
}

export const ERROR_CODES = {
    INSUFFICIENT_BALANCE: 'W0002'
};