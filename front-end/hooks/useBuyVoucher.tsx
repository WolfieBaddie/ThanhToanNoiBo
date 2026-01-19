import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { voucherService } from '@/services/voucher.service';
import { BuyVoucherRequest, ExchangeVoucherRequest } from '@/types/voucher.type'; // [IMPORT MỚI]
import { useUserCredit } from '@/hooks/useUserCredit';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';

export const useBuyVoucher = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { creditInfo } = useUserCredit(user?.userId);
    const notify = useNotification();

    // --- LOGIC XỬ LÝ LỖI CHUNG (Tái sử dụng) ---
    const handleTransactionError = (error: any, totalRequired: number) => {
        console.error("Lỗi giao dịch:", error);

        const serverErrorCode = error.response?.data?.code;
        const message = error.response?.data?.message || "";

        // Check lỗi thiếu tiền (W0002 hoặc 400)
        if (message.includes("Số dư không đủ") || serverErrorCode === 400 || serverErrorCode === 'W0002') {
            const currentBalance = creditInfo?.balance || 0;
            const missingAmount = totalRequired - currentBalance;

            notify.error(`Số dư không đủ. Bạn còn thiếu ${missingAmount.toLocaleString('vi-VN')}đ`);

            setTimeout(() => {
                const confirmTopUp = window.confirm(
                    `Số dư hiện tại: ${currentBalance.toLocaleString('vi-VN')}đ\n` +
                    `Cần thanh toán: ${totalRequired.toLocaleString('vi-VN')}đ\n` +
                    `-----------------------------------\n` +
                    `Bạn còn thiếu: ${missingAmount.toLocaleString('vi-VN')}đ\n\n` +
                    `Bạn có muốn chuyển sang trang Nạp tiền ngay không?`
                );

                if (confirmTopUp) {
                    navigate('/payment/topup', {
                        state: { suggestedAmount: missingAmount }
                    });
                }
            }, 500);
        } else {
            notify.error(message || "Giao dịch thất bại. Vui lòng thử lại.");
        }
    };

    // 1. Mua Voucher theo Dịch vụ (Logic cũ)
    const buyVoucher = async (
        request: BuyVoucherRequest,
        unitPrice: number,
        onSuccess?: () => void
    ) => {
        setIsLoading(true);
        try {
            await voucherService.buyVoucher(request);
            notify.success(
                <span>
                    Mua vé thành công!<br/>
                    <span className="text-xs font-normal opacity-80">Vui lòng kiểm tra trong Kho Voucher.</span>
                </span>
            );
            if (onSuccess) onSuccess();
        } catch (error: any) {
            handleTransactionError(error, unitPrice * request.amount);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. [MỚI] Đổi Voucher Linh Hoạt (Generic)
    const exchangeGenericVoucher = async (
        request: ExchangeVoucherRequest,
        onSuccess?: () => void
    ) => {
        setIsLoading(true);
        try {
            await voucherService.exchangeVoucher(request);

            notify.success(
                <span>
                    Đổi voucher thành công!<br/>
                    <span className="text-xs font-normal opacity-80">
                        Bạn đã đổi {request.quantity} voucher mệnh giá {request.creditValue.toLocaleString()}đ
                    </span>
                </span>
            );

            if (onSuccess) onSuccess();
        } catch (error: any) {
            // Tổng tiền cần thiết = Số lượng * Mệnh giá
            const totalRequired = request.quantity * request.creditValue;
            handleTransactionError(error, totalRequired);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        buyVoucher,
        exchangeGenericVoucher, // Export hàm mới ra để component dùng
        isLoading
    };
};