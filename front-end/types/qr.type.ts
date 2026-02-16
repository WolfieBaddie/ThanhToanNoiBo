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
    totalRemainingUsage?: number;
    comboType?: 'ALL_INCLUSIVE' | 'SELECT_ONE';
    packageName?: string;
    usageLimit: number;
    usageCount: number;

    userId: string;
    fullName: string;
    userType: string;
    email: string;
    imageUrl?: string;

    expiresAt: string;
    createdAt: string;
    phoneNumber: string;

    includedServices?: ServiceResponse[];
}

// [MỚI] Interface cho từng item chi tiết trong gói
export interface QrItemRequest {
    serviceId: string;
    quantity: number;
}

export interface ProcessQrRequest {
    qrCode: string;
    billAmount: number;

    // Tổng số lượng Voucher/Combo bị trừ (VD: 1 combo)
    quantity: number;

    description?: string;
    imageUrl?: string;

    // Giữ lại để tương thích ngược (nếu backend vẫn check)
    serviceId?: string;

    // [MỚI] Danh sách chi tiết để Backend Bulk Insert
    // VD: [{serviceId: "com_tam", quantity: 1}, {serviceId: "tra_da", quantity: 1}]
    items?: QrItemRequest[];
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