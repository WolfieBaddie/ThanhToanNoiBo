// Enum trạng thái (Khớp với Backend)
import {ServiceResponse} from "@/types/catalog.type.ts";

export enum UserVoucherStatusEnum {
    ACTIVE = 'ACTIVE',
    USED = 'USED',
    EXPIRED = 'EXPIRED',
    LOCKED = 'LOCKED'
}

export interface UserVoucherResponse {
    voucherId: string;
    voucherCode: string;
    status: string;

    serviceId?: string;
    packageId?: string;
    serviceName: string;
    imageUrl: string;
    categoryName?: string;

    priceAtPurchase: number;
    createdAt: string;
    expiresAt: string;
    usedAt?: string;

    isExpired: boolean;
    quantity: number;
    qrContent: string;

    totalRemainingUsage?: number;

    comboType?: 'ALL_INCLUSIVE' | 'SELECT_ONE';
    usageLimit?: number;

    counterName?: string;
    counterLocation?: string;

    items?: UserVoucherDetail[];
}

export interface UserVoucherDetail {
    detailId: string;
    serviceId: string;
    serviceName: string;
    imageUrl: string;
    initialQuantity: number;
    remainingQuantity: number;
    allocatedPrice?: number;
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
    totalUsage?: number;
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