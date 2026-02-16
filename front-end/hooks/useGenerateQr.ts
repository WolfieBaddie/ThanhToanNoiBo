// src/hooks/useGenerateQr.ts

import { useState, useCallback } from 'react';
import { qrService } from '@/services/qr.service';
import { QrCodeType, QrCodeResponse, GenerateQrRequest } from '@/types/qr.type';

export const useGenerateQr = () => {
    const [qrData, setQrData] = useState<QrCodeResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Hàm sinh mã QR
     * @param voucherId - ID của voucher
     * @param quantity - Số lượng gói/lượt muốn sử dụng (Mặc định là 1)
     * - Nếu là SELECT_ONE: quantity = số món muốn đổi.
     * - Nếu là ALL_INCLUSIVE: quantity = số bộ combo muốn dùng.
     */
    const generateQr = useCallback(async (voucherId: string, quantity: number = 1) => {
        setIsLoading(true);
        setError(null);
        setQrData(null);

        try {
            const request: GenerateQrRequest = {
                type: QrCodeType.STATIC, // Hoặc VOUCHER tùy config backend
                voucherId: voucherId,
                expiresInMinutes: 5,

                // Gửi nguyên số lượng user chọn xuống
                quantity: quantity
            };

            const data = await qrService.generateQr(request);
            setQrData(data);
            return data;
        } catch (err: any) {
            console.error("Error generating QR:", err);
            const msg = err.response?.data?.message || "Không thể tạo mã QR. Vui lòng thử lại.";
            setError(msg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resetQr = useCallback(() => {
        setQrData(null);
        setError(null);
        setIsLoading(false);
    }, []);

    return {
        qrData,
        isLoading,
        error,
        generateQr,
        resetQr
    };
};