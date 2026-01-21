import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { voucherService } from '@/services/voucher.service';
import {
    BuyPackageRequest,
    BuyVoucherRequest,
    ExchangeVoucherRequest
} from '@/types/voucher.type';
import { useUserCredit } from '@/hooks/useUserCredit';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import {useGlobalNotification} from "@/context/GlobalNoticationContext.tsx";

export const useBuyVoucher = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { creditInfo } = useUserCredit(user?.userId);
    const notify = useNotification();
    const { refetchCount, fetchNotifications } = useGlobalNotification();

    // Helper function để reload tất cả thông báo
    const refreshAppData = () => {
        refetchCount(); // Cập nhật số đỏ trên chuông ngay lập tức
        fetchNotifications(); // Cập nhật lại list thông báo (nếu user đang mở dropdown)
    };

    // --- LOGIC XỬ LÝ LỖI CHUNG ---
    const handleTransactionError = (error: any, totalRequired: number) => {
        console.error("Lỗi giao dịch:", error);
        const serverErrorCode = error.response?.data?.code;
        const message = error.response?.data?.message || "";

        // 1. Lỗi OTP
        if (serverErrorCode === 'A0001') {
            notify.error("Mã OTP không chính xác.");
            return;
        }
        if (serverErrorCode === 'A0002') {
            notify.error("Mã OTP đã hết hạn. Vui lòng lấy lại mã.");
            return;
        }

        // 2. Lỗi thiếu tiền
        if (message.includes("Số dư không đủ") || serverErrorCode === 400 || serverErrorCode === 'W0002') {
            const currentBalance = creditInfo?.balance || 0;
            const missingAmount = totalRequired - currentBalance;

            notify.error(`Số dư không đủ. Bạn còn thiếu ${missingAmount.toLocaleString('vi-VN')}đ`);

            // Gợi ý nạp tiền
            setTimeout(() => {
                const confirmTopUp = window.confirm(
                    `Số dư hiện tại: ${currentBalance.toLocaleString('vi-VN')}đ\n` +
                    `Cần thanh toán: ${totalRequired.toLocaleString('vi-VN')}đ\n` +
                    `Bạn còn thiếu: ${missingAmount.toLocaleString('vi-VN')}đ\n\n` +
                    `Chuyển sang trang Nạp tiền ngay?`
                );
                if (confirmTopUp) {
                    navigate('/payment/topup', { state: { suggestedAmount: missingAmount } });
                }
            }, 500);
        } else {
            notify.error(message || "Giao dịch thất bại.");
        }
    };

    // --- 1. HÀM LẤY OTP ---
    const requestOtp = async (): Promise<boolean> => {
        setIsLoading(true);
        try {
            const res = await voucherService.generateOtp('TRANSACTION');
            notify.success(`Đã gửi mã xác thực tới email ${res.maskedEmail}`);
            return true;
        } catch (error: any) {
            notify.error(error.response?.data?.message || "Không thể gửi OTP.");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // --- 2. HÀM MUA VOUCHER LẺ ---
    // Hook nhận `onSuccess` để xử lý UI, nhưng khi gọi Service thì chỉ truyền data
    const buyVoucher = async (
        requestPart: Omit<BuyVoucherRequest, 'otpCode'>, // Data vé (chưa có OTP)
        otpCode: string,                                 // OTP nhập vào
        unitPrice: number,                               // Giá (để tính lỗi thiếu tiền)
        onSuccess?: () => void                           // Callback UI
    ) => {
        setIsLoading(true);
        try {
            // Gọi Service: Gộp data + otpCode thành request hoàn chỉnh
            await voucherService.buyVoucher({ ...requestPart, otpCode });

            notify.success("Mua vé thành công! Vui lòng kiểm tra Kho Voucher.");
            refreshAppData();
            // Gọi callback UI (ví dụ: đóng modal)
            if (onSuccess) onSuccess();
        } catch (error: any) {
            handleTransactionError(error, unitPrice * requestPart.amount);
        } finally {
            setIsLoading(false);
        }
    };

    // --- 3. HÀM MUA PACKAGE (COMBO) ---
    const buyPackage = async (
        requestPart: Omit<BuyPackageRequest, 'otpCode'>,
        otpCode: string,
        packagePrice: number,
        onSuccess?: () => void
    ) => {
        setIsLoading(true);
        try {
            await voucherService.buyPackage({ ...requestPart, otpCode });

            notify.success("Mua Combo thành công! Các vé đã được thêm vào Kho.");
            refreshAppData();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            handleTransactionError(error, packagePrice * requestPart.quantity);
        } finally {
            setIsLoading(false);
        }
    };

    // --- 4. HÀM ĐỔI VOUCHER GENERIC (Chưa có OTP) ---
    const exchangeGenericVoucher = async (
        request: ExchangeVoucherRequest,
        onSuccess?: () => void
    ) => {
        setIsLoading(true);
        try {
            await voucherService.exchangeVoucher(request);
            notify.success(`Đã đổi ${request.quantity} voucher thành công.`);
            refreshAppData();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            handleTransactionError(error, request.quantity * request.creditValue);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        requestOtp,
        buyVoucher,
        buyPackage,
        exchangeGenericVoucher,
        isLoading
    };
};