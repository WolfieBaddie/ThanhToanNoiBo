import { useState, useEffect, useCallback } from 'react';
import { creditService } from '../services/credit.service';
import { UserCreditInfoResponse } from '../types/credit.types';

export const useUserCredit = (userId: string | undefined | null) => {
    const [creditInfo, setCreditInfo] = useState<UserCreditInfoResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCreditInfo = useCallback(async () => {
        // 1. LOG DEBUG: Để xem chính xác Hook nhận được userId là gì
        console.log(`%c[useUserCredit] Triggered for UserID:`, "color: orange; font-weight: bold;", userId);

        // 2. Xử lý trường hợp không có UserID
        if (!userId) {
            console.warn("[useUserCredit] No UserID provided. Skipping fetch.");
            setCreditInfo(null); // Reset dữ liệu để tránh hiện thông tin cũ
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Gọi Service
            const data = await creditService.getUserCredit(userId);

            console.log("[useUserCredit] Data received:", data);
            setCreditInfo(data);
        } catch (err: any) {
            console.error("[useUserCredit] Error:", err);
            setError(err.response?.data?.message || "Không thể tải thông tin ví.");
            setCreditInfo(null);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Tự động gọi khi userId thay đổi
    useEffect(() => {
        // Biến này giúp tránh update state nếu component đã unmount (cleanup)
        let isMounted = true;

        fetchCreditInfo();

        return () => {
            isMounted = false;
        };
    }, [fetchCreditInfo]);

    return {
        creditInfo,
        isLoading,
        error,
        refreshCredit: fetchCreditInfo
    };
};