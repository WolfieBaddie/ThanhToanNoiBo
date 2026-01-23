// src/types/qr.type.ts

import {ServiceResponse} from "@/types/catalog.type.ts";

export enum QrCodeType {
    VOUCHER = 'VOUCHER',
    PAYMENT = 'PAYMENT',
    STATIC = 'STATIC'
}

export interface GenerateQrRequest {
    type: QrCodeType;
    voucherId: string;
    expiresInMinutes?: number;
    quantity?: number;
}

export interface QrCodeResponse {
    qrId: string;
    codeString: string;
    type: string;
    status: string;
    creditAmount: number;

    voucherId: string;
    voucherCode: string;

    // [MỚI]
    usageLimit: number;
    usageCount: number;

    userId: string;
    fullName: string;
    userType: string;
    email: string;
    imageUrl?: string; // Avatar

    expiresAt: string;
    createdAt: string;
    phoneNumber: string;

    // [MỚI]
    includedServices?: ServiceResponse[];
}

export interface ProcessQrRequest {
    qrCode: string;
    billAmount: number;
    quantity: number;
    description?: string;
    imageUrl?: string; // Link ảnh xác thực
    serviceId?: string;
}

export interface ProcessQrResponse {
    transactionId: string;
    transactionRef: string;
    paidAmount: number;
    refundedAmount: number;
    status: string;
    processedAt: string;
    message: string;
}