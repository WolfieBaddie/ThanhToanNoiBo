import React, { useState } from 'react'; // Phải import React vì dùng JSX
import { useNavigate } from 'react-router-dom';
import { voucherService } from '@/services/voucher.service';
import { BuyVoucherRequest } from '@/types/voucher.type';
import { useUserCredit } from '@/hooks/useUserCredit';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';

export const useBuyVoucher = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Lấy thông tin ví để tính toán (tránh lỗi null nếu user chưa load xong)
    const { creditInfo } = useUserCredit(user?.userId);

    // Lấy hàm notify từ context
    const notify = useNotification();

    const buyVoucher = async (
        request: BuyVoucherRequest,
        unitPrice: number,
        onSuccess?: () => void
    ) => {
        setIsLoading(true);
        try {
            await voucherService.buyVoucher(request);

            // Dùng JSX trong thông báo -> File phải là .tsx
            notify.success(
                <span>
                    Mua vé thành công!<br/>
            <span className="text-xs font-normal opacity-80">Vui lòng kiểm tra trong Kho Voucher.</span>
            </span>
        );

            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error("Lỗi mua vé:", error);

            // Xử lý lấy message lỗi an toàn
            const serverErrorCode = error.response?.data?.code;
            const message = error.response?.data?.message || "";

            // Check lỗi thiếu tiền (Mã lỗi W0002 hoặc 400 từ backend)
            if (message.includes("Số dư không đủ") || serverErrorCode === 400 || serverErrorCode === 'W0002') {

                const totalRequired = unitPrice * request.amount;
                const currentBalance = creditInfo?.balance || 0;
                const missingAmount = totalRequired - currentBalance;

                // Thông báo lỗi đẹp
                notify.error(`Số dư không đủ. Bạn còn thiếu ${missingAmount.toLocaleString('vi-VN')}đ`);

                // Hỏi nạp tiền sau 500ms để người dùng đọc kịp thông báo lỗi
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
                // Các lỗi khác
                notify.error(message || "Có lỗi xảy ra khi mua vé. Vui lòng thử lại.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return {
        buyVoucher,
        isLoading
    };
};