import { useState, useEffect } from 'react';
import { voucherService } from '../services/voucher.service';
import { UserVoucherDetailResponse } from '@/types/voucher.type';

export const useVoucherDetail = (voucherId: string | undefined) => {
    const [voucher, setVoucher] = useState<UserVoucherDetailResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!voucherId) return;

        const fetchDetail = async () => {
            setIsLoading(true);
            try {
                // Service đã được định nghĩa ở bước trước, trả về DTO
                const data = await voucherService.getVoucherDetail(voucherId);
                setVoucher(data);
            } catch (err: any) {
                console.error("Error fetching voucher detail:", err);
                setError(err.response?.data?.message || "Không thể tải thông tin voucher.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetail();
    }, [voucherId]);

    return { voucher, isLoading, error };
};